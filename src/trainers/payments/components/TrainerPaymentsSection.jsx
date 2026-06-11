import { useCallback, useEffect, useState } from "react";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiCreditCard,
  FiRefreshCw,
  FiSave,
  FiSearch,
  FiSend,
  FiShield,
} from "react-icons/fi";
import { toast } from "react-toastify";
import PayoutHistoryView from "./PayoutHistoryView";
import SessionEarningsViews from "./SessionEarningsViews";
import WalletOverviewView from "./WalletOverviewView";
import {
  createTrainerPayoutRequest,
  getTrainerPaymentSummary,
  getTrainerPayoutAccount,
  getTrainerPayoutRequests,
  getTrainerSessionEarningsList,
  saveTrainerPayoutAccount,
} from "../api/trainerPaymentsApi";
import {
  createAccountForm,
  formatDate,
  formatMoney,
  getAccountLast4,
  getEarningStatusClass,
  getPayoutBlockReason,
} from "../paymentUtils";

const inputClass =
  "mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-[#006b58] focus:ring-4 focus:ring-emerald-900/5";
const SESSION_PAGE_SIZE = 5;

const emptyEarnings = {
  totalEarnings: 0,
  pendingEarnings: 0,
  availableBalance: 0,
  payableEarnings: 0,
  lockedAmount: 0,
  requestedEarnings: 0,
  paidEarnings: 0,
  heldEarnings: 0,
  minimumPayoutAmount: 500,
  payoutCycle: "Every 15 days",
  sessionEarnings: [],
};

const emptyEligibility = {
  isWindowOpen: false,
  canRequestPayout: false,
  reason: "",
  cycleStart: "",
  cycleEnd: "",
  requestOpensAt: "",
  processingTime: "1-3 working days after admin approval",
};

const emptyPayoutAccount = {
  id: "",
  status: "missing",
  accountHolderName: "",
  bankName: "",
  accountNumber: "",
  accountNumberLast4: "",
  ifscCode: "",
  accountType: "Savings",
  phoneNumber: "",
  upiId: "",
  panNumber: "",
  rejectionReason: "",
  isLocked: false,
};

export default function TrainerPaymentsSection({ activeView = "wallet", isTrainerActive = true }) {
  const [earnings, setEarnings] = useState(emptyEarnings);
  const [eligibility, setEligibility] = useState(emptyEligibility);
  const [payouts, setPayouts] = useState([]);
  const [payoutAccount, setPayoutAccount] = useState(emptyPayoutAccount);
  const [accountForm, setAccountForm] = useState(() => createAccountForm(emptyPayoutAccount));
  const [accountErrors, setAccountErrors] = useState({});
  const [payoutRequests, setPayoutRequests] = useState([]);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [requestAmount, setRequestAmount] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingAccount, setSavingAccount] = useState(false);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [sessionQuery, setSessionQuery] = useState("");
  const [sessionStatusFilter, setSessionStatusFilter] = useState("all");
  const [sessionPage, setSessionPage] = useState(1);
  const [selectedSessionId, setSelectedSessionId] = useState("");

  const loadPaymentData = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setLoadError("");
    try {
      const [summaryResult, sessionEarningsResult, accountResult, requestsResult] = await Promise.allSettled([
        getTrainerPaymentSummary(),
        getTrainerSessionEarningsList({ limit: 100 }),
        getTrainerPayoutAccount(),
        getTrainerPayoutRequests({ limit: 100 }),
      ]);

      const summary = summaryResult.status === "fulfilled" ? summaryResult.value : null;
      const sessionEarnings = sessionEarningsResult.status === "fulfilled" ? sessionEarningsResult.value : [];
      const account = accountResult.status === "fulfilled" ? accountResult.value : emptyPayoutAccount;
      const requests = requestsResult.status === "fulfilled" ? requestsResult.value : [];

      setEarnings({ ...emptyEarnings, ...(summary?.earnings || {}), sessionEarnings });
      setEligibility({ ...emptyEligibility, ...(summary?.eligibility || {}) });
      setPayoutAccount({ ...emptyPayoutAccount, ...account });
      setAccountForm((prev) => {
        const nextAccount = { ...emptyPayoutAccount, ...account };
        const hasUnsavedInput = Object.values(prev).some((value) => String(value || "").trim());
        return hasUnsavedInput && accountResult.status === "rejected" ? prev : createAccountForm(nextAccount);
      });
      setPayoutRequests(requests);
      setPayouts(requests);
      setSessionPage(1);

      const failures = [summaryResult, sessionEarningsResult, accountResult, requestsResult]
        .filter((result) => result.status === "rejected")
        .map((result) => result.reason?.message)
        .filter(Boolean);
      if (failures.length) {
        setLoadError([...new Set(failures)].join(" "));
      }
    } catch (err) {
      const message = err?.message || "Unable to load trainer payment details.";
      setLoadError(message);
      toast.error(message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPaymentData();
  }, [loadPaymentData]);

  const payoutBlockReason = getPayoutBlockReason({
    earnings,
    eligibility,
    payoutAccount,
    payoutRequests,
    isTrainerActive,
  });

  const activeRequest = payoutRequests.find((request) =>
    ["requested", "approved", "processing"].includes(String(request.status || "").toLowerCase())
  );
  const accountLocked = Boolean(activeRequest) || Boolean(payoutAccount?.isLocked);
  const availableBalance = Number(
    earnings.availableBalance ?? Number(earnings.payableEarnings || 0) + Number(earnings.heldEarnings || 0)
  );
  const sessionEarnings = Array.isArray(earnings.sessionEarnings) ? earnings.sessionEarnings : [];
  const sessionStatusOptions = ["all", ...new Set(sessionEarnings.map((earning) => earning.status))];
  const filteredSessionEarnings = sessionEarnings.filter((earning) => {
    const query = sessionQuery.trim().toLowerCase();
    const matchesQuery = !query || earning.sessionTitle.toLowerCase().includes(query);
    const matchesStatus = sessionStatusFilter === "all" || earning.status === sessionStatusFilter;
    return matchesQuery && matchesStatus;
  });
  const totalSessionPages = Math.max(1, Math.ceil(filteredSessionEarnings.length / SESSION_PAGE_SIZE));
  const currentSessionPage = Math.min(sessionPage, totalSessionPages);
  const visibleSessionEarnings = filteredSessionEarnings.slice(
    (currentSessionPage - 1) * SESSION_PAGE_SIZE,
    currentSessionPage * SESSION_PAGE_SIZE
  );

  const handleAccountChange = (e) => {
    const { name, value } = e.target;
    setAccountForm((prev) => ({ ...prev, [name]: value }));
    setAccountErrors((prev) => ({ ...prev, [name]: "" }));
    setNotice("");
  };

  const validateAccountForm = () => {
    const errors = {};
    if (!accountForm.accountHolderName.trim()) errors.accountHolderName = "Required";
    if (!accountForm.bankName.trim()) errors.bankName = "Required";
    if (!accountForm.accountNumber.trim()) errors.accountNumber = "Required";
    if (accountForm.accountNumber !== accountForm.confirmAccountNumber) errors.confirmAccountNumber = "Account numbers must match";
    if (!accountForm.ifscCode.trim()) errors.ifscCode = "Required";
    if (!accountForm.accountType.trim()) errors.accountType = "Required";
    if (!accountForm.phoneNumber.trim()) errors.phoneNumber = "Required";
    if (accountForm.upiId && !/^[\w.-]+@[\w.-]+$/.test(accountForm.upiId.trim())) errors.upiId = "Invalid UPI ID";
    if (accountForm.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(accountForm.panNumber.trim().toUpperCase())) errors.panNumber = "Invalid PAN";
    setAccountErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const savePayoutAccount = async () => {
    if (accountLocked) {
      toast.warn("Payout account cannot be changed while a payout request is active.");
      return;
    }
    if (!validateAccountForm()) {
      toast.error("Please fix payout account details.");
      return;
    }
    setSavingAccount(true);
    try {
      const nextAccount = await saveTrainerPayoutAccount(
        {
          ...accountForm,
          ifscCode: accountForm.ifscCode.trim().toUpperCase(),
          panNumber: accountForm.panNumber.trim().toUpperCase(),
        },
        { hasExistingAccount: Boolean(payoutAccount.id) }
      );
      setPayoutAccount({ ...emptyPayoutAccount, ...nextAccount });
      setAccountForm(createAccountForm({ ...emptyPayoutAccount, ...nextAccount }));
      setNotice("Payout account details submitted. Admin verification is pending.");
      toast.success("Payout account submitted for verification.");
      await loadPaymentData({ silent: true });
    } catch (err) {
      toast.error(err?.message || "Unable to save payout account.");
    } finally {
      setSavingAccount(false);
    }
  };

  const openPayoutRequest = (amount) => {
    if (payoutBlockReason) {
      toast.warn(payoutBlockReason);
      return;
    }
    setRequestAmount(String(Math.min(Number(amount || availableBalance), availableBalance)));
    setRequestModalOpen(true);
  };

  const confirmPayoutRequest = async () => {
    const amount = Number(requestAmount || 0);
    if (amount < Number(earnings.minimumPayoutAmount || 0)) {
      toast.warn(`Minimum payout amount is ${formatMoney(earnings.minimumPayoutAmount)}.`);
      return;
    }
    if (amount <= 0 || amount > availableBalance) {
      toast.warn("Enter a valid payout request amount.");
      return;
    }
    setSubmittingRequest(true);
    try {
      await createTrainerPayoutRequest(amount);
      setRequestModalOpen(false);
      setRequestAmount("");
      setNotice("Payout request submitted. Admin approval is pending.");
      toast.success("Payout request submitted.");
      await loadPaymentData({ silent: true });
    } catch (err) {
      toast.error(err?.message || "Unable to submit payout request.");
    } finally {
      setSubmittingRequest(false);
    }
  };

  const renderHeader = () => (
    <div className="bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h2 className="text-xl font-extrabold text-slate-950">Trainer payments</h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-500">
            Track trainer-visible earnings, payout eligibility, account details, and request history.
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadPaymentData()}
          disabled={loading}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-extrabold text-white transition-colors hover:bg-[#00342b] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <FiRefreshCw className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>
      <div className="mt-5 grid grid-cols-1 gap-3 bg-slate-50 p-4 text-sm font-semibold text-slate-600 lg:grid-cols-3">
        <div><span className="block text-xs font-black uppercase tracking-wider text-slate-400">Student payment</span>Student pays once and attends daily until session ends.</div>
        <div><span className="block text-xs font-black uppercase tracking-wider text-slate-400">Admin control</span>Price and trainer share are controlled by admin.</div>
        <div><span className="block text-xs font-black uppercase tracking-wider text-slate-400">Manual payout</span>Admin verifies account, approves request, transfers funds, and adds UTR.</div>
      </div>
      {notice ? <div className="mt-4 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">{notice}</div> : null}
      {loadError ? <div className="mt-4 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{loadError}</div> : null}
    </div>
  );

  const renderWallet = () => (
    <WalletOverviewView
      earnings={earnings}
      eligibility={eligibility}
      payoutAccount={payoutAccount}
      onRequestPayout={openPayoutRequest}
      payoutBlocked={!!payoutBlockReason}
      payoutBlockReason={payoutBlockReason}
    />
  );

  const renderSessions = () => (
    <SessionEarningsViews
      sessionEarnings={sessionEarnings}
      sessionQuery={sessionQuery}
      setSessionQuery={setSessionQuery}
      sessionStatusFilter={sessionStatusFilter}
      setSessionStatusFilter={setSessionStatusFilter}
      sessionPage={sessionPage}
      setSessionPage={setSessionPage}
      selectedSessionId={selectedSessionId}
      setSelectedSessionId={setSelectedSessionId}
    />
  );

  const renderRequest = () => (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_0.9fr]">
      <div className="bg-white p-5 shadow-sm">
        <h3 className="text-lg font-extrabold">Payout request</h3>
        <div className="mt-5 text-4xl font-black text-slate-950">{formatMoney(availableBalance)}</div>
        <p className="mt-2 text-sm font-semibold text-slate-500">Request payout from cycle-cleared available earnings.</p>
        <div className="mt-5 space-y-3 text-sm font-semibold text-slate-600">
          <div className="flex justify-between bg-slate-50 p-3"><span>Cycle</span><span>{formatDate(eligibility.cycleStart)} - {formatDate(eligibility.cycleEnd)}</span></div>
          <div className="flex justify-between bg-slate-50 p-3"><span>Account</span><span>{payoutAccount.bankName} ending {getAccountLast4(payoutAccount)}</span></div>
          <div className="flex justify-between bg-slate-50 p-3"><span>Processing</span><span>{eligibility.processingTime}</span></div>
        </div>
        {payoutBlockReason ? <div className="mt-5 flex gap-2 bg-amber-50 p-4 text-sm font-bold text-amber-800"><FiAlertCircle className="mt-0.5" />{payoutBlockReason}</div> : null}
        <button type="button" onClick={() => openPayoutRequest()} disabled={!!payoutBlockReason || loading} className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#00342b] px-5 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-50">
          <FiSend /> Request payout
        </button>
      </div>
      <div className="bg-slate-950 p-5 text-white shadow-sm">
        <FiCheckCircle className="text-2xl text-emerald-300" />
        <h3 className="mt-4 text-lg font-extrabold">Request rules</h3>
        <div className="mt-4 space-y-3 text-sm font-semibold text-white/75">
          <p>Available only after the 15-day cycle opens.</p>
          <p>Account details must be verified.</p>
          <p>Only one requested, approved, or processing payout can exist at a time.</p>
          {activeRequest ? <p className="text-amber-200">Active request: {activeRequest.id}</p> : null}
        </div>
      </div>
    </div>
  );

  const renderAccount = () => (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="bg-[#00342b] p-5 text-white shadow-sm">
        <FiShield className="text-2xl text-white/80" />
        <h3 className="mt-4 text-lg font-extrabold">Account details</h3>
        <p className="mt-2 text-sm font-semibold leading-relaxed text-white/75">Wrong account details may delay or block payout. Existing payout requests keep the account snapshot saved at request time.</p>
        <div className="mt-5 bg-white/10 p-4 text-sm font-semibold">Current status: <span className="font-black uppercase">{payoutAccount.status}</span></div>
        {payoutAccount.rejectionReason ? <div className="mt-3 bg-red-500/15 p-4 text-sm font-bold text-red-50">{payoutAccount.rejectionReason}</div> : null}
        {accountLocked ? <div className="mt-3 bg-amber-400/15 p-4 text-sm font-bold text-amber-50">Account edits are locked while a payout request is active.</div> : null}
      </div>
      <div className="bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            ["accountHolderName", "Account holder name"],
            ["bankName", "Bank name"],
            ["accountNumber", "Account number"],
            ["confirmAccountNumber", "Confirm account number"],
            ["ifscCode", "IFSC code"],
            ["phoneNumber", "Phone number"],
            ["upiId", "UPI ID optional"],
            ["panNumber", "PAN optional"],
          ].map(([name, label]) => (
            <label key={name} className="block text-sm font-bold text-slate-600">
              {label}
              <input name={name} value={accountForm[name]} onChange={handleAccountChange} disabled={accountLocked || savingAccount} className={`${inputClass} disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400`} />
              {accountErrors[name] ? <span className="mt-1 block text-xs font-bold text-red-600">{accountErrors[name]}</span> : null}
            </label>
          ))}
          <label className="block text-sm font-bold text-slate-600">
            Account type
            <select name="accountType" value={accountForm.accountType} onChange={handleAccountChange} disabled={accountLocked || savingAccount} className={`${inputClass} disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400`}>
              <option>Savings</option>
              <option>Current</option>
            </select>
          </label>
        </div>
        <button type="button" onClick={savePayoutAccount} disabled={accountLocked || savingAccount} className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-50">
          <FiSave /> {savingAccount ? "Saving..." : "Save account details"}
        </button>
      </div>
    </div>
  );

  const renderPayouts = () => <PayoutHistoryView payouts={payouts} />;

  return (
    <section className="space-y-5">
      {requestModalOpen ? (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-extrabold">Confirm payout request</h3>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              Request manual payout to {payoutAccount.bankName} ending {getAccountLast4(payoutAccount)}.
            </p>
            <label className="mt-5 block text-sm font-bold text-slate-600">
              Withdrawal amount
              <input
                type="number"
                min={earnings.minimumPayoutAmount}
                max={availableBalance}
                value={requestAmount}
                onChange={(e) => setRequestAmount(e.target.value)}
                disabled={submittingRequest}
                className={`${inputClass} disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400`}
              />
            </label>
            <div className="mt-4 bg-slate-50 p-4 text-sm font-bold text-slate-700">
              Available to request: {formatMoney(availableBalance)}
            </div>
            <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={() => { setRequestModalOpen(false); setRequestAmount(""); }} className="h-10 rounded-xl bg-slate-100 px-4 text-sm font-extrabold text-slate-700">Cancel</button>
              <button type="button" onClick={confirmPayoutRequest} disabled={submittingRequest} className="h-10 rounded-xl bg-[#00342b] px-4 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-50">
                {submittingRequest ? "Submitting..." : "Submit request"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {renderHeader()}
      {loading ? <div className="bg-white p-5 text-sm font-bold text-slate-500 shadow-sm">Loading trainer payment details...</div> : null}
      {activeView === "wallet" ? renderWallet() : null}
      {activeView === "sessions" ? renderSessions() : null}
      {activeView === "request" ? renderRequest() : null}
      {activeView === "account" ? renderAccount() : null}
      {activeView === "payouts" ? renderPayouts() : null}
    </section>
  );
}



