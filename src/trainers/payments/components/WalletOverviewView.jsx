import { FiCheckCircle, FiClock, FiCreditCard, FiDollarSign, FiLock, FiPlusCircle, FiSend } from "react-icons/fi";
import { formatDate, formatMoney, getAccountLast4 } from "../paymentUtils";

function WalletChip({ label, value }) {
  return (
    <div className="bg-white/10 px-4 py-3">
      <div className="text-[10px] font-black uppercase tracking-wider text-white/55">{label}</div>
      <div className="mt-1 text-sm font-extrabold text-white">{value}</div>
    </div>
  );
}

function BalanceBucket({ label, value, helper, icon: Icon, tone = "light" }) {
  const dark = tone === "dark";
  return (
    <div className={["p-5 shadow-sm", dark ? "bg-slate-950 text-white" : "bg-white text-slate-950"].join(" ")}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className={["text-xs font-black uppercase tracking-wider", dark ? "text-white/45" : "text-slate-400"].join(" ")}>{label}</div>
          <div className="mt-2 text-2xl font-black">{value}</div>
        </div>
        <span className={["flex h-10 w-10 items-center justify-center rounded-full", dark ? "bg-white/10 text-emerald-200" : "bg-emerald-50 text-[#006b58]"].join(" ")}>
          <Icon />
        </span>
      </div>
      <p className={["mt-4 text-sm font-semibold leading-relaxed", dark ? "text-white/65" : "text-slate-500"].join(" ")}>{helper}</p>
    </div>
  );
}

function WalletRule({ icon: Icon, title, text }) {
  return (
    <div className="flex gap-3 bg-slate-50 p-4">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#006b58] shadow-sm">
        <Icon />
      </span>
      <div>
        <div className="text-sm font-extrabold text-slate-950">{title}</div>
        <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-500">{text}</p>
      </div>
    </div>
  );
}

export default function WalletOverviewView({ earnings, eligibility, payoutAccount, onAddToWallet, onRequestPayout, payoutBlocked }) {
  const accountLast4 = getAccountLast4(payoutAccount);
  const walletStatus = payoutBlocked ? "Action required" : "Ready to request";
  const walletBalance = Number(earnings.heldEarnings || 0);
  const eligibleToAdd = Number(earnings.payableEarnings || 0);
  const withdrawableAmount = walletBalance + eligibleToAdd;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <section className="bg-[#00342b] p-6 text-white shadow-sm">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
            <div>
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-100/70">
                <FiCreditCard />
                Trainer wallet
              </div>
              <div className="mt-6 text-sm font-semibold text-white/65">Wallet balance</div>
              <div className="mt-2 text-5xl font-black leading-none">{formatMoney(walletBalance)}</div>
              <p className="mt-4 max-w-xl text-sm font-semibold leading-relaxed text-white/70">
                Trainer can keep cleared earnings here and withdraw later whenever payout rules are satisfied.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:min-w-[340px]">
              <button
                type="button"
                onClick={onAddToWallet}
                disabled={eligibleToAdd <= 0}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-black text-[#00342b] transition-colors hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-55"
              >
                <FiPlusCircle />
                Add to wallet
              </button>
              <button
                type="button"
                onClick={() => onRequestPayout(withdrawableAmount)}
                disabled={payoutBlocked}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 text-sm font-black text-[#00342b] transition-colors hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-55"
              >
                <FiSend />
                Withdraw
              </button>
            </div>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <WalletChip label="Wallet status" value={walletStatus} />
            <WalletChip label="Eligible to add" value={formatMoney(eligibleToAdd)} />
            <WalletChip label="Account" value={`${payoutAccount.bankName} ${accountLast4}`} />
          </div>
        </section>

        <section className="bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-950">Next payout window</h3>
              <p className="mt-1 text-sm font-semibold text-slate-500">Trainer can request after the cycle is available.</p>
            </div>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-[#006b58]">
              <FiClock />
            </span>
          </div>
          <div className="mt-6 bg-slate-50 p-4">
            <div className="text-xs font-black uppercase tracking-wider text-slate-400">Request opens</div>
            <div className="mt-2 text-2xl font-black text-slate-950">{formatDate(eligibility.requestOpensAt)}</div>
          </div>
          <div className="mt-3 bg-slate-50 p-4">
            <div className="text-xs font-black uppercase tracking-wider text-slate-400">Processing time</div>
            <div className="mt-2 text-sm font-extrabold text-slate-700">{eligibility.processingTime}</div>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <BalanceBucket label="Total earned" value={formatMoney(earnings.totalEarnings)} helper="All trainer share earned from paid sessions." icon={FiDollarSign} />
        <BalanceBucket label="Eligible to add" value={formatMoney(eligibleToAdd)} helper={`Cleared from ${formatDate(eligibility.cycleStart)} - ${formatDate(eligibility.cycleEnd)}.`} icon={FiPlusCircle} />
        <BalanceBucket label="Pending" value={formatMoney(earnings.pendingEarnings)} helper="Amount waiting for cycle clearance." icon={FiClock} />
        <BalanceBucket label="Withdrawable" value={formatMoney(withdrawableAmount)} helper="Wallet balance plus eligible cleared earnings." icon={FiSend} tone="dark" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="bg-white p-5 shadow-sm">
          <h3 className="text-lg font-black text-slate-950">Payout account</h3>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="bg-slate-50 p-4">
              <div className="text-xs font-black uppercase tracking-wider text-slate-400">Bank</div>
              <div className="mt-1 font-extrabold text-slate-950">{payoutAccount.bankName}</div>
            </div>
            <div className="bg-slate-50 p-4">
              <div className="text-xs font-black uppercase tracking-wider text-slate-400">Account</div>
              <div className="mt-1 font-extrabold text-slate-950">Ending {accountLast4}</div>
            </div>
            <div className="bg-slate-50 p-4">
              <div className="text-xs font-black uppercase tracking-wider text-slate-400">Status</div>
              <div className="mt-1 font-extrabold uppercase text-emerald-700">{payoutAccount.status}</div>
            </div>
            <div className="bg-slate-50 p-4">
              <div className="text-xs font-black uppercase tracking-wider text-slate-400">Updated</div>
              <div className="mt-1 font-extrabold text-slate-950">{formatDate(payoutAccount.updatedAt)}</div>
            </div>
          </div>
        </section>

        <section className="bg-white p-5 shadow-sm">
          <h3 className="text-lg font-black text-slate-950">Wallet rules</h3>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <WalletRule icon={FiPlusCircle} title="Add after cycle" text="15-day cleared earnings can be moved into wallet." />
            <WalletRule icon={FiLock} title="Hold anytime" text="Trainer can keep wallet balance and withdraw later." />
            <WalletRule icon={FiCheckCircle} title="Withdraw request" text="Admin approves and pays to verified bank account." />
          </div>
        </section>
      </div>
    </div>
  );
}
