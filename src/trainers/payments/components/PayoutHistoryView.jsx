import { useMemo, useState } from "react";
import { FiCheckCircle, FiClock, FiCreditCard, FiFileText, FiSearch } from "react-icons/fi";
import { formatDate, formatMoney, getEarningStatusClass } from "../paymentUtils";

const PAGE_SIZE = 5;

function HistoryStatus({ status }) {
  return (
    <span className={["inline-flex w-fit rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider", getEarningStatusClass(status)].join(" ")}>
      {status || "pending"}
    </span>
  );
}

function HistoryMetric({ label, value, icon: Icon }) {
  return (
    <div className="bg-slate-50 px-4 py-3">
      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400">
        <Icon className="text-[#006b58]" />
        {label}
      </div>
      <div className="mt-2 text-lg font-extrabold text-slate-950">{value}</div>
    </div>
  );
}

function getTimelineLabel(payout) {
  if (payout.paidAt) return `Paid on ${formatDate(payout.paidAt)}`;
  if (payout.status === "payable") return "Ready for trainer request";
  return `Requested on ${formatDate(payout.requestedAt)}`;
}

export default function PayoutHistoryView({ payouts = [] }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const statusOptions = useMemo(() => ["all", ...new Set(payouts.map((payout) => payout.status).filter(Boolean))], [payouts]);
  const filteredPayouts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return payouts.filter((payout) => {
      const searchable = [payout.id, payout.reference, payout.adminNote, payout.status]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery);
      const matchesStatus = statusFilter === "all" || payout.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [payouts, query, statusFilter]);
  const totalPages = Math.max(1, Math.ceil(filteredPayouts.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visiblePayouts = filteredPayouts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const paidTotal = payouts
    .filter((payout) => String(payout.status || "").toLowerCase() === "paid")
    .reduce((sum, payout) => sum + Number(payout.amount || 0), 0);
  const pendingCount = payouts.filter((payout) => String(payout.status || "").toLowerCase() !== "paid").length;
  const latestPayout = payouts.find((payout) => payout.paidAt);

  return (
    <div className="bg-white p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
        <div>
          <h3 className="text-xl font-extrabold text-slate-950">Payout history</h3>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Review requested, payable, and completed payout cycles with reference details.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(240px,1fr)_170px] xl:w-[560px]">
          <label className="relative block">
            <span className="sr-only">Search payout history</span>
            <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search reference or payout ID"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-semibold outline-none focus:border-[#006b58] focus:ring-4 focus:ring-emerald-900/5"
            />
          </label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-extrabold text-slate-700 outline-none focus:border-[#006b58] focus:ring-4 focus:ring-emerald-900/5"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status === "all" ? "All payouts" : status}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
        <HistoryMetric label="Total paid" value={formatMoney(paidTotal)} icon={FiCreditCard} />
        <HistoryMetric label="Open items" value={`${pendingCount} payout${pendingCount === 1 ? "" : "s"}`} icon={FiClock} />
        <HistoryMetric label="Latest reference" value={latestPayout?.reference || "Pending"} icon={FiFileText} />
      </div>

      <div className="mt-6 overflow-hidden border-y border-slate-100">
        <div className="hidden grid-cols-[minmax(320px,1.4fr)_170px_minmax(210px,0.9fr)_230px] gap-6 border-b border-slate-100 bg-slate-50 px-5 py-3 text-xs font-black uppercase tracking-wider text-slate-400 xl:grid">
          <div>Payout cycle</div>
          <div>Amount</div>
          <div>Reference</div>
          <div>Timeline</div>
        </div>
        {filteredPayouts.length === 0 ? (
          <div className="py-12 text-center">
            <FiFileText className="mx-auto text-4xl text-slate-300" />
            <div className="mt-3 text-lg font-extrabold text-slate-950">No payout records found</div>
            <p className="mt-1 text-sm font-semibold text-slate-500">Try another search or status filter.</p>
          </div>
        ) : (
          visiblePayouts.map((payout) => (
            <article key={payout.id} className="border-b border-slate-100 px-5 py-5 last:border-b-0">
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(320px,1.4fr)_170px_minmax(210px,0.9fr)_230px] xl:items-center xl:gap-6">
                <div>
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#00342b] text-white">
                      {payout.status === "paid" ? <FiCheckCircle /> : <FiClock />}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <h4 className="text-sm font-black text-slate-950">{payout.id}</h4>
                        <HistoryStatus status={payout.status} />
                      </div>
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        Cycle {formatDate(payout.periodStart)} - {formatDate(payout.periodEnd)}
                      </p>
                      <p className="mt-2 text-xs font-semibold text-slate-500">{payout.adminNote || "No admin note added."}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-black uppercase tracking-wider text-slate-400 xl:hidden">Amount</div>
                  <div className="mt-1 text-xl font-extrabold text-slate-950">{formatMoney(payout.amount)}</div>
                </div>
                <div>
                  <div className="text-xs font-black uppercase tracking-wider text-slate-400 xl:hidden">Reference</div>
                  <div className="mt-1 break-words text-sm font-extrabold text-slate-700">{payout.reference || "Reference pending"}</div>
                </div>
                <div className="bg-slate-50 px-4 py-3 text-sm font-extrabold text-slate-700">
                  {getTimelineLabel(payout)}
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      <div className="flex flex-col justify-between gap-3 pt-4 sm:flex-row sm:items-center">
        <div className="text-sm font-bold text-slate-500">
          Showing {visiblePayouts.length} of {filteredPayouts.length} payouts. Page {currentPage} of {totalPages}.
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            disabled={currentPage === 1}
            className="h-10 rounded-xl bg-slate-100 px-4 text-sm font-extrabold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            disabled={currentPage === totalPages}
            className="h-10 rounded-xl bg-[#00342b] px-4 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
