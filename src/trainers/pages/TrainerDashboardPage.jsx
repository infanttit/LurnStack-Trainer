import { useEffect, useMemo, useState } from "react";
import {
  FiAlertCircle,
  FiBookOpen,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiEdit3,
  FiImage,
  FiLogOut,
  FiMenu,
  FiPauseCircle,
  FiPlayCircle,
  FiPlusCircle,
  FiRefreshCw,
  FiRotateCcw,
  FiSidebar,
  FiStopCircle,
  FiTrash2,
  FiUploadCloud,
  FiX,
  FiXCircle,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { PATHS } from "../../app/router/paths";
import { useAuth } from "../../auth";
import {
  cancelTodayTrainerSession,
  createTrainerSession,
  deleteTrainerSession,
  endTrainerSession,
  getTrainerCourses,
  getTrainerSession,
  getTrainerSessions,
  getTrainerStatus,
  pauseTrainerSession,
  restoreTodayTrainerSession,
  resumeTrainerSession,
  updateTrainerSession,
} from "../api/trainerSessionsApi";

const INACTIVE_TRAINER_MESSAGE =
  "Your trainer account is inactive. You cannot manage recurring live sessions.";

const initialForm = {
  courseId: "",
  title: "",
  subtitle: "",
  description: "",
  startTime: "",
  endTime: "",
  timezone: "Asia/Kolkata",
  meetingLink: "",
  thumbnailPreview: "",
  thumbnailFile: null,
  isRecurring: true,
  recurrenceType: "daily",
};

const tabs = [
  { id: "overview", label: "Overview", icon: FiBookOpen },
  { id: "create", label: "Create daily session", icon: FiPlusCircle },
  { id: "sessions", label: "Recurring sessions", icon: FiCalendar },
];

const fieldLabels = {
  courseId: "Course",
  title: "Session title",
  description: "Description",
  startTime: "Start time",
  endTime: "End time",
  meetingLink: "Meeting link",
};

const emptyConfirmDialog = {
  open: false,
  action: "",
  sessionId: "",
  title: "",
  message: "",
  reason: "",
};

function getDurationMinutes(startTime, endTime) {
  const [startHour, startMinute] = String(startTime || "").split(":").map(Number);
  const [endHour, endMinute] = String(endTime || "").split(":").map(Number);
  if (![startHour, startMinute, endHour, endMinute].every(Number.isFinite)) return 0;
  const startTotal = startHour * 60 + startMinute;
  const endTotal = endHour * 60 + endMinute;
  return endTotal > startTotal ? endTotal - startTotal : 0;
}

function formatTime(time, timezone = "Asia/Kolkata") {
  if (!/^\d{2}:\d{2}$/.test(String(time || ""))) return "";
  const date = new Date(`2026-01-01T${time}:00+05:30`);
  return date.toLocaleTimeString("en-IN", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDailyWindow(session) {
  const start = formatTime(session?.startTime, session?.timezone);
  const end = formatTime(session?.endTime, session?.timezone);
  if (!start || !end) return "Time not set";
  return `Every day, ${start} to ${end}`;
}

function getSessionStatus(session) {
  if (session?.isEnded || session?.status === "ended") return "ended";
  if (session?.isPaused || session?.status === "paused") return "paused";
  if (session?.isTodayCancelled) return "today cancelled";
  if (session?.todayStatus === "completed_today") return "today completed";
  if (session?.todayStatus === "live") return "live now";
  if (session?.todayStatus === "upcoming") return "upcoming today";
  return session?.status || "active";
}

function getStatusClass(status) {
  if (status === "ended") return "bg-slate-100 text-slate-700 border-slate-200";
  if (status === "paused") return "bg-amber-50 text-amber-700 border-amber-100";
  if (status === "today cancelled") return "bg-red-50 text-red-700 border-red-100";
  if (status === "today completed") return "bg-slate-100 text-slate-700 border-slate-200";
  if (status === "live now") return "bg-blue-50 text-blue-700 border-blue-100";
  if (status === "upcoming today") return "bg-cyan-50 text-cyan-700 border-cyan-100";
  return "bg-emerald-50 text-emerald-700 border-emerald-100";
}

function readImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function TrainerDashboardPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [courses, setCourses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionId, setActionId] = useState("");
  const [editingSessionId, setEditingSessionId] = useState("");
  const [confirmDialog, setConfirmDialog] = useState(emptyConfirmDialog);
  const [isTrainerActive, setIsTrainerActive] = useState(true);
  const [statusLoading, setStatusLoading] = useState(true);
  const [statusError, setStatusError] = useState("");

  const activeSessions = useMemo(
    () => sessions.filter((session) => !session.isEnded && session.status !== "ended"),
    [sessions]
  );

  const todaysCancelledCount = useMemo(
    () => sessions.filter((session) => session.isTodayCancelled).length,
    [sessions]
  );

  const nextSession = useMemo(
    () =>
      [...activeSessions]
        .filter(
          (session) =>
            !session.isPaused &&
            !session.isTodayCancelled &&
            session.todayStatus !== "completed_today"
        )
        .sort((a, b) => String(a.startTime).localeCompare(String(b.startTime)))[0],
    [activeSessions]
  );

  const trainerActionsLocked = !isTrainerActive;

  const loadCourses = async ({ silent = false } = {}) => {
    if (!silent) setLoadingCourses(true);
    try {
      const nextCourses = await getTrainerCourses();
      setCourses(nextCourses);
      setError("");
    } catch (err) {
      setError(err?.message || "Unable to load trainer courses.");
    } finally {
      if (!silent) setLoadingCourses(false);
    }
  };

  const loadSessions = async ({ silent = false } = {}) => {
    if (!silent) setLoadingSessions(true);
    try {
      const nextSessions = await getTrainerSessions();
      setSessions(nextSessions);
      setError("");
    } catch (err) {
      setError(err?.message || "Unable to load recurring live sessions.");
    } finally {
      if (!silent) setLoadingSessions(false);
    }
  };

  const loadTrainerStatus = async ({ silent = false } = {}) => {
    if (!silent) setStatusLoading(true);
    try {
      const status = await getTrainerStatus();
      setIsTrainerActive(status.isActive);
      setStatusError("");
    } catch (err) {
      setStatusError(err?.message || "Unable to verify trainer account status.");
    } finally {
      if (!silent) setStatusLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
    loadSessions();
    loadTrainerStatus();
    const intervalId = window.setInterval(() => {
      loadTrainerStatus({ silent: true });
      loadSessions({ silent: true });
    }, 30000);
    return () => window.clearInterval(intervalId);
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
    setMessage("");
    setError("");
  };

  const validateForm = () => {
    const required = ["courseId", "title", "description", "startTime", "endTime", "meetingLink"];
    const nextErrors = required.reduce((acc, key) => {
      if (!String(form[key] || "").trim()) acc[key] = `${fieldLabels[key]} is required.`;
      return acc;
    }, {});

    if (getDurationMinutes(form.startTime, form.endTime) <= 0) {
      nextErrors.startTime = "Choose a valid start time.";
      nextErrors.endTime = "End time must be after start time.";
    }

    setFormErrors(nextErrors);
    return nextErrors;
  };

  const handleThumbnailChange = async (e) => {
    if (trainerActionsLocked) {
      setError(INACTIVE_TRAINER_MESSAGE);
      toast.warn(INACTIVE_TRAINER_MESSAGE);
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please upload a valid image file.");
      toast.error("Please upload a valid image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Thumbnail must be 5 MB or smaller.");
      toast.error("Thumbnail must be 5 MB or smaller.");
      return;
    }

    const dataUrl = await readImageFile(file);
    setForm((prev) => ({ ...prev, thumbnailPreview: dataUrl, thumbnailFile: file }));
    setMessage("");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (trainerActionsLocked) {
      setError(INACTIVE_TRAINER_MESSAGE);
      toast.warn(INACTIVE_TRAINER_MESSAGE);
      return;
    }

    const nextErrors = validateForm();
    if (Object.keys(nextErrors).length) {
      const firstError = Object.values(nextErrors)[0];
      setError(firstError);
      toast.error(firstError);
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      if (editingSessionId) {
        await updateTrainerSession(editingSessionId, form);
      } else {
        await createTrainerSession(form);
      }

      const successMessage = editingSessionId
        ? "Recurring live session updated successfully."
        : "Daily recurring live session created successfully.";
      setForm(initialForm);
      setFormErrors({});
      setEditingSessionId("");
      setMessage(successMessage);
      toast.success(successMessage);
      setActiveTab("sessions");
      await loadSessions({ silent: true });
    } catch (err) {
      const errorMessage = err?.message || "Unable to save recurring live session.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const startEditingSession = async (session) => {
    if (trainerActionsLocked) {
      setError(INACTIVE_TRAINER_MESSAGE);
      toast.warn(INACTIVE_TRAINER_MESSAGE);
      return;
    }

    setActionId(`edit:${session.id}`);
    try {
      const details = await getTrainerSession(session.id);
      setEditingSessionId(details.id);
      setForm({
        courseId: details.courseId,
        title: details.title,
        subtitle: details.subtitle,
        description: details.description,
        startTime: details.startTime,
        endTime: details.endTime,
        timezone: details.timezone || "Asia/Kolkata",
        meetingLink: details.meetingLink,
        thumbnailPreview: details.thumbnail || "",
        thumbnailFile: null,
        isRecurring: details.isRecurring !== false,
        recurrenceType: details.recurrenceType || "daily",
      });
      setMessage("");
      setError("");
      setFormErrors({});
      setActiveTab("create");
    } catch (err) {
      const errorMessage = err?.message || "Unable to load session details.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setActionId("");
    }
  };

  const cancelEditing = () => {
    setEditingSessionId("");
    setForm(initialForm);
    setMessage("");
    setError("");
    setFormErrors({});
  };

  const updateSessionAction = async (sessionId, action, reason = "") => {
    if (!sessionId) return;
    if (trainerActionsLocked) {
      setError(INACTIVE_TRAINER_MESSAGE);
      toast.warn(INACTIVE_TRAINER_MESSAGE);
      return;
    }

    setActionId(`${action}:${sessionId}`);
    setError("");
    setMessage("");
    try {
      if (action === "pause") {
        await pauseTrainerSession(sessionId);
        toast.success("Recurring session paused.");
      } else if (action === "resume") {
        await resumeTrainerSession(sessionId);
        toast.success("Recurring session resumed.");
      } else if (action === "end") {
        await endTrainerSession(sessionId);
        toast.success("Recurring session ended permanently.");
      } else if (action === "delete") {
        await deleteTrainerSession(sessionId);
        toast.success("Recurring session deleted.");
      } else if (action === "cancelToday") {
        await cancelTodayTrainerSession(sessionId, reason.trim());
        toast.success("Today's class cancelled.");
      } else if (action === "restoreToday") {
        await restoreTodayTrainerSession(sessionId);
        toast.success("Today's class restored.");
      }

      setMessage("Session updated successfully.");
      await loadSessions({ silent: true });
    } catch (err) {
      const errorMessage = err?.message || "Unable to update recurring session.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setActionId("");
    }
  };

  const openSessionDialog = (sessionId, action) => {
    if (!sessionId) return;
    if (trainerActionsLocked) {
      setError(INACTIVE_TRAINER_MESSAGE);
      toast.warn(INACTIVE_TRAINER_MESSAGE);
      return;
    }

    if (action === "cancelToday") {
      setConfirmDialog({
        open: true,
        action,
        sessionId,
        title: "Cancel today's class",
        message: "Only today's class will be cancelled. The daily recurring session will continue tomorrow.",
        reason: "",
      });
      return;
    }

    if (action === "end") {
      setConfirmDialog({
        open: true,
        action,
        sessionId,
        title: "End recurring session",
        message: "This permanently ends the daily session. Use pause if you only need a temporary stop.",
        reason: "",
      });
      return;
    }

    if (action === "delete") {
      setConfirmDialog({
        open: true,
        action,
        sessionId,
        title: "Delete recurring session",
        message: "This permanently deletes the session record. Use end if you want to keep the history but stop future classes.",
        reason: "",
      });
    }
  };

  const closeSessionDialog = () => {
    setConfirmDialog(emptyConfirmDialog);
  };

  const confirmSessionDialog = async () => {
    if (!confirmDialog.open) return;
    if (confirmDialog.action === "cancelToday" && !confirmDialog.reason.trim()) {
      setError("Please enter a reason for cancelling today's class.");
      toast.error("Please enter a reason for cancelling today's class.");
      return;
    }
    const { sessionId, action, reason } = confirmDialog;
    closeSessionDialog();
    await updateSessionAction(sessionId, action, reason);
  };

  const logout = async () => {
    await signOut();
    navigate(PATHS.LOGIN);
  };

  const renderTabButton = ({ id, label, icon: Icon }) => (
    <button
      key={id}
      type="button"
      onClick={() => {
        setActiveTab(id);
        setMobileSidebarOpen(false);
      }}
      className={[
        "w-full h-11 rounded-xl text-sm font-extrabold inline-flex items-center justify-center gap-3 transition-colors",
        activeTab === id
          ? "bg-white text-[#00342b]"
          : "text-white/70 hover:bg-white/10 hover:text-white",
        sidebarCollapsed ? "lg:px-0" : "px-4 justify-start",
      ].join(" ")}
      title={label}
    >
      <Icon className="flex-shrink-0" />
      <span className={sidebarCollapsed ? "hidden" : "inline truncate"}>{label}</span>
    </button>
  );

  const fieldClass = (name, extra = "") =>
    [
      extra,
      "border",
      formErrors[name]
        ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100"
        : "border-slate-200 focus:border-[#006b58] focus:ring-4 focus:ring-emerald-900/5",
    ].join(" ");

  return (
    <main className="h-dvh overflow-hidden bg-[#f4f7f6] text-slate-950">
      <ToastContainer position="top-right" autoClose={3200} newestOnTop closeOnClick pauseOnHover theme="colored" />

      {confirmDialog.open ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-950">{confirmDialog.title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">{confirmDialog.message}</p>
              </div>
              <button
                type="button"
                onClick={closeSessionDialog}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-100"
                aria-label="Close dialog"
              >
                <FiX />
              </button>
            </div>
            {confirmDialog.action === "cancelToday" ? (
              <div className="px-5 py-4">
                <label className="block">
                  <span className="text-xs font-extrabold uppercase tracking-widest text-slate-500">
                    Cancellation reason
                  </span>
                  <textarea
                    value={confirmDialog.reason}
                    onChange={(e) =>
                      setConfirmDialog((prev) => ({ ...prev, reason: e.target.value }))
                    }
                    rows={3}
                    placeholder="Example: Trainer unavailable today."
                    className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#006b58] focus:ring-4 focus:ring-emerald-900/5"
                  />
                </label>
              </div>
            ) : null}
            <div className="flex flex-col justify-end gap-2 bg-slate-50 px-5 py-4 sm:flex-row">
              <button
                type="button"
                onClick={closeSessionDialog}
                className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-extrabold text-slate-600"
              >
                Keep session
              </button>
              <button
                type="button"
                onClick={confirmSessionDialog}
                className={[
                  "h-10 rounded-xl px-5 text-sm font-extrabold text-white",
                  confirmDialog.action === "end" || confirmDialog.action === "delete"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-amber-600 hover:bg-amber-700",
                ].join(" ")}
              >
                {confirmDialog.action === "delete"
                  ? "Delete session"
                  : confirmDialog.action === "end"
                    ? "End permanently"
                    : "Cancel today"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div
        className={[
          "grid h-full min-h-0 grid-cols-1 transition-[grid-template-columns] duration-300",
          sidebarCollapsed ? "lg:grid-cols-[92px_1fr]" : "lg:grid-cols-[280px_1fr]",
        ].join(" ")}
      >
        {mobileSidebarOpen ? (
          <button
            type="button"
            aria-label="Close trainer sidebar"
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          />
        ) : null}

        <aside
          className={[
            "fixed inset-y-0 left-0 z-50 flex h-dvh min-h-0 w-[280px] flex-col overflow-hidden bg-[#00342b] p-5 text-white transition-transform duration-300 lg:static lg:z-auto lg:translate-x-0",
            mobileSidebarOpen ? "translate-x-0" : "-translate-x-full",
            sidebarCollapsed ? "lg:w-[92px]" : "lg:w-auto",
          ].join(" ")}
        >
          <div className={["flex items-center gap-3", sidebarCollapsed ? "justify-center" : "justify-between"].join(" ")}>
            {sidebarCollapsed ? (
              <div className="hidden h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-sm font-black lg:flex">
                LS
              </div>
            ) : (
              <div className="min-w-0">
                <div className="text-2xl font-extrabold leading-none">LurnStack</div>
                <div className="mt-1 text-xs font-semibold text-white/60">Trainer Portal</div>
              </div>
            )}
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(false)}
              className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white/10 text-white transition-colors hover:bg-white/15 lg:hidden"
              title="Close sidebar"
            >
              <FiX />
            </button>
            <button
              type="button"
              onClick={() => setSidebarCollapsed((v) => !v)}
              className="hidden h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white/10 text-white transition-colors hover:bg-white/15 lg:inline-flex"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <FiSidebar />
            </button>
          </div>

          <nav className="mt-10 space-y-2">{tabs.map(renderTabButton)}</nav>

          <div className={["mt-auto rounded-2xl bg-white/10 p-2 lg:p-4", sidebarCollapsed ? "lg:px-2" : ""].join(" ")}>
            {sidebarCollapsed ? (
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-sm font-extrabold">
                {(user?.fullName || "T").slice(0, 1).toUpperCase()}
              </div>
            ) : (
              <>
                <div className="truncate text-sm font-extrabold">{user?.fullName || "Trainer"}</div>
                <div className="mt-1 break-all text-xs text-white/60">{user?.email}</div>
              </>
            )}
            <button
              type="button"
              onClick={logout}
              className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-white/20 text-sm font-extrabold transition-colors hover:bg-white/10"
              title="Log out"
            >
              <FiLogOut />
              <span className={sidebarCollapsed ? "hidden" : "inline"}>Log out</span>
            </button>
          </div>
        </aside>

        <section className="flex h-dvh min-h-0 min-w-0 flex-col overflow-hidden">
          <header className="flex-shrink-0 border-b border-slate-200 bg-white px-4 py-4 sm:px-8 sm:py-5">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => setMobileSidebarOpen(true)}
                  className="mt-0.5 inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[#00342b] text-white lg:hidden"
                  aria-label="Open trainer sidebar"
                >
                  <FiMenu />
                </button>
                <div>
                  <div className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#006b58] lg:hidden">
                    Trainer Portal
                  </div>
                  <h1 className="text-xl font-extrabold leading-tight text-slate-950 sm:text-3xl">
                    Daily recurring live sessions
                  </h1>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500 sm:text-sm">
                    Create one live session once, then run it every day at the selected time.
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span
                      className={[
                        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wider",
                        statusLoading
                          ? "border-slate-200 bg-slate-50 text-slate-600"
                          : isTrainerActive
                            ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                            : "border-amber-100 bg-amber-50 text-amber-700",
                      ].join(" ")}
                    >
                      {statusLoading ? "Checking status" : isTrainerActive ? "Active trainer" : "Inactive trainer"}
                    </span>
                    {statusError ? <span className="text-xs font-semibold text-red-600">{statusError}</span> : null}
                  </div>
                </div>
              </div>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8">
            {trainerActionsLocked ? (
              <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">
                <FiAlertCircle className="mt-0.5 flex-shrink-0" />
                <span>{INACTIVE_TRAINER_MESSAGE}</span>
              </div>
            ) : null}

            {activeTab === "overview" ? (
              <div className="space-y-6">
                <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    ["Courses", loadingCourses ? "Syncing" : courses.length, FiBookOpen],
                    ["Recurring sessions", loadingSessions ? "Syncing" : sessions.length, FiCalendar],
                    ["Cancelled today", todaysCancelledCount, FiXCircle],
                    ["Next daily class", nextSession ? formatTime(nextSession.startTime, nextSession.timezone) : "Not scheduled", FiClock],
                  ].map(([label, value, Icon]) => (
                    <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <Icon className="text-xl text-[#006b58]" />
                      <div className="mt-4 text-xl font-extrabold">{value}</div>
                      <div className="mt-1 text-sm font-semibold text-slate-500">{label}</div>
                    </div>
                  ))}
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-950">Recurring session flow</h2>
                      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-500">
                        Trainers create one session, set the daily start and end time, and reuse the same meeting
                        link every day. For exceptions, pause the whole recurring session or cancel only today's class.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab("create")}
                      disabled={trainerActionsLocked}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#00342b] px-5 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <FiPlusCircle />
                      Create daily session
                    </button>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-4">
                    {["Select course", "Set daily time", "Share meeting link", "Manage exceptions"].map((item, index) => (
                      <div key={item} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00342b] text-sm font-extrabold text-white">
                          {index + 1}
                        </div>
                        <div className="mt-3 text-sm font-extrabold">{item}</div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            ) : null}

            {activeTab === "create" ? (
              <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#00342b] text-white">
                      <FiCalendar className="text-xl" />
                    </div>
                    <div>
                      <h2 className="text-xl font-extrabold">
                        {editingSessionId ? "Edit daily recurring session" : "Create daily recurring session"}
                      </h2>
                      <p className="text-sm text-slate-500">
                        One setup creates a daily class. Trainers can pause it or cancel only today's class later.
                      </p>
                    </div>
                  </div>
                  {editingSessionId ? (
                    <button
                      type="button"
                      onClick={cancelEditing}
                      className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-extrabold text-slate-600 transition-colors hover:border-red-200 hover:text-red-700"
                    >
                      Cancel edit
                    </button>
                  ) : null}
                </div>

                {message ? (
                  <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
                    {message}
                  </div>
                ) : null}
                {error ? (
                  <div className="mt-5 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                    <FiAlertCircle className="mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                ) : null}

                <fieldset
                  disabled={trainerActionsLocked || submitting}
                  className="mt-6 grid grid-cols-1 gap-4 disabled:opacity-60 sm:grid-cols-2"
                >
                  <div className="sm:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr] lg:items-center">
                      <div className="aspect-[16/9] overflow-hidden rounded-xl border border-slate-200 bg-white">
                        {form.thumbnailPreview ? (
                          <img
                            src={form.thumbnailPreview}
                            alt="Session thumbnail preview"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-emerald-950 via-teal-800 to-cyan-600 text-white">
                            <FiImage className="text-4xl opacity-80" />
                            <div className="mt-2 text-sm font-extrabold">Thumbnail preview</div>
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-extrabold uppercase tracking-widest text-slate-500">
                          Session thumbnail
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-slate-500">
                          Add a thumbnail for this daily live session. It helps students identify the course session quickly.
                        </p>
                        <label className="mt-4 inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-extrabold text-slate-700 transition-colors hover:border-[#006b58]">
                          <FiUploadCloud />
                          Upload thumbnail
                          <input type="file" accept="image/*" onChange={handleThumbnailChange} className="hidden" />
                        </label>
                        <p className="mt-2 text-xs text-slate-500">Image only. Maximum size 5 MB.</p>
                      </div>
                    </div>
                  </div>

                  <label className="sm:col-span-2">
                    <span className="text-xs font-extrabold uppercase tracking-widest text-slate-500">Course</span>
                    <select
                      name="courseId"
                      value={form.courseId}
                      onChange={handleChange}
                      className={fieldClass("courseId", "mt-1 h-11 w-full rounded-xl bg-white px-4 text-sm outline-none")}
                    >
                      <option value="">{loadingCourses ? "Loading courses..." : "Select trainer course"}</option>
                      {courses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.title}
                        </option>
                      ))}
                    </select>
                    {formErrors.courseId ? <p className="mt-1 text-xs font-semibold text-red-600">{formErrors.courseId}</p> : null}
                    <p className="mt-1 text-xs text-slate-500">
                      Courses load from the trainer courses API. If that endpoint is not ready, development course options are shown.
                    </p>
                  </label>

                  <label>
                    <span className="text-xs font-extrabold uppercase tracking-widest text-slate-500">Session title</span>
                    <input
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                      placeholder="React Live Class"
                      className={fieldClass("title", "mt-1 h-11 w-full rounded-xl px-4 text-sm outline-none")}
                    />
                    {formErrors.title ? <p className="mt-1 text-xs font-semibold text-red-600">{formErrors.title}</p> : null}
                  </label>

                  <label>
                    <span className="text-xs font-extrabold uppercase tracking-widest text-slate-500">Subtitle</span>
                    <input
                      name="subtitle"
                      value={form.subtitle}
                      onChange={handleChange}
                      placeholder="Daily practical session"
                      className={fieldClass("subtitle", "mt-1 h-11 w-full rounded-xl px-4 text-sm outline-none")}
                    />
                  </label>

                  <label className="sm:col-span-2">
                    <span className="text-xs font-extrabold uppercase tracking-widest text-slate-500">Description</span>
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Live session description"
                      className={fieldClass("description", "mt-1 w-full resize-none rounded-xl px-4 py-3 text-sm outline-none")}
                    />
                    {formErrors.description ? <p className="mt-1 text-xs font-semibold text-red-600">{formErrors.description}</p> : null}
                  </label>

                  <label>
                    <span className="text-xs font-extrabold uppercase tracking-widest text-slate-500">Start time</span>
                    <input
                      name="startTime"
                      type="time"
                      value={form.startTime}
                      onChange={handleChange}
                      className={fieldClass("startTime", "mt-1 h-11 w-full rounded-xl px-4 text-sm outline-none")}
                    />
                    {formErrors.startTime ? <p className="mt-1 text-xs font-semibold text-red-600">{formErrors.startTime}</p> : null}
                  </label>

                  <label>
                    <span className="text-xs font-extrabold uppercase tracking-widest text-slate-500">End time</span>
                    <input
                      name="endTime"
                      type="time"
                      value={form.endTime}
                      onChange={handleChange}
                      className={fieldClass("endTime", "mt-1 h-11 w-full rounded-xl px-4 text-sm outline-none")}
                    />
                    {formErrors.endTime ? <p className="mt-1 text-xs font-semibold text-red-600">{formErrors.endTime}</p> : null}
                  </label>

                  <label>
                    <span className="text-xs font-extrabold uppercase tracking-widest text-slate-500">Timezone</span>
                    <select
                      name="timezone"
                      value={form.timezone}
                      onChange={handleChange}
                      className={fieldClass("timezone", "mt-1 h-11 w-full rounded-xl bg-white px-4 text-sm outline-none")}
                    >
                      <option value="Asia/Kolkata">Asia/Kolkata</option>
                    </select>
                  </label>

                  <label>
                    <span className="text-xs font-extrabold uppercase tracking-widest text-slate-500">Meeting link</span>
                    <input
                      name="meetingLink"
                      type="url"
                      value={form.meetingLink}
                      onChange={handleChange}
                      placeholder="https://meet.google.com/xxx"
                      className={fieldClass("meetingLink", "mt-1 h-11 w-full rounded-xl px-4 text-sm outline-none")}
                    />
                    {formErrors.meetingLink ? <p className="mt-1 text-xs font-semibold text-red-600">{formErrors.meetingLink}</p> : null}
                  </label>

                  <div className="sm:col-span-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-extrabold text-emerald-950">
                    Recurrence: Daily, {form.startTime && form.endTime ? `${formatTime(form.startTime)} to ${formatTime(form.endTime)}` : "time not set"}
                  </div>
                </fieldset>

                <button
                  type="submit"
                  disabled={submitting || trainerActionsLocked}
                  className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#00342b] text-sm font-extrabold text-white transition-colors hover:bg-[#004d40] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitting ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <FiCheckCircle className="text-lg" />
                  )}
                  {submitting
                    ? editingSessionId
                      ? "Updating recurring session..."
                      : "Creating recurring session..."
                    : editingSessionId
                      ? "Update recurring session"
                      : "Create daily session"}
                </button>
              </form>
            ) : null}

            {activeTab === "sessions" ? (
              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <h2 className="text-xl font-extrabold">Recurring live sessions</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Manage daily sessions without creating a new class every day.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => setActiveTab("create")}
                      disabled={trainerActionsLocked}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#00342b] px-5 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <FiPlusCircle />
                      New daily session
                    </button>
                    <button
                      type="button"
                      onClick={() => loadSessions()}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-extrabold text-slate-700 transition-colors hover:border-[#006b58]"
                    >
                      <FiRefreshCw className={loadingSessions ? "animate-spin" : ""} />
                      Refresh
                    </button>
                  </div>
                </div>

                {message ? (
                  <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
                    {message}
                  </div>
                ) : null}
                {error ? (
                  <div className="mt-5 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                    <FiAlertCircle className="mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                ) : null}

                <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
                  {loadingSessions ? (
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-8 text-center xl:col-span-2">
                      <span className="mx-auto block h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[#00342b]" />
                      <div className="mt-3 text-lg font-extrabold">Loading recurring sessions</div>
                      <p className="mt-1 text-sm text-slate-500">Fetching your daily live session setup.</p>
                    </div>
                  ) : sessions.length === 0 ? (
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-8 text-center xl:col-span-2">
                      <FiCalendar className="mx-auto text-4xl text-slate-300" />
                      <div className="mt-3 text-lg font-extrabold">No recurring sessions yet</div>
                      <p className="mt-1 text-sm text-slate-500">Create one daily session and reuse it every day.</p>
                    </div>
                  ) : (
                    sessions.map((session) => {
                      const status = getSessionStatus(session);
                      const lockedSession = trainerActionsLocked || session.isEnded || session.status === "ended";
                      return (
                        <article key={session.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                          <div className="aspect-[16/9] bg-slate-100">
                            {session.thumbnail ? (
                              <img
                                src={session.thumbnail}
                                alt={session.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-emerald-950 via-teal-800 to-cyan-600 text-white">
                                <FiImage className="text-4xl opacity-80" />
                                <div className="mt-2 text-sm font-extrabold">Daily live session</div>
                              </div>
                            )}
                          </div>
                          <div className="p-5">
                          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                            <div className="min-w-0">
                              <div className="text-[11px] font-extrabold uppercase tracking-widest text-[#006b58]">
                                {session.courseTitle}
                              </div>
                              <h3 className="mt-1 text-lg font-extrabold text-slate-950">{session.title}</h3>
                              {session.subtitle ? (
                                <p className="mt-1 text-sm font-semibold text-slate-500">{session.subtitle}</p>
                              ) : null}
                            </div>
                            <span
                              className={[
                                "inline-flex shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider",
                                getStatusClass(status),
                              ].join(" ")}
                            >
                              {status}
                            </span>
                          </div>

                          <p className="mt-3 text-sm leading-relaxed text-slate-500">{session.description}</p>

                          <div className="mt-4 grid grid-cols-1 gap-2 text-xs font-semibold text-slate-500 sm:grid-cols-2">
                            <span className="flex items-center gap-2">
                              <FiClock />
                              {formatDailyWindow(session)}
                            </span>
                            <span className="flex items-center gap-2">
                              <FiCalendar />
                              {session.recurrenceType === "daily" ? "Repeats daily" : session.recurrenceType}
                            </span>
                          </div>

                          {session.isTodayCancelled ? (
                            <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                              Today's class is cancelled
                              {session.todayCancellationReason ? `: ${session.todayCancellationReason}` : "."}
                            </div>
                          ) : null}
                          {session.todayStatus === "completed_today" ? (
                            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                              Today's session is completed. This recurring session remains active for tomorrow.
                            </div>
                          ) : null}

                          <div className="mt-5 grid grid-cols-2 gap-2 lg:grid-cols-7">
                            <button
                              type="button"
                              disabled={lockedSession || actionId === `edit:${session.id}`}
                              onClick={() => startEditingSession(session)}
                              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-slate-50 text-xs font-extrabold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <FiEdit3 />
                              Edit
                            </button>
                            {session.isPaused ? (
                              <button
                                type="button"
                                disabled={lockedSession || actionId === `resume:${session.id}`}
                                onClick={() => updateSessionAction(session.id, "resume")}
                                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-emerald-50 text-xs font-extrabold text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <FiPlayCircle />
                                Resume
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={lockedSession || actionId === `pause:${session.id}`}
                                onClick={() => updateSessionAction(session.id, "pause")}
                                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-amber-50 text-xs font-extrabold text-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <FiPauseCircle />
                                Pause
                              </button>
                            )}
                            {session.isTodayCancelled ? (
                              <button
                                type="button"
                                disabled={lockedSession || actionId === `restoreToday:${session.id}`}
                                onClick={() => updateSessionAction(session.id, "restoreToday")}
                                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-emerald-50 text-xs font-extrabold text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <FiRotateCcw />
                                Restore
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={lockedSession || actionId === `cancelToday:${session.id}`}
                                onClick={() => openSessionDialog(session.id, "cancelToday")}
                                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-red-50 text-xs font-extrabold text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <FiXCircle />
                                Cancel today
                              </button>
                            )}
                            <a
                              href={session.meetingLink || "#"}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-50 px-2 text-xs font-extrabold text-slate-700 hover:bg-slate-100"
                            >
                              Meet link
                            </a>
                            <button
                              type="button"
                              disabled={lockedSession || actionId === `end:${session.id}`}
                              onClick={() => openSessionDialog(session.id, "end")}
                              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-red-600 text-xs font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <FiStopCircle />
                              End
                            </button>
                            <button
                              type="button"
                              disabled={trainerActionsLocked || actionId === `delete:${session.id}`}
                              onClick={() => openSessionDialog(session.id, "delete")}
                              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-red-50 text-xs font-extrabold text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <FiTrash2 />
                              Delete
                            </button>
                          </div>
                          </div>
                        </article>
                      );
                    })
                  )}
                </div>
              </section>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
