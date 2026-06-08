import { useState } from "react";
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
import WalletOverviewView from "./WalletOverviewView";
import { trainerPaymentsMock } from "../mock/trainerPaymentsMock";
import { USE_MOCK_TRAINER_PAYMENTS } from "../paymentConstants";
import {
  createAccountForm,
  formatDate,
  formatMoney,
  getAccountLast4,
  getEarningStatusClass,
  getMockEarnings,
  getPayoutBlockReason,
} from "../paymentUtils";

const inputClass =
  "mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-[#006b58] focus:ring-4 focus:ring-emerald-900/5";
const SESSION_PAGE_SIZE = 5;

function StatusPill({ status }) {
  return (
    <span className={["inline-flex w-fit rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider", getEarningStatusClass(status)].join(" ")}>
      {status || "pending"}
    </span>
  );
}

export default function TrainerPaymentsSection({ activeView = "wallet", isTrainerActive = true }) {
  const [earnings, setEarnings] = useState(getMockEarnings(trainerPaymentsMock));
  const [eligibility, setEligibility] = useState(trainerPaymentsMock.eligibility);
  const [payouts, setPayouts] = useState(trainerPaymentsMock.payouts);
  const [payoutAccount, setPayoutAccount] = useState(trainerPaymentsMock.payoutAccount);
  const [accountForm, setAccountForm] = useState(() => createAccountForm(trainerPaymentsMock.payoutAccount));
  const [accountErrors, setAccountErrors] = useState({});
  const [payoutRequests, setPayoutRequests] = useState(trainerPaymentsMock.payoutRequests);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [requestAmount, setRequestAmount] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionQuery, setSessionQuery] = useState("");
  const [sessionStatusFilter, setSessionStatusFilter] = useState("all");
  const [sessionPage, setSessionPage] = useState(1);

  const payoutBlockReason = getPayoutBlockReason({
    earnings,
    eligibility,
    payoutAccount,
    payoutRequests,
    isTrainerActive,
  });

  const activeRequest = payoutRequests.find((request) =>
    ["requested", "processing"].includes(String(request.status || "").toLowerCase())
  );
  const sessionStatusOptions = ["all", ...new Set(earnings.sessionEarnings.map((earning) => earning.status))];
  const filteredSessionEarnings = earnings.sessionEarnings.filter((earning) => {
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

  const refreshMockPayments = () => {
    setLoading(true);
    window.setTimeout(() => {
      setEarnings(getMockEarnings(trainerPaymentsMock));
      setEligibility(trainerPaymentsMock.eligibility);
      setPayouts(trainerPaymentsMock.payouts);
      setPayoutAccount(trainerPaymentsMock.payoutAccount);
      setAccountForm(createAccountForm(trainerPaymentsMock.payoutAccount));
      setPayoutRequests(trainerPaymentsMock.payoutRequests);
      setAccountErrors({});
      setNotice("Mock payment data refreshed.");
      setLoading(false);
      setSessionPage(1);
    }, 250);
  };

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

  const savePayoutAccount = () => {
    if (!validateAccountForm()) {
      toast.error("Please fix payout account details.");
      return;
    }
    const accountNumber = accountForm.accountNumber.trim();
    const nextAccount = {
      ...accountForm,
      accountNumber,
      accountNumberLast4: accountNumber.slice(-4),
      ifscCode: accountForm.ifscCode.trim().toUpperCase(),
      panNumber: accountForm.panNumber.trim().toUpperCase(),
      status: "verified",
      updatedAt: new Date().toISOString().slice(0, 10),
    };
    setPayoutAccount(nextAccount);
    setAccountForm(createAccountForm(nextAccount));
    setNotice("Payout account details saved for frontend review.");
    toast.success("Payout account details saved.");
  };

  const addEligibleToWallet = () => {
    const amount = Number(earnings.payableEarnings || 0);
    if (amount <= 0) {
      toast.warn("No eligible earnings to add to wallet.");
      return;
    }
    setEarnings((prev) => ({
      ...prev,
      payableEarnings: 0,
      heldEarnings: Number(prev.heldEarnings || 0) + amount,
    }));
    setNotice(`${formatMoney(amount)} added to wallet balance.`);
    toast.success("Eligible earnings added to wallet.");
  };

  const openPayoutRequest = (amount) => {
    if (payoutBlockReason) {
      toast.warn(payoutBlockReason);
      return;
    }
    const withdrawableAmount = Number(earnings.heldEarnings || 0) + Number(earnings.payableEarnings || 0);
    setRequestAmount(String(Math.min(Number(amount || withdrawableAmount), withdrawableAmount)));
    setRequestModalOpen(true);
  };

  const confirmPayoutRequest = () => {
    const amount = Number(requestAmount || 0);
    const withdrawableAmount = Number(earnings.heldEarnings || 0) + Number(earnings.payableEarnings || 0);
    if (amount < Number(earnings.minimumPayoutAmount || 0)) {
      toast.warn(`Minimum payout amount is ${formatMoney(earnings.minimumPayoutAmount)}.`);
      return;
    }
    if (amount <= 0 || amount > withdrawableAmount) {
      toast.warn("Enter a valid wallet withdrawal amount.");
      return;
    }
    const request = {
      id: `PR-${Date.now()}`,
      amount,
      status: "requested",
      periodStart: eligibility.cycleStart,
      periodEnd: eligibility.cycleEnd,
      requestedAt: new Date().toISOString().slice(0, 10),
      paidAt: "",
      reference: "",
      adminNote: "Waiting for admin approval.",
    };
    setPayoutRequests((prev) => [request, ...prev]);
    setPayouts((prev) => [request, ...prev]);
    setEarnings((prev) => ({
      ...prev,
      heldEarnings: Math.max(0, Number(prev.heldEarnings || 0) - amount),
      payableEarnings: Math.max(0, Number(prev.payableEarnings || 0) - Math.max(0, amount - Number(prev.heldEarnings || 0))),
      requestedEarnings: Number(prev.requestedEarnings || 0) + amount,
    }));
    setRequestModalOpen(false);
    setRequestAmount("");
    setNotice("Payout request submitted. Admin approval is pending.");
    toast.success("Payout request submitted.");
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
          onClick={refreshMockPayments}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-extrabold text-white transition-colors hover:bg-[#00342b]"
        >
          <FiRefreshCw className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>
      <div className="mt-5 grid grid-cols-1 gap-3 bg-slate-50 p-4 text-sm font-semibold text-slate-600 lg:grid-cols-3">
        <div><span className="block text-xs font-black uppercase tracking-wider text-slate-400">Student payment</span>Student pays once and attends daily until session ends.</div>
        <div><span className="block text-xs font-black uppercase tracking-wider text-slate-400">Admin control</span>Price and trainer share are controlled by admin.</div>
        <div><span className="block text-xs font-black uppercase tracking-wider text-slate-400">Payout cycle</span>{earnings.payoutCycle} after eligible earnings become available.</div>
      </div>
      {notice ? <div className="mt-4 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">{notice}</div> : null}
      {USE_MOCK_TRAINER_PAYMENTS ? <div className="mt-3 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-800">Mock payment data is enabled for frontend review.</div> : null}
    </div>
  );

  const renderWallet = () => (
    <WalletOverviewView
      earnings={earnings}
      eligibility={eligibility}
      payoutAccount={payoutAccount}
      onAddToWallet={addEligibleToWallet}
      onRequestPayout={openPayoutRequest}
      payoutBlocked={!!payoutBlockReason}
    />
  );

  const renderSessions = () => (
    <div className="space-y-5">
      <div className="bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <h3 className="text-lg font-extrabold">Session-wise earnings</h3>
            <p className="mt-1 text-sm text-slate-500">
              Trainer view shows only price, trainer share, trainer earning, and earning status.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(220px,1fr)_160px] lg:w-[520px]">
            <label className="relative block">
              <span className="sr-only">Search session earnings</span>
              <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={sessionQuery}
                onChange={(e) => {
                  setSessionQuery(e.target.value);
                  setSessionPage(1);
                }}
                placeholder="Search session"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-semibold outline-none focus:border-[#006b58] focus:ring-4 focus:ring-emerald-900/5"
              />
            </label>
            <select
              value={sessionStatusFilter}
              onChange={(e) => {
                setSessionStatusFilter(e.target.value);
                setSessionPage(1);
              }}
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-extrabold text-slate-700 outline-none focus:border-[#006b58] focus:ring-4 focus:ring-emerald-900/5"
            >
              {sessionStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {status === "all" ? "All status" : status}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 text-xs font-bold text-slate-500">
          Showing {visibleSessionEarnings.length} of {filteredSessionEarnings.length} sessions
        </div>
      </div>

      <div className="space-y-3">
        {visibleSessionEarnings.length === 0 ? (
          <div className="bg-white p-8 text-center shadow-sm">
            <FiCreditCard className="mx-auto text-4xl text-slate-300" />
            <div className="mt-3 text-lg font-extrabold">No session earnings found</div>
            <p className="mt-1 text-sm text-slate-500">Try another search or status filter.</p>
          </div>
        ) : (
          visibleSessionEarnings.map((earning) => (
            <article key={earning.sessionId} className="bg-white p-5 shadow-sm">
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_0.7fr_0.7fr_0.8fr_auto] xl:items-center">
                <div>
                  <h4 className="font-extrabold text-slate-950">{earning.sessionTitle}</h4>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    One-time student payment. Access continues until the recurring session ends.
                  </p>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-500">Admin-set price</div>
                  <div className="mt-1 font-extrabold">{formatMoney(earning.adminSetPrice)}</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-500">Trainer share</div>
                  <div className="mt-1 font-extrabold">{earning.trainerSharePercent}%</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-700">Trainer earning</div>
                  <div className="mt-1 text-lg font-extrabold text-emerald-900">{formatMoney(earning.trainerEarning)}</div>
                </div>
                <StatusPill status={earning.status} />
              </div>
            </article>
          ))
        )}
      </div>

      <div className="flex flex-col justify-between gap-3 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="text-sm font-bold text-slate-500">
          Page {currentSessionPage} of {totalSessionPages}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setSessionPage((page) => Math.max(1, page - 1))}
            disabled={currentSessionPage === 1}
            className="h-10 rounded-xl bg-slate-100 px-4 text-sm font-extrabold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => setSessionPage((page) => Math.min(totalSessionPages, page + 1))}
            disabled={currentSessionPage === totalSessionPages}
            className="h-10 rounded-xl bg-[#00342b] px-4 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );

  const renderRequest = () => (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_0.9fr]">
      <div className="bg-white p-5 shadow-sm">
        <h3 className="text-lg font-extrabold">Payout request</h3>
        <div className="mt-5 text-4xl font-black text-slate-950">{formatMoney(Number(earnings.heldEarnings || 0) + Number(earnings.payableEarnings || 0))}</div>
        <p className="mt-2 text-sm font-semibold text-slate-500">Withdraw from wallet balance or newly eligible cycle earnings.</p>
        <div className="mt-5 space-y-3 text-sm font-semibold text-slate-600">
          <div className="flex justify-between bg-slate-50 p-3"><span>Cycle</span><span>{formatDate(eligibility.cycleStart)} - {formatDate(eligibility.cycleEnd)}</span></div>
          <div className="flex justify-between bg-slate-50 p-3"><span>Account</span><span>{payoutAccount.bankName} ending {getAccountLast4(payoutAccount)}</span></div>
          <div className="flex justify-between bg-slate-50 p-3"><span>Processing</span><span>{eligibility.processingTime}</span></div>
        </div>
        {payoutBlockReason ? <div className="mt-5 flex gap-2 bg-amber-50 p-4 text-sm font-bold text-amber-800"><FiAlertCircle className="mt-0.5" />{payoutBlockReason}</div> : null}
        <button type="button" onClick={() => openPayoutRequest()} disabled={!!payoutBlockReason} className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#00342b] px-5 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-50">
          <FiSend /> Request payout
        </button>
      </div>
      <div className="bg-slate-950 p-5 text-white shadow-sm">
        <FiCheckCircle className="text-2xl text-emerald-300" />
        <h3 className="mt-4 text-lg font-extrabold">Request rules</h3>
        <div className="mt-4 space-y-3 text-sm font-semibold text-white/75">
          <p>Available only after the 15-day cycle opens.</p>
          <p>Account details must be verified.</p>
          <p>Only one requested or processing payout can exist at a time.</p>
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
              <input name={name} value={accountForm[name]} onChange={handleAccountChange} className={inputClass} />
              {accountErrors[name] ? <span className="mt-1 block text-xs font-bold text-red-600">{accountErrors[name]}</span> : null}
            </label>
          ))}
          <label className="block text-sm font-bold text-slate-600">
            Account type
            <select name="accountType" value={accountForm.accountType} onChange={handleAccountChange} className={inputClass}>
              <option>Savings</option>
              <option>Current</option>
            </select>
          </label>
        </div>
        <button type="button" onClick={savePayoutAccount} className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-extrabold text-white">
          <FiSave /> Save account details
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
            <h3 className="text-xl font-extrabold">Confirm wallet withdrawal</h3>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              Withdraw from wallet to {payoutAccount.bankName} ending {getAccountLast4(payoutAccount)}.
            </p>
            <label className="mt-5 block text-sm font-bold text-slate-600">
              Withdrawal amount
              <input
                type="number"
                min={earnings.minimumPayoutAmount}
                max={Number(earnings.heldEarnings || 0) + Number(earnings.payableEarnings || 0)}
                value={requestAmount}
                onChange={(e) => setRequestAmount(e.target.value)}
                className={inputClass}
              />
            </label>
            <div className="mt-4 bg-slate-50 p-4 text-sm font-bold text-slate-700">
              Available to withdraw: {formatMoney(Number(earnings.heldEarnings || 0) + Number(earnings.payableEarnings || 0))}
            </div>
            <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={() => { setRequestModalOpen(false); setRequestAmount(""); }} className="h-10 rounded-xl bg-slate-100 px-4 text-sm font-extrabold text-slate-700">Cancel</button>
              <button type="button" onClick={confirmPayoutRequest} className="h-10 rounded-xl bg-[#00342b] px-4 text-sm font-extrabold text-white">Submit request</button>
            </div>
          </div>
        </div>
      ) : null}
      {renderHeader()}
      {activeView === "wallet" ? renderWallet() : null}
      {activeView === "sessions" ? renderSessions() : null}
      {activeView === "request" ? renderRequest() : null}
      {activeView === "account" ? renderAccount() : null}
      {activeView === "payouts" ? renderPayouts() : null}
    </section>
  );
}
