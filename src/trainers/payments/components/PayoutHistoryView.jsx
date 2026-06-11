import { useMemo, useState } from "react";
import { FiChevronLeft, FiChevronRight, FiDownload, FiFileText, FiSearch } from "react-icons/fi";
import { formatDate, formatMoney, getEarningStatusClass } from "../paymentUtils";

const PAGE_SIZE = 8;

function getAmount(payout) {
  return Number(payout.amount ?? payout.requestedAmount ?? 0);
}

function getReference(payout) {
  return payout.utrReference || payout.reference || "";
}

function getRequestedDate(payout) {
  return payout.requestedAt || payout.createdAt || "";
}

function getCompletedDate(payout) {
  return payout.paidAt || payout.manualPaidDate || payout.processingAt || payout.approvedAt || "";
}

function getPeriodLabel(payout) {
  const start = formatDate(payout.periodStart);
  const end = formatDate(payout.periodEnd);
  if (start === "-" && end === "-") return "-";
  return `${start} - ${end}`;
}

function statusLabel(status) {
  return String(status || "pending").replace(/_/g, " ");
}

function StatusPill({ status }) {
  return (
    <span
      className={[
        "inline-flex w-fit whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-black uppercase leading-4",
        getEarningStatusClass(status),
      ].join(" ")}
    >
      {statusLabel(status)}
    </span>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div className="border-r border-slate-200 px-4 py-3 last:border-r-0">
      <div className="text-[10px] font-black uppercase text-slate-400">{label}</div>
      <div className="mt-1 truncate text-sm font-extrabold text-slate-950">{value}</div>
    </div>
  );
}

export default function PayoutHistoryView({ payouts = [] }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [page, setPage] = useState(1);

  const statusOptions = useMemo(
    () => ["all", ...new Set(payouts.map((payout) => payout.status).filter(Boolean))],
    [payouts]
  );

  const filteredPayouts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const now = new Date();
    const cutoff = new Date(now);
    if (dateFilter === "30") cutoff.setDate(now.getDate() - 30);
    if (dateFilter === "90") cutoff.setDate(now.getDate() - 90);

    return payouts.filter((payout) => {
      const searchable = [
        payout.id,
        payout.status,
        payout.adminNote,
        payout.rejectionReason,
        getReference(payout),
        payout.payoutAccountSnapshot?.bankName,
        payout.payoutAccountSnapshot?.accountNumberLast4,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const requestedDate = new Date(getRequestedDate(payout));
      const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery);
      const matchesStatus = statusFilter === "all" || payout.status === statusFilter;
      const matchesDate =
        dateFilter === "all" ||
        (!Number.isNaN(requestedDate.getTime()) && requestedDate >= cutoff);
      return matchesQuery && matchesStatus && matchesDate;
    });
  }, [dateFilter, payouts, query, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredPayouts.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visiblePayouts = filteredPayouts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const paidTotal = payouts
    .filter((payout) => String(payout.status || "").toLowerCase() === "paid")
    .reduce((sum, payout) => sum + getAmount(payout), 0);
  const requestedTotal = payouts
    .filter((payout) => ["requested", "approved", "processing"].includes(String(payout.status || "").toLowerCase()))
    .reduce((sum, payout) => sum + getAmount(payout), 0);
  const latestReference = getReference(payouts.find((payout) => getReference(payout)) || {});

  const resetPage = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  return (
    <section className="overflow-hidden bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
          <div>
            <h3 className="text-base font-black text-slate-950">Payout history</h3>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              Search and verify payout requests, bank references, payout dates, and admin status.
            </p>
          </div>
          <button
            type="button"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-extrabold text-slate-700 hover:border-[#006b58] hover:text-[#00342b]"
          >
            <FiDownload />
            Export
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 overflow-hidden rounded-xl border border-slate-200 sm:grid-cols-3">
          <SummaryItem label="Paid total" value={formatMoney(paidTotal)} />
          <SummaryItem label="Open requested" value={formatMoney(requestedTotal)} />
          <SummaryItem label="Latest UTR" value={latestReference || "Pending"} />
        </div>
      </div>

      <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(260px,1fr)_180px_160px_auto] lg:items-center">
          <label className="relative block">
            <span className="sr-only">Search payout history</span>
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => resetPage(setQuery)(e.target.value)}
              placeholder="Search payout ID, UTR, bank, note"
              className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs font-semibold outline-none focus:border-[#006b58] focus:ring-4 focus:ring-emerald-900/5"
            />
          </label>

          <select
            value={statusFilter}
            onChange={(e) => resetPage(setStatusFilter)(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-extrabold capitalize text-slate-700 outline-none focus:border-[#006b58] focus:ring-4 focus:ring-emerald-900/5"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status === "all" ? "All status" : statusLabel(status)}
              </option>
            ))}
          </select>

          <select
            value={dateFilter}
            onChange={(e) => resetPage(setDateFilter)(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-extrabold text-slate-700 outline-none focus:border-[#006b58] focus:ring-4 focus:ring-emerald-900/5"
          >
            <option value="all">All dates</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>

          <div className="text-xs font-bold text-slate-500 lg:text-right">
            {filteredPayouts.length} result{filteredPayouts.length === 1 ? "" : "s"}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[1080px] w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-white text-[10px] font-black uppercase text-slate-400">
              <th className="px-4 py-3">Payout ID</th>
              <th className="px-4 py-3">Period</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Requested</th>
              <th className="px-4 py-3">Completed</th>
              <th className="px-4 py-3">UTR / Reference</th>
              <th className="px-4 py-3">Admin note</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {visiblePayouts.length ? (
              visiblePayouts.map((payout) => (
                <tr key={payout.id} className="hover:bg-slate-50/80">
                  <td className="max-w-[180px] px-4 py-3 align-top">
                    <div className="truncate font-black text-slate-950">{payout.id || "-"}</div>
                    <div className="mt-0.5 text-[10px] font-semibold text-slate-400">
                      {payout.payoutAccountSnapshot?.bankName || "Bank"} {payout.payoutAccountSnapshot?.accountNumberLast4 ? `*${payout.payoutAccountSnapshot.accountNumberLast4}` : ""}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top font-semibold text-slate-600">{getPeriodLabel(payout)}</td>
                  <td className="px-4 py-3 text-right align-top font-black text-slate-950">
                    {formatMoney(getAmount(payout))}
                  </td>
                  <td className="px-4 py-3 align-top"><StatusPill status={payout.status} /></td>
                  <td className="px-4 py-3 align-top font-semibold text-slate-600">{formatDate(getRequestedDate(payout))}</td>
                  <td className="px-4 py-3 align-top font-semibold text-slate-600">{formatDate(getCompletedDate(payout))}</td>
                  <td className="max-w-[190px] px-4 py-3 align-top">
                    <div className="truncate font-extrabold text-slate-700" title={getReference(payout) || "Reference pending"}>
                      {getReference(payout) || "Reference pending"}
                    </div>
                  </td>
                  <td className="max-w-[220px] px-4 py-3 align-top">
                    <div className="line-clamp-2 font-semibold text-slate-500" title={payout.adminNote || payout.rejectionReason || ""}>
                      {payout.adminNote || payout.rejectionReason || "-"}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center">
                  <FiFileText className="mx-auto text-3xl text-slate-300" />
                  <div className="mt-3 text-sm font-black text-slate-950">No payout records found</div>
                  <p className="mt-1 text-xs font-semibold text-slate-500">Try a different search, status, or date filter.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col justify-between gap-3 border-t border-slate-200 px-5 py-3 sm:flex-row sm:items-center">
        <div className="text-xs font-bold text-slate-500">
          Showing {visiblePayouts.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0}-
          {Math.min(currentPage * PAGE_SIZE, filteredPayouts.length)} of {filteredPayouts.length}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            disabled={currentPage === 1}
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-extrabold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiChevronLeft />
            Prev
          </button>
          <span className="min-w-16 text-center text-xs font-black text-slate-500">
            {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            disabled={currentPage === totalPages}
            className="inline-flex h-8 items-center gap-1 rounded-lg bg-[#00342b] px-3 text-xs font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
            <FiChevronRight />
          </button>
        </div>
      </div>
    </section>
  );
}
