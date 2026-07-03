import { useMemo } from "react";
import { FiArrowLeft, FiCreditCard, FiSearch } from "react-icons/fi";
import { formatMoney, getEarningStatusClass } from "../paymentUtils";

const SESSION_PAGE_SIZE = 5;

function StatusPill({ status }) {
  return (
    <span className={["inline-flex w-fit rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider", getEarningStatusClass(status)].join(" ")}>
      {status || "pending"}
    </span>
  );
}

function getSessionKey(earning) {
  const title = String(earning?.sessionTitle || "Untitled session").trim().toLowerCase();
  return String(earning?.sessionId || earning?.sessionKey || title || "session");
}

function groupSessionEarnings(rows) {
  const map = new Map();
  rows.forEach((earning, index) => {
    const key = getSessionKey(earning);
    const current = map.get(key) || {
      sessionId: key,
      sessionTitle: earning.sessionTitle || "Untitled session",
      adminSetPrice: Number(earning.adminSetPrice || 0),
      trainerSharePercent: Number(earning.trainerSharePercent || 0),
      trainerEarning: 0,
      paidStudentCount: 0,
      statuses: new Set(),
      latestStatus: earning.status || "pending",
      rows: [],
    };

    current.adminSetPrice = current.adminSetPrice || Number(earning.adminSetPrice || 0);
    current.trainerSharePercent = current.trainerSharePercent || Number(earning.trainerSharePercent || 0);
    current.trainerEarning += Number(earning.trainerEarning || 0);
    current.paidStudentCount += Number(earning.paidStudents || earning.paidStudentCount || 1);
    current.statuses.add(earning.status || "pending");
    current.latestStatus = earning.status || current.latestStatus;
    current.rows.push({ ...earning, rowKey: earning.id || earning.earningId || `${key}-${index}` });
    map.set(key, current);
  });

  return Array.from(map.values()).map((session) => ({
    ...session,
    statusList: Array.from(session.statuses),
    status: session.statuses.size === 1 ? Array.from(session.statuses)[0] : session.latestStatus,
  }));
}

export default function SessionEarningsViews({
  sessionEarnings,
  sessionQuery,
  setSessionQuery,
  sessionStatusFilter,
  setSessionStatusFilter,
  sessionPage,
  setSessionPage,
  selectedSessionId,
  setSelectedSessionId,
}) {
  const groupedSessions = useMemo(() => groupSessionEarnings(sessionEarnings), [sessionEarnings]);
  const selectedSession = groupedSessions.find((session) => session.sessionId === selectedSessionId);
  const statusOptions = useMemo(
    () => ["all", ...new Set(groupedSessions.flatMap((session) => session.statusList || [session.status]))],
    [groupedSessions]
  );
  const filteredSessions = useMemo(() => {
    const query = sessionQuery.trim().toLowerCase();
    return groupedSessions.filter((session) => {
      const matchesQuery = !query || session.sessionTitle.toLowerCase().includes(query);
      const matchesStatus = sessionStatusFilter === "all" || (session.statusList || [session.status]).includes(sessionStatusFilter);
      return matchesQuery && matchesStatus;
    });
  }, [groupedSessions, sessionQuery, sessionStatusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredSessions.length / SESSION_PAGE_SIZE));
  const currentPage = Math.min(sessionPage, totalPages);
  const visibleSessions = filteredSessions.slice((currentPage - 1) * SESSION_PAGE_SIZE, currentPage * SESSION_PAGE_SIZE);

  if (selectedSessionId) {
    return <SessionEarningHistory session={selectedSession} onBack={() => setSelectedSessionId("")} />;
  }

  return (
    <div className="space-y-5">
      <div className="bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <h3 className="text-lg font-extrabold">Session-wise earnings</h3>
            <p className="mt-1 text-sm text-slate-500">Each session is shown once. Open a session to view its transaction earnings history.</p>
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
              {statusOptions.map((status) => (
                <option key={status} value={status}>{status === "all" ? "All status" : status}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 text-xs font-bold text-slate-500">Showing {visibleSessions.length} of {filteredSessions.length} sessions</div>
      </div>

      <div className="space-y-3">
        {visibleSessions.length === 0 ? (
          <div className="bg-white p-8 text-center shadow-sm">
            <FiCreditCard className="mx-auto text-4xl text-slate-300" />
            <div className="mt-3 text-lg font-extrabold">No session earnings found</div>
            <p className="mt-1 text-sm text-slate-500">Try another search or status filter.</p>
          </div>
        ) : visibleSessions.map((session) => (
          <article key={session.sessionId} className="bg-white p-5 shadow-sm">
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_0.7fr_0.7fr_0.8fr_auto] xl:items-center">
              <div>
                <h4 className="font-extrabold text-slate-950">{session.sessionTitle}</h4>
                <p className="mt-1 text-xs font-semibold text-slate-500">{session.rows.length} earning transaction{session.rows.length === 1 ? "" : "s"} inside this session.</p>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-500">Admin-set price</div>
                <div className="mt-1 font-extrabold">{formatMoney(session.adminSetPrice)}</div>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-500">Trainer share</div>
                <div className="mt-1 font-extrabold">{session.trainerSharePercent}%</div>
              </div>
              <div>
                <div className="text-xs font-bold text-emerald-700">Total earning</div>
                <div className="mt-1 text-lg font-extrabold text-emerald-900">{formatMoney(session.trainerEarning)}</div>
              </div>
              <div className="flex flex-col gap-2 xl:items-end">
                <StatusPill status={session.status} />
                <button type="button" onClick={() => setSelectedSessionId(session.sessionId)} className="h-9 rounded-xl bg-[#00342b] px-4 text-xs font-extrabold text-white hover:bg-[#004d40]">View earnings</button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="flex flex-col justify-between gap-3 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="text-sm font-bold text-slate-500">Page {currentPage} of {totalPages}</div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setSessionPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1} className="h-10 rounded-xl bg-slate-100 px-4 text-sm font-extrabold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50">Previous</button>
          <button type="button" onClick={() => setSessionPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages} className="h-10 rounded-xl bg-[#00342b] px-4 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-50">Next</button>
        </div>
      </div>
    </div>
  );
}

function SessionEarningHistory({ session, onBack }) {
  if (!session) {
    return (
      <div className="bg-white p-8 text-center shadow-sm">
        <div className="text-lg font-extrabold">Session earnings not found</div>
        <button type="button" onClick={onBack} className="mt-4 h-10 rounded-xl bg-slate-950 px-4 text-sm font-extrabold text-white">Back to sessions</button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="bg-white p-5 shadow-sm">
        <button type="button" onClick={onBack} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-extrabold text-slate-700 hover:bg-slate-50">
          <FiArrowLeft /> Back to session earnings
        </button>
        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <h3 className="text-xl font-extrabold text-slate-950">{session.sessionTitle}</h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">Transaction earnings history for this session only.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <Metric label="Students" value={session.paidStudentCount} />
            <Metric label="Price" value={formatMoney(session.adminSetPrice)} />
            <Metric label="Share" value={`${session.trainerSharePercent}%`} />
            <Metric label="Total earning" value={formatMoney(session.trainerEarning)} tone="emerald" />
          </div>
        </div>
      </div>

      <div className="overflow-hidden bg-white shadow-sm">
        <div className="grid grid-cols-1 gap-3 bg-slate-50 px-5 py-3 text-xs font-black uppercase tracking-wider text-slate-400 lg:grid-cols-[1fr_160px_160px_160px_120px]">
          <div>Reference</div><div>Admin price</div><div>Trainer share</div><div>Trainer earning</div><div>Payout Status</div>
        </div>
        <div className="divide-y divide-slate-100">
          {session.rows.map((earning) => (
            <div key={earning.rowKey} className="grid grid-cols-1 gap-3 px-5 py-4 text-sm font-semibold lg:grid-cols-[1fr_160px_160px_160px_120px] lg:items-center">
              <div>
                <div className="font-extrabold text-slate-950">{earning.studentName || earning.paymentId || earning.bookingId || earning.rowKey}</div>
                <div className="mt-1 text-xs text-slate-500">One-time student payment transaction</div>
              </div>
              <div>{formatMoney(earning.adminSetPrice)}</div>
              <div>{earning.trainerSharePercent}%</div>
              <div className="font-extrabold text-emerald-900">{formatMoney(earning.trainerEarning)}</div>
              <StatusPill status={earning.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, tone = "slate" }) {
  return <div className={tone === "emerald" ? "bg-emerald-50 p-3" : "bg-slate-50 p-3"}><div className={tone === "emerald" ? "text-xs font-black uppercase text-emerald-700" : "text-xs font-black uppercase text-slate-400"}>{label}</div><div className={tone === "emerald" ? "mt-1 font-extrabold text-emerald-900" : "mt-1 font-extrabold"}>{value}</div></div>;
}
