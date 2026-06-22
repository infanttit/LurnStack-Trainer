import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiRefreshCw,
  FiSearch,
  FiTrendingUp,
  FiUsers,
  FiXCircle,
  FiPlusCircle,
  FiBookOpen,
  FiCalendar,
  FiAward,
  FiArrowLeft,
  FiFilter,
  FiClock
} from "react-icons/fi";
import { PATHS } from "../../../app/router/paths";
import { getTrainerSession } from "../../recurring/api/trainerSessionsApi";
import {
  getDailyAttendance,
  extendSessionOccurrence,
  getTrainerSessionAttendance,
  getCourseStudentAttendance,
  getAttendanceEligibility
} from "../api/trainerAttendanceApi";

const emptyDailyReport = {
  session: null,
  summary: { totalStudents: 0, present: 0, absent: 0, attendancePercentage: 0 },
  students: [],
};

function formatPercent(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "0%";
  return `${number.toFixed(number % 1 === 0 ? 0 : 1)}%`;
}

// Only used for occurrences table (not daily strings)
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
  if (value === "present") return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  if (value === "late") return "bg-amber-50 text-amber-700 border border-amber-200";
  return "bg-red-50 text-red-700 border border-red-200";
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
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${toneClass}`}>
        <Icon className="text-lg" />
      </div>
      <div className="mt-4 text-2xl font-black text-slate-950">{value}</div>
      <div className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500">{label}</div>
    </div>
  );
}

export default function TrainerSessionHistoryPage() {
  const { sessionId } = useParams();
  const [activeTab, setActiveTab] = useState("daily"); // "daily", "history", "eligibility"
  
  const [sessionInfo, setSessionInfo] = useState(null);
  const [courseId, setCourseId] = useState(null);
  const [globalLoading, setGlobalLoading] = useState(true);

  // -- Daily Attendance State --
  const getISTDateString = () => {
    const date = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' });
    return formatter.format(date);
  };
  const [date, setDate] = useState(() => getISTDateString());
  const [dailyReport, setDailyReport] = useState(emptyDailyReport);
  const [loadingDaily, setLoadingDaily] = useState(false);
  const [dailyError, setDailyError] = useState("");
  const [extending, setExtending] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [extraMinutes, setExtraMinutes] = useState(15);
  
  // -- Student Details Modal State --
  const [selectedStudent, setSelectedStudent] = useState(null);

  // -- History & Eligibility State --
  const [sessionSummary, setSessionSummary] = useState(null);
  const [courseStudents, setCourseStudents] = useState([]);
  const [eligibilityData, setEligibilityData] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState("");
  
  // Filters
  const [filterName, setFilterName] = useState("");

  useEffect(() => {
    let ignore = false;
    
    // Load session info first
    getTrainerSession(sessionId)
      .then(res => {
        if (!ignore) {
          setSessionInfo(res);
          setCourseId(res.courseId);
          setGlobalLoading(false);
        }
      })
      .catch(() => {
        if (!ignore) {
          toast.error("Unable to load session details.");
          setGlobalLoading(false);
        }
      });

    return () => { ignore = true; };
  }, [sessionId]);

  // Load Daily Attendance
  const loadDailyAttendance = async (d) => {
    if (!sessionId || !d) return;
    setLoadingDaily(true);
    setDailyError("");
    try {
      const data = await getDailyAttendance(sessionId, d);
      if (data.emptyState) {
        setDailyReport(emptyDailyReport);
        setDailyError(data.message || "No attendance data available for this date.");
      } else {
        setDailyReport(data);
      }
    } catch (err) {
      setDailyError(err?.message || "Unable to load daily attendance.");
      setDailyReport(emptyDailyReport);
    } finally {
      setLoadingDaily(false);
    }
  };

  const handleDailySubmit = (e) => {
    e.preventDefault();
    loadDailyAttendance(date);
  };

  // Load History & Eligibility
  const loadHistoryData = async () => {
    if (!sessionId || !courseId) return;
    setLoadingHistory(true);
    setHistoryError("");
    try {
      const [summary, students, eligibility] = await Promise.all([
        getTrainerSessionAttendance(sessionId),
        getCourseStudentAttendance(courseId),
        getAttendanceEligibility(courseId)
      ]);
      setSessionSummary(summary);
      setCourseStudents(students);
      setEligibilityData(eligibility);
    } catch (err) {
      setHistoryError(err?.message || "Failed to load historical data.");
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleViewStudentDetails = async (student) => {
    setSelectedStudent(student);
    if (!courseId) return;
    if (courseStudents.length === 0) {
      // Need to fetch course students to show history in modal
      await loadHistoryData();
    }
  };

  // When tab changes, load appropriate data if not loaded
  useEffect(() => {
    if (activeTab === "history" || activeTab === "eligibility") {
      if (!sessionSummary && courseId) {
        loadHistoryData();
      }
    }
  }, [activeTab, courseId]);

  const handleExtendSession = async () => {
    if (!dailyReport.session?.id || !sessionId) return;
    setExtending(true);
    try {
      await extendSessionOccurrence(sessionId, dailyReport.session.id, extraMinutes);
      toast.success(`Session extended by ${extraMinutes} minutes.`);
      setShowExtendModal(false);
      loadDailyAttendance(date); // refresh
    } catch (err) {
      toast.error(err?.message || "Failed to extend session.");
    } finally {
      setExtending(false);
    }
  };

  const trainerRecord = dailyReport.students?.find(s => s.isTrainer);
  const studentRecords = dailyReport.students?.filter(s => !s.isTrainer) || [];

  const filteredHistory = courseStudents.filter(s => 
    s.student?.fullName?.toLowerCase().includes(filterName.toLowerCase()) ||
    formatDateTime(s.occurrenceDate).toLowerCase().includes(filterName.toLowerCase())
  );

  if (globalLoading) {
    return <div className="min-h-dvh flex items-center justify-center bg-[#f4f7f6]"><FiRefreshCw className="animate-spin text-2xl text-[#006b58]" /></div>;
  }

  return (
    <div className="min-h-dvh bg-[#f4f7f6] text-slate-950">
      <ToastContainer position="top-right" autoClose={3200} />
      
      <section className="border-b border-slate-200 bg-white sticky top-0 z-20 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <Link
            to={PATHS.TRAINER_ATTENDANCE}
            className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#006b58] hover:text-[#00342b] transition"
          >
            <FiArrowLeft /> Back to Sessions
          </Link>
          <div className="mt-3 flex flex-col sm:flex-row justify-between sm:items-end gap-4">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                {sessionInfo?.title || "Session Details"}
              </h1>
              <p className="mt-1 font-semibold text-slate-500">
                {sessionInfo?.courseTitle} • {sessionInfo?.batch || "Live Class"}
              </p>
            </div>
          </div>

          <div className="mt-6 flex gap-6 overflow-x-auto">
            <button
              onClick={() => setActiveTab("daily")}
              className={`pb-3 font-extrabold text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === "daily" ? "border-[#006b58] text-[#006b58]" : "border-transparent text-slate-500 hover:text-slate-700"}`}
            >
              <FiCalendar className="inline-block mr-2" /> Daily Class Attendance
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`pb-3 font-extrabold text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === "history" ? "border-[#006b58] text-[#006b58]" : "border-transparent text-slate-500 hover:text-slate-700"}`}
            >
              <FiBookOpen className="inline-block mr-2" /> Attendance History
            </button>
            <button
              onClick={() => setActiveTab("eligibility")}
              className={`pb-3 font-extrabold text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === "eligibility" ? "border-[#006b58] text-[#006b58]" : "border-transparent text-slate-500 hover:text-slate-700"}`}
            >
              <FiAward className="inline-block mr-2" /> Certificate Eligibility
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        
        {/* --- DAILY CLASS ATTENDANCE TAB --- */}
        {activeTab === "daily" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Daily Form */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <form onSubmit={handleDailySubmit} className="flex flex-col sm:flex-row gap-4 sm:items-end">
                <label className="flex-1">
                  <span className="text-xs font-extrabold uppercase tracking-widest text-slate-500">Select Date</span>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-[#006b58] focus:ring-4 focus:ring-emerald-900/5 bg-white"
                  />
                </label>
                <button
                  type="submit"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#00342b] px-6 text-sm font-extrabold text-white transition hover:bg-[#001f1a] disabled:opacity-60"
                  disabled={loadingDaily}
                >
                  {loadingDaily ? <FiRefreshCw className="animate-spin" /> : <FiSearch />}
                  View attendance
                </button>
              </form>
              {dailyError && (
                <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  <FiAlertCircle className="mt-0.5 flex-shrink-0" />
                  <span>{dailyError}</span>
                </div>
              )}
            </div>

            {dailyReport.session && (
              <>
                {/* Trainer Own Tracking Widget */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 shadow-sm bg-gradient-to-br from-[#00342b] to-[#001f1a] text-white overflow-hidden relative">
                  <div className="absolute -right-10 -top-10 opacity-5">
                    <FiAward className="text-[200px]" />
                  </div>
                  <div className="flex flex-col md:flex-row justify-between gap-8 items-center relative z-10">
                    <div className="w-full md:w-1/2">
                      <div className="flex items-center gap-2 text-emerald-400 mb-3">
                        <FiAward className="text-xl" />
                        <h2 className="text-sm font-extrabold uppercase tracking-widest">My Attendance Tracking</h2>
                      </div>
                      <h3 className="text-2xl font-black mb-3">85% Session Duration Rule</h3>
                      <p className="text-sm text-emerald-100/80 leading-relaxed font-medium">
                        To be eligible for session payouts, you must be present for at least 85% of your scheduled session duration. Stay active until your class completes.
                      </p>
                    </div>
                    
                    <div className="w-full md:w-1/2 bg-white/10 rounded-2xl p-6 border border-white/20 backdrop-blur-sm">
                      <div className="flex justify-between items-end mb-3">
                        <div>
                          <div className="text-xs font-extrabold text-emerald-200 uppercase tracking-widest mb-1">Time Spent</div>
                          <div className="text-3xl font-black">{trainerRecord ? trainerRecord.durationMins : 0} <span className="text-sm font-bold text-emerald-200">mins</span></div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-extrabold text-emerald-200 uppercase tracking-widest mb-1">Status</div>
                          <div className={`text-sm font-black uppercase px-3 py-1 rounded-lg ${trainerRecord?.status === 'present' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
                            {trainerRecord ? trainerRecord.status : 'Pending'}
                          </div>
                        </div>
                      </div>
                      {(() => {
                        const maxMins = Math.max(60, trainerRecord ? trainerRecord.durationMins : 60);
                        const pct = Math.min(100, Math.round(((trainerRecord ? trainerRecord.durationMins : 0) / maxMins) * 100));
                        return (
                           <div className="mt-5">
                             <div className="h-3 w-full bg-white/20 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-400 rounded-full transition-all duration-1000 ease-out" style={{ width: `${pct}%`}}></div>
                             </div>
                             <div className="flex justify-between mt-2 text-[10px] text-emerald-200 font-extrabold uppercase tracking-widest">
                               <span>0%</span>
                               <span>85% Required</span>
                               <span>100%</span>
                             </div>
                           </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Session Header & Extend Button */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-5">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900">{dailyReport.session.name}</h2>
                    <p className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500">
                      <FiCalendar /> {dailyReport.session.date} • <FiClock /> {dailyReport.session.time}
                    </p>
                  </div>
                  {dailyReport.session.id && (
                    <button
                      onClick={() => setShowExtendModal(true)}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-amber-100 px-5 text-sm font-extrabold text-amber-900 transition hover:bg-amber-200 focus:ring-4 focus:ring-amber-100"
                    >
                      <FiPlusCircle className="text-lg" /> Extend Session Time
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard label="Total Students" value={dailyReport.summary.totalStudents} icon={FiUsers} />
                  <StatCard label="Present" value={dailyReport.summary.present} icon={FiCheckCircle} tone="green" />
                  <StatCard label="Absent" value={dailyReport.summary.absent} icon={FiXCircle} tone="red" />
                  <StatCard label="Attendance" value={formatPercent(dailyReport.summary.attendancePercentage)} icon={FiTrendingUp} tone="green" />
                </div>

                {/* Student Table */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
                  <h2 className="text-lg font-black text-slate-900">Student Attendance</h2>
                  <div className="mt-5 overflow-x-auto">
                    {studentRecords.length ? (
                      <table className="min-w-full text-left text-sm">
                        <thead>
                          <tr className="border-b-2 border-slate-200 text-xs uppercase tracking-widest text-slate-500">
                            <th className="px-4 py-4 font-extrabold">Student Name</th>
                            <th className="px-4 py-4 font-extrabold">Status</th>
                            <th className="px-4 py-4 font-extrabold">Join Time</th>
                            <th className="px-4 py-4 font-extrabold">Leave Time</th>
                            <th className="px-4 py-4 font-extrabold">Duration</th>
                            <th className="px-4 py-4 font-extrabold text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {studentRecords.map((student) => (
                            <tr key={student.id || student.email} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                              <td className="px-4 py-4">
                                <div className="font-extrabold text-slate-900">{student.name}</div>
                                <div className="text-xs font-semibold text-slate-500 mt-0.5">{student.email || "-"}</div>
                              </td>
                              <td className="px-4 py-4">
                                <span className={`inline-flex rounded-md px-2.5 py-1 text-[10px] uppercase font-black tracking-wider ${statusClass(student.status)}`}>
                                  {student.status}
                                </span>
                              </td>
                              <td className="px-4 py-4 font-semibold text-slate-600">{student.joinTime || "-"}</td>
                              <td className="px-4 py-4 font-semibold text-slate-600">{student.leaveTime || "Active"}</td>
                              <td className="px-4 py-4 font-bold text-slate-900">{student.duration || "-"}</td>
                              <td className="px-4 py-4 text-right">
                                <button
                                  onClick={() => handleViewStudentDetails(student)}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[#006b58] transition-colors hover:bg-slate-50"
                                >
                                  View Details
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-500">
                        <FiUsers className="mx-auto h-10 w-10 text-slate-300 mb-3" />
                        <div className="font-extrabold text-slate-900">No records found</div>
                        <div className="text-sm mt-1">No student records found for this occurrence.</div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* --- ATTENDANCE HISTORY TAB --- */}
        {activeTab === "history" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {historyError && (
              <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                <FiAlertCircle className="mt-0.5 flex-shrink-0" />
                <span>{historyError}</span>
              </div>
            )}
            
            {loadingHistory ? (
              <div className="flex justify-center py-20"><FiRefreshCw className="animate-spin text-3xl text-[#006b58]" /></div>
            ) : (
              <>
                {sessionSummary && (
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard label="Total Bookings" value={sessionSummary.totalStudents} icon={FiUsers} />
                    <StatCard label="Total Present" value={sessionSummary.presentCount} icon={FiCheckCircle} tone="green" />
                    <StatCard label="Total Absent" value={sessionSummary.absentCount} icon={FiXCircle} tone="red" />
                    <StatCard label="Overall Attendance" value={formatPercent(sessionSummary.attendancePercentage)} icon={FiTrendingUp} tone="green" />
                  </div>
                )}

                <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
                   <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                     <h2 className="text-lg font-black text-slate-900">Historical Occurrence Log</h2>
                     <div className="relative w-full sm:w-64">
                       <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                       <input 
                         type="text" 
                         placeholder="Filter by name or date..." 
                         value={filterName}
                         onChange={e => setFilterName(e.target.value)}
                         className="h-10 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm font-semibold outline-none focus:border-[#006b58] focus:ring-4 focus:ring-emerald-900/5 bg-slate-50"
                       />
                     </div>
                   </div>

                   <div className="overflow-x-auto max-h-[600px] overflow-y-auto relative rounded-xl border border-slate-200">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 sticky top-0 z-10">
                          <tr className="border-b border-slate-200 text-xs uppercase tracking-widest text-slate-500">
                            <th className="px-4 py-4 font-extrabold">Date</th>
                            <th className="px-4 py-4 font-extrabold">Student Name</th>
                            <th className="px-4 py-4 font-extrabold">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                           {filteredHistory.length > 0 ? filteredHistory.map(record => (
                             <tr key={record.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                               <td className="px-4 py-3 font-semibold text-slate-600">{formatDateTime(record.occurrenceDate)}</td>
                               <td className="px-4 py-3 font-extrabold text-slate-900">{record.student?.fullName || "Unknown"}</td>
                               <td className="px-4 py-3">
                                  <span className={`inline-flex rounded-md px-2.5 py-1 text-[10px] uppercase font-black tracking-wider ${statusClass(record.status)}`}>
                                    {record.status}
                                  </span>
                               </td>
                             </tr>
                           )) : (
                             <tr>
                               <td colSpan="3" className="px-4 py-8 text-center text-slate-500 font-semibold">
                                 No history matches your filter.
                               </td>
                             </tr>
                           )}
                        </tbody>
                      </table>
                   </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* --- CERTIFICATE ELIGIBILITY TAB --- */}
        {activeTab === "eligibility" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm bg-gradient-to-br from-slate-900 to-slate-800 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <FiAward className="text-2xl text-emerald-400" />
                  <h2 className="text-xl font-black">Certificate Eligibility</h2>
                </div>
                <p className="text-slate-300 font-medium max-w-2xl text-sm leading-relaxed">
                  Students must maintain an overall attendance of <strong>75% or higher</strong> to be eligible to unlock their completion certificate. Review their current standings below.
                </p>
             </div>

             <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
                <div className="overflow-x-auto">
                   <table className="min-w-full text-left text-sm">
                     <thead>
                       <tr className="border-b-2 border-slate-200 text-xs uppercase tracking-widest text-slate-500">
                         <th className="px-4 py-4 font-extrabold">Student Name</th>
                         <th className="px-4 py-4 font-extrabold">Email</th>
                         <th className="px-4 py-4 font-extrabold">Attendance %</th>
                         <th className="px-4 py-4 font-extrabold">Status</th>
                       </tr>
                     </thead>
                     <tbody>
                        {eligibilityData.map((data, idx) => (
                          <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/50">
                            <td className="px-4 py-4 font-extrabold text-slate-900">{data.student?.fullName || "Unknown"}</td>
                            <td className="px-4 py-4 font-semibold text-slate-500">{data.student?.email || "-"}</td>
                            <td className="px-4 py-4">
                               <div className="flex items-center gap-3">
                                 <span className={`font-black ${data.isEligible ? 'text-emerald-600' : 'text-red-600'}`}>
                                   {formatPercent(data.percentage)}
                                 </span>
                                 <div className="w-24 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                    <div className={`h-full rounded-full ${data.isEligible ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${Math.min(100, data.percentage)}%`}}></div>
                                 </div>
                               </div>
                            </td>
                            <td className="px-4 py-4">
                               {data.isEligible ? (
                                 <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-700 border border-emerald-200">
                                   <FiCheckCircle /> Eligible
                                 </span>
                               ) : (
                                 <span className="inline-flex items-center gap-1.5 rounded-md bg-red-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-red-700 border border-red-200">
                                   <FiXCircle /> Ineligible
                                 </span>
                               )}
                            </td>
                          </tr>
                        ))}
                        {eligibilityData.length === 0 && (
                           <tr>
                             <td colSpan="4" className="px-4 py-8 text-center text-slate-500 font-semibold">
                               No students enrolled.
                             </td>
                           </tr>
                        )}
                     </tbody>
                   </table>
                </div>
             </div>
          </div>
        )}

      </section>

      {/* Extend Session Modal */}
      {showExtendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 animate-in fade-in backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-7 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-5">
              <FiClock className="text-2xl" />
            </div>
            <h3 className="text-xl font-black text-slate-900">Extend Session Time</h3>
            <p className="mt-2 text-sm text-slate-500 font-medium leading-relaxed">Need more time? Add extra minutes to this session occurrence.</p>
            
            <div className="mt-6">
              <label className="text-xs font-extrabold uppercase tracking-widest text-slate-500 block mb-2">Additional Minutes</label>
              <select
                value={extraMinutes}
                onChange={(e) => setExtraMinutes(Number(e.target.value))}
                className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-[#006b58] focus:ring-4 focus:ring-emerald-900/5 bg-slate-50"
              >
                <option value={15}>15 Minutes</option>
                <option value={30}>30 Minutes</option>
                <option value={45}>45 Minutes</option>
                <option value={60}>60 Minutes</option>
              </select>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                onClick={() => setShowExtendModal(false)}
                className="flex-1 rounded-xl bg-slate-100 py-3 text-sm font-extrabold text-slate-700 hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleExtendSession}
                disabled={extending}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#00342b] py-3 text-sm font-extrabold text-white transition hover:bg-[#001f1a] disabled:opacity-60 shadow-md shadow-emerald-900/20"
              >
                {extending ? <FiRefreshCw className="animate-spin" /> : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Details Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 animate-in fade-in backdrop-blur-sm">
          <div className="w-full max-w-4xl rounded-3xl bg-white shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-200 p-6">
              <div>
                <h3 className="text-xl font-black text-slate-900">{selectedStudent.name}</h3>
                <p className="mt-1 text-sm font-semibold text-slate-500">{selectedStudent.email || "No email"}</p>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <FiXCircle className="text-2xl" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {(() => {
                const studentHistory = courseStudents.filter(s => s.student?.id === selectedStudent.id);
                const totalSessions = studentHistory.length;
                const presentCount = studentHistory.filter(s => s.status === "present" || s.status === "joined" || s.status === "late").length;
                const absentCount = studentHistory.filter(s => s.status === "absent").length;
                const attendancePct = totalSessions > 0 ? (presentCount / totalSessions) * 100 : 0;
                
                return (
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left Panel: Summary Stats */}
                    <div className="w-full lg:w-1/3 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Sessions</div>
                          <div className="mt-1 text-2xl font-black text-slate-900">{totalSessions}</div>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Attendance %</div>
                          <div className="mt-1 text-2xl font-black text-[#006b58]">{formatPercent(attendancePct)}</div>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Present</div>
                          <div className="mt-1 text-2xl font-black text-emerald-600">{presentCount}</div>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Absent</div>
                          <div className="mt-1 text-2xl font-black text-red-600">{absentCount}</div>
                        </div>
                      </div>
                      
                      <div className="rounded-xl border border-slate-200 bg-white p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <FiBookOpen className="text-[#006b58]" />
                          <h4 className="font-extrabold text-slate-900">Current Occurrence</h4>
                        </div>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between">
                            <span className="font-semibold text-slate-500">Status</span>
                            <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] uppercase font-black tracking-wider ${statusClass(selectedStudent.status)}`}>
                              {selectedStudent.status}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold text-slate-500">Duration</span>
                            <span className="font-bold text-slate-900">{selectedStudent.duration}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold text-slate-500">First Join</span>
                            <span className="font-bold text-slate-900">{selectedStudent.joinTime || "-"}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Panel: History List */}
                    <div className="w-full lg:w-2/3 flex flex-col h-[400px]">
                      <h4 className="font-extrabold text-slate-900 mb-4">Attendance History</h4>
                      <div className="flex-1 overflow-y-auto rounded-xl border border-slate-200 bg-white">
                        <table className="min-w-full text-left text-sm">
                          <thead className="bg-slate-50 sticky top-0 z-10">
                            <tr className="border-b border-slate-200 text-[10px] uppercase tracking-widest text-slate-500">
                              <th className="px-4 py-3 font-extrabold">Date</th>
                              <th className="px-4 py-3 font-extrabold">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {studentHistory.length > 0 ? studentHistory.map(record => (
                              <tr key={record.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                                <td className="px-4 py-3 font-semibold text-slate-600">{formatDateTime(record.occurrenceDate)}</td>
                                <td className="px-4 py-3">
                                  <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] uppercase font-black tracking-wider ${statusClass(record.status)}`}>
                                    {record.status}
                                  </span>
                                </td>
                              </tr>
                            )) : (
                              <tr>
                                <td colSpan="2" className="px-4 py-8 text-center text-slate-500 font-semibold">
                                  {loadingHistory ? "Loading history..." : "No historical records found for this student."}
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
