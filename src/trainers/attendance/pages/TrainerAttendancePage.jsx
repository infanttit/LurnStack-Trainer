import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiRefreshCw,
  FiSearch,
  FiTrendingUp,
  FiUserCheck,
  FiUsers,
  FiXCircle,
} from "react-icons/fi";
import { PATHS } from "../../../app/router/paths";
import {
  getTrainerAttendanceSessions,
  getTrainerSessionAttendance,
} from "../api/trainerAttendanceApi";

const emptyReport = {
  sessionId: "",
  sessionTitle: "Session attendance",
  totalStudents: 0,
  presentCount: 0,
  lateCount: 0,
  absentCount: 0,
  attendedCount: 0,
  attendancePercentage: 0,
  students: [],
};

function formatPercent(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "0%";
  return `${number.toFixed(number % 1 === 0 ? 0 : 1)}%`;
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function statusClass(status) {
  const value = String(status || "").toLowerCase();
  if (value === "present") return "bg-emerald-50 text-emerald-700";
  if (value === "late") return "bg-amber-50 text-amber-700";
  return "bg-red-50 text-red-700";
}

function StatCard({ label, value, icon: Icon, tone = "slate" }) {
  const toneClass =
    tone === "green"
      ? "bg-emerald-50 text-emerald-700"
      : tone === "amber"
        ? "bg-amber-50 text-amber-700"
        : tone === "red"
          ? "bg-red-50 text-red-700"
          : "bg-slate-50 text-slate-700";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${toneClass}`}>
        <Icon />
      </div>
      <div className="mt-3 text-xl font-extrabold text-slate-950">{value}</div>
      <div className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500">{label}</div>
    </div>
  );
}

function ProgressBar({ value }) {
  const width = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
      <div className="h-full rounded-full bg-[#006b58]" style={{ width: `${width}%` }} />
    </div>
  );
}

export default function TrainerAttendancePage({ embedded = false }) {
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState("");
  const [report, setReport] = useState(emptyReport);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [sessionsError, setSessionsError] = useState("");
  const [reportError, setReportError] = useState("");

  useEffect(() => {
    let ignore = false;
    setLoadingSessions(true);
    setSessionsError("");
    getTrainerAttendanceSessions()
      .then((nextSessions) => {
        if (ignore) return;
        setSessions(nextSessions);
        const firstSessionId = nextSessions[0]?.id || "";
        if (firstSessionId) setSessionId(firstSessionId);
      })
      .catch((err) => {
        if (!ignore) setSessionsError(err?.message || "Unable to load your sessions.");
      })
      .finally(() => {
        if (!ignore) setLoadingSessions(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const selectedSession = useMemo(
    () => sessions.find((session) => session.id === sessionId),
    [sessionId, sessions]
  );

  const loadAttendance = async (e) => {
    e?.preventDefault();
    const safeSessionId = String(sessionId || "").trim();
    if (!safeSessionId) {
      setReportError("Please select or enter a session ID.");
      return;
    }

    setLoadingReport(true);
    setReportError("");
    try {
      const nextReport = await getTrainerSessionAttendance(safeSessionId);
      setReport({ ...emptyReport, sessionId: safeSessionId, ...nextReport });
    } catch (err) {
      setReportError(err?.message || "Unable to load session attendance.");
      setReport(emptyReport);
    } finally {
      setLoadingReport(false);
    }
  };

  return (
    <div className={embedded ? "text-slate-950" : "min-h-dvh bg-[#f4f7f6] text-slate-950"}>
      {!embedded ? (
        <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6">
          <Link
            to={PATHS.TRAINER_DASHBOARD}
            className="text-xs font-extrabold uppercase tracking-widest text-[#006b58]"
          >
            Trainer dashboard
          </Link>
          <div className="mt-3">
            <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              Trainer attendance
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
              Select one of your sessions or enter a session ID to view present, late, and absent students. Attendance is read-only.
            </p>
          </div>
        </div>
        </section>
      ) : null}

      <section className={embedded ? "space-y-5" : "mx-auto max-w-7xl px-4 py-6 sm:px-6"}>
        {embedded ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
              <div>
                <h2 className="text-xl font-extrabold text-slate-950">Attendance</h2>
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500">
                  Select one of your sessions or enter a session ID to view present, late, and absent students.
                </p>
              </div>
              <div className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-extrabold uppercase tracking-wider text-emerald-700">
                Read only
              </div>
            </div>
          </div>
        ) : null}

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <form onSubmit={loadAttendance} className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
            <label>
              <span className="text-xs font-extrabold uppercase tracking-widest text-slate-500">
                Select session
              </span>
              <select
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-[#006b58] focus:ring-4 focus:ring-emerald-900/5"
              >
                <option value="">Choose session</option>
                {sessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.title || session.courseTitle}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="text-xs font-extrabold uppercase tracking-widest text-slate-500">
                Or enter session ID
              </span>
              <input
                type="text"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                placeholder="Session ID"
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-[#006b58] focus:ring-4 focus:ring-emerald-900/5"
              />
            </label>

            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#00342b] px-5 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loadingReport}
            >
              {loadingReport ? <FiRefreshCw className="animate-spin" /> : <FiSearch />}
              View attendance
            </button>
          </form>

          {selectedSession ? (
            <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
              Selected: {selectedSession.courseTitle} - {selectedSession.title}
            </div>
          ) : null}

          {sessionsError ? (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
              <FiAlertCircle className="mt-0.5 flex-shrink-0" />
              <span>{sessionsError}</span>
            </div>
          ) : null}

          {loadingSessions ? (
            <div className="mt-4 text-sm font-semibold text-slate-500">Loading your sessions...</div>
          ) : null}
        </div>

        {reportError ? (
          <div className="mt-5 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            <FiAlertCircle className="mt-0.5 flex-shrink-0" />
            <span>{reportError}</span>
          </div>
        ) : null}

        {report.sessionTitle !== emptyReport.sessionTitle ? (
          <div className="mt-6 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-xl font-extrabold">{report.sessionTitle}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Present and late can appear immediately. Absent appears after session end and finalization.
                  </p>
                </div>
                <div className="min-w-44">
                  <div className="mb-1 text-sm font-extrabold">{formatPercent(report.attendancePercentage)}</div>
                  <ProgressBar value={report.attendancePercentage} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
              <StatCard label="Total Students" value={report.totalStudents} icon={FiUsers} />
              <StatCard label="Present" value={report.presentCount} icon={FiCheckCircle} tone="green" />
              <StatCard label="Late" value={report.lateCount} icon={FiClock} tone="amber" />
              <StatCard label="Absent" value={report.absentCount} icon={FiXCircle} tone="red" />
              <StatCard label="Attended" value={report.attendedCount} icon={FiUserCheck} tone="green" />
              <StatCard
                label="Attendance"
                value={formatPercent(report.attendancePercentage)}
                icon={FiTrendingUp}
                tone="green"
              />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <h2 className="text-lg font-extrabold">Student attendance</h2>
              <p className="mt-1 text-sm text-slate-500">
                Trainer can view student name, email, status, join times, and join count only.
              </p>

              <div className="mt-5 overflow-x-auto">
                {report.students.length ? (
                  <table className="min-w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                        <th className="px-3 py-3 font-extrabold">Student name</th>
                        <th className="px-3 py-3 font-extrabold">Email</th>
                        <th className="px-3 py-3 font-extrabold">Status</th>
                        <th className="px-3 py-3 font-extrabold">First joined</th>
                        <th className="px-3 py-3 font-extrabold">Last joined</th>
                        <th className="px-3 py-3 font-extrabold">Join count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.students.map((student) => (
                        <tr key={student.studentId || student.email} className="border-b border-slate-100">
                          <td className="px-3 py-3 font-extrabold text-slate-900">{student.fullName}</td>
                          <td className="px-3 py-3 font-semibold text-slate-500">{student.email || "-"}</td>
                          <td className="px-3 py-3">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-extrabold capitalize ${statusClass(student.status)}`}>
                              {student.status}
                            </span>
                          </td>
                          <td className="px-3 py-3">{formatDateTime(student.firstJoinedAt)}</td>
                          <td className="px-3 py-3">{formatDateTime(student.lastJoinedAt)}</td>
                          <td className="px-3 py-3">{student.joinCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                    <div className="text-base font-extrabold text-slate-900">No student attendance yet</div>
                    <p className="mt-1 text-sm text-slate-500">
                      Student records appear when attendance is recorded for this session.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
