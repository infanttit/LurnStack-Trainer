import { useEffect, useMemo, useState } from "react";
import {
  getTrainerAttendanceSessions,
  getTrainerSessionAttendance,
} from "../api/trainerAttendanceApi";



function todayKey() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function formatDate(dateKey) {
  const date = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(student) {
  const seconds = Number(student.durationSeconds);
  const minutes = Number(student.durationMinutes);
  const totalMinutes = Number.isFinite(seconds) && seconds > 0
    ? Math.floor(seconds / 60)
    : Number.isFinite(minutes)
      ? minutes
      : 0;

  if (totalMinutes <= 0) return "-";

  let formattedTime = `${totalMinutes} min`;
  if (totalMinutes >= 60) {
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    formattedTime = mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  }

  // Show "~" prefix when duration was estimated from session end time
  return student.durationEstimated ? `~${formattedTime}` : formattedTime;
}

function statusBadgeClass(status) {
  if (status === "Present") return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100";
  if (status === "Tracking") return "bg-blue-50 text-blue-700 ring-1 ring-blue-100";
  if (status === "Rescheduled") return "bg-orange-50 text-orange-700 ring-1 ring-orange-100";
  return "bg-red-50 text-red-700 ring-1 ring-red-100";
}

function SummaryCard({ label, value, tone = "slate" }) {
  const toneClass =
    tone === "green"
      ? "bg-emerald-50 text-emerald-700"
      : tone === "red"
        ? "bg-red-50 text-red-700"
        : tone === "teal"
          ? "bg-teal-50 text-teal-700"
          : "bg-slate-50 text-slate-700";

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className={`mb-4 inline-flex h-9 w-9 items-center justify-center rounded-md text-sm font-black ${toneClass}`}>
        {label.slice(0, 1)}
      </div>
      <div className="text-2xl font-black text-slate-950">{value}</div>
      <div className="mt-1 text-xs font-extrabold uppercase tracking-wider text-slate-500">{label}</div>
    </div>
  );
}

function normalizeTableStudent(student) {
  const isEstimated = Boolean(student.durationEstimated);
  let leaveTimeText = "-";
  if (student.isLeaveTimeNull) {
    leaveTimeText = "Active";
  } else if (student.leaveTime && student.leaveTime !== student.joinTime) {
    leaveTimeText = formatTime(student.leaveTime);
  }

  let statusLabel = "Absent";
  if (student.status === "tracking" || student.status === "pending") statusLabel = "Tracking";
  else if (student.status === "rescheduled") statusLabel = "Rescheduled";
  else if (student.status === "present") statusLabel = "Present";

  return {
    name: student.fullName || "Student",
    email: student.email || "",
    status: statusLabel,
    joinTime: formatTime(student.joinTime),
    leaveTime: leaveTimeText,
    duration: formatDuration(student),
    durationEstimated: isEstimated,
    joinCount: Number(student.joinCount) || 0,
  };
}

export default function TrainerAttendancePage({ embedded = false }) {
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [dateOption, setDateOption] = useState("Today");
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [reports, setReports] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError("");
    getTrainerAttendanceSessions()
      .then((nextSessions) => {
        if (ignore) return;
        setSessions(nextSessions);
        setSelectedSessionId(nextSessions[0]?.id || "");
      })
      .catch((err) => {
        if (!ignore) setError(err?.message || "Unable to load sessions.");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const queryDate = useMemo(() => {
    if (dateOption === "Total") return "";
    if (dateOption === "Today") return todayKey();
    if (dateOption === "Yesterday") {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    }
    if (dateOption === "Last week") return "last_week";
    return selectedDate;
  }, [dateOption, selectedDate]);

  useEffect(() => {
    if (!selectedSessionId) {
      setReports([]);
      return;
    }

    let ignore = false;
    setActiveFilter("all");
    setLoading(true);
    setError("");
    getTrainerSessionAttendance(selectedSessionId, queryDate)
      .then((nextReports) => {
        if (!ignore) setReports(Array.isArray(nextReports) ? nextReports : [nextReports]);
      })
      .catch((err) => {
        if (!ignore) {
          setReports([]);
          setError(err?.message || "Unable to load attendance.");
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [queryDate, selectedSessionId]);

  const selectedSession = useMemo(
    () => sessions.find((session) => session.id === selectedSessionId),
    [selectedSessionId, sessions]
  );

  const activeReports = useMemo(() => {
    return reports;
  }, [reports]);



  const summary = useMemo(() => {
    const studentMap = new Map();
    activeReports.forEach((r) => {
      (r.students || []).forEach((s) => {
        const existing = studentMap.get(s.studentId || s.email || s.fullName);
        if (!existing || s.status === "present") {
          studentMap.set(s.studentId || s.email || s.fullName, s);
        }
      });
    });
    const uniqueStudents = Array.from(studentMap.values());
    const total = uniqueStudents.length;
    const present = uniqueStudents.filter((s) => s.status === "present").length;
    const absent = uniqueStudents.filter((s) => s.status === "absent").length;
    const tracking = uniqueStudents.filter((s) => s.status === "tracking").length;
    const rescheduled = uniqueStudents.filter((s) => s.status === "rescheduled").length;
    
    // Attendance % ignores rescheduled records and tracking sessions where final status isn't known
    const resolvable = present + absent;
    const attendance = resolvable ? Math.round((present / resolvable) * 100) : 0;
    
    return { total, present, absent, tracking, rescheduled, attendance };
  }, [activeReports]);

  const filterTabs = [
    { id: "all", label: "All", count: summary.total },
    { id: "present", label: "Present", count: summary.present },
    { id: "absent", label: "Absent", count: summary.absent },
  ];
  if (summary.tracking > 0) filterTabs.push({ id: "tracking", label: "Tracking", count: summary.tracking });
  if (summary.rescheduled > 0) filterTabs.push({ id: "rescheduled", label: "Rescheduled", count: summary.rescheduled });

  const emptyMessage =
    activeFilter === "present"
      ? "All students are present for this session!"
      : activeFilter === "absent"
        ? "No absent students for this session!"
        : activeFilter === "tracking"
          ? "No active students tracking right now."
          : activeFilter === "rescheduled"
            ? "No rescheduled sessions found."
            : "No attendance data found for this date.";


  return (
    <div className={embedded ? "text-slate-950" : "min-h-dvh bg-slate-50 px-4 py-6 text-slate-950 sm:px-6"}>
      <div className={embedded ? "space-y-5" : "mx-auto max-w-7xl space-y-5"}>
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label>
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">SESSION</span>
              <select
                value={selectedSessionId}
                onChange={(event) => setSelectedSessionId(event.target.value)}
                className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 outline-none transition focus:border-teal-700 focus:ring-4 focus:ring-teal-900/10"
              >
                <option value="">Select session</option>
                {sessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.title || session.courseTitle}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">DATE</span>
              <div className="flex gap-2">
                <select
                  value={dateOption}
                  onChange={(event) => setDateOption(event.target.value)}
                  className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 outline-none transition focus:border-teal-700 focus:ring-4 focus:ring-teal-900/10"
                >
                  <option value="Total">Total</option>
                  <option value="Today">Today</option>
                  <option value="Yesterday">Yesterday</option>
                  <option value="Last week">Last week</option>
                  <option value="Custom">Custom</option>
                </select>
                {dateOption === "Custom" && (
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(event) => setSelectedDate(event.target.value)}
                    className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 outline-none transition focus:border-teal-700 focus:ring-4 focus:ring-teal-900/10"
                  />
                )}
              </div>
            </label>
          </div>
        </section>

        {error ? (
          <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {error}
          </div>
        ) : null}

        <div className="space-y-5 animate-[fade-in_180ms_ease-out]">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-2xl font-black tracking-tight text-slate-950">
              {selectedSession?.title || selectedSession?.courseTitle || "Attendance"}
            </h2>
            <div className="mt-3 space-y-1 text-sm font-bold text-slate-600">
              <div>{["Total", "Last week"].includes(dateOption) ? dateOption : formatDate(queryDate)}</div>
              <div>
                {formatTime(activeReports[0]?.scheduledAt || selectedSession?.scheduledAt)}
                {" - "}
                {formatTime(activeReports[activeReports.length - 1]?.endedAt || selectedSession?.endedAt)}
              </div>
            </div>
          </section>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <SummaryCard label="Total students" value={summary.total} />
            <SummaryCard label="Present" value={summary.present} tone="green" />
            <SummaryCard label="Absent" value={summary.absent} tone="red" />
            <SummaryCard label="Attendance %" value={`${summary.attendance}%`} tone="teal" />
          </div>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <h2 className="text-lg font-black text-slate-950">Student Attendance</h2>
              </div>
              <div className="flex flex-wrap justify-start gap-2 sm:justify-end">
                {filterTabs.map((tab) => {
                  const isActive = activeFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveFilter(tab.id)}
                      className={`rounded-full px-4 py-2 text-xs font-black transition ${isActive
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "border border-slate-200 bg-transparent text-slate-500 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                        }`}
                    >
                      {tab.label} ({tab.count})
                    </button>
                  );
                })}
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-sm font-bold text-slate-500">Loading attendance...</div>
            ) : activeReports.length ? (
              <div className="space-y-8">
                {activeReports.map((report, idx) => {
                  let rStudents = (report.students || []).map(normalizeTableStudent);
                  if (activeFilter === "present") rStudents = rStudents.filter((s) => s.status === "Present");
                  if (activeFilter === "absent") rStudents = rStudents.filter((s) => s.status === "Absent");
                  
                  if (rStudents.length === 0) return null;

                  return (
                    <div key={idx} className="overflow-x-auto rounded-lg border border-slate-200">
                      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-700">
                          {formatDate((report.sessionDate || report.scheduledAt || selectedSession?.scheduledAt || "").slice(0, 10))} • {formatTime(report.scheduledAt || selectedSession?.scheduledAt)} - {formatTime(report.endedAt || selectedSession?.endedAt)}
                        </h3>
                        {report.status === "rescheduled" && (
                          <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-black text-orange-700 ring-1 ring-orange-200">
                            Rescheduled
                          </span>
                        )}
                      </div>
                      <table className="min-w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 bg-white text-xs uppercase tracking-wider text-slate-500">
                            <th className="px-3 py-3 font-black">Name</th>
                            <th className="px-3 py-3 font-black">Status</th>
                            <th className="px-3 py-3 font-black">Join</th>
                            <th className="px-3 py-3 font-black">Leave</th>
                            <th className="px-3 py-3 font-black">Joins</th>
                            <th className="px-3 py-3 font-black">Duration</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white animate-[fade-in_180ms_ease-out]">
                          {rStudents.map((student) => (
                            <tr key={`${student.name}-${student.joinTime}`} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                              <td className="px-3 py-3 font-extrabold text-slate-900">{student.name}</td>
                              <td className="px-3 py-3">
                                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ${statusBadgeClass(student.status)}`}>
                                  {student.status}
                                </span>
                              </td>
                              <td className="px-3 py-3 font-semibold text-slate-600">{student.joinTime}</td>
                              <td className="px-3 py-3 font-semibold text-slate-600">{student.leaveTime}</td>
                              <td className="px-3 py-3">
                                {student.joinCount > 0 ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-black text-indigo-700 ring-1 ring-indigo-100">
                                    &#8635; {student.joinCount}×
                                  </span>
                                ) : (
                                  <span className="text-sm font-semibold text-slate-400">-</span>
                                )}
                              </td>
                              <td className="px-3 py-3 font-semibold text-slate-600">{student.duration}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex min-h-64 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 text-center">
                <div className="text-lg font-black text-slate-950">{emptyMessage}</div>
              </div>
            )}
          </section>
        </div>
      </div>
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
