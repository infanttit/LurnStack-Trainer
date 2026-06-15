import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { PATHS } from "../../app/router/paths";
import { useAuth } from "../../auth";
import { categorySuggestions, initialSessionForm, sessionFieldLabels } from "../create-session/createSessionConfig";
import ConfirmSessionDialog from "../dashboard/components/ConfirmSessionDialog";
import DashboardSectionRenderer from "../dashboard/components/DashboardSectionRenderer";
import TrainerDashboardLayout from "../dashboard/components/TrainerDashboardLayout";
import { getDashboardRouteState } from "../dashboard/dashboardRoutes";
import { getDurationMinutes, readImageFile } from "../dashboard/sessionDisplayUtils";
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
} from "../recurring/api/trainerSessionsApi";

const INACTIVE_TRAINER_MESSAGE =
  "Your trainer account is inactive. You cannot manage recurring live sessions.";

const emptyConfirmDialog = {
  open: false,
  action: "",
  sessionId: "",
  title: "",
  message: "",
  reason: "",
};

export default function TrainerDashboardPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [paymentMenuOpen, setPaymentMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [form, setForm] = useState(initialSessionForm);
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
  const statusCheckBlockedRef = useRef(false);

  const { activeTab, activePaymentView } = getDashboardRouteState(location.pathname);
  const trainerActionsLocked = !isTrainerActive;

  const activeSessions = useMemo(
    () => sessions.filter((session) => !session.isEnded && session.status !== "ended"),
    [sessions]
  );
  const todaysCancelledCount = useMemo(
    () => sessions.filter((session) => session.isTodayCancelled).length,
    [sessions]
  );
  const courseTitleSuggestions = useMemo(
    () => [...new Set(courses.map((course) => course.title).filter(Boolean))],
    [courses]
  );
  const combinedCategorySuggestions = useMemo(() => {
    const courseCategories = courses.map((course) => course.category).filter(Boolean);
    return [...new Set([...categorySuggestions, ...courseCategories])];
  }, [courses]);
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

  const goTo = (path) => {
    navigate(path);
    setMobileSidebarOpen(false);
  };

  const loadCourses = async ({ silent = false } = {}) => {
    if (!silent) setLoadingCourses(true);
    try {
      setCourses(await getTrainerCourses());
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
      setSessions(await getTrainerSessions());
      setError("");
    } catch (err) {
      setError(err?.message || "Unable to load recurring live sessions.");
    } finally {
      if (!silent) setLoadingSessions(false);
    }
  };

  const loadTrainerStatus = async ({ silent = false } = {}) => {
    if (statusCheckBlockedRef.current) return;
    if (!silent) setStatusLoading(true);
    try {
      const status = await getTrainerStatus();
      setIsTrainerActive(status.isActive);
      setStatusError(status.message || "");
      if (status.isStatusForbidden) statusCheckBlockedRef.current = true;
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

  const handleCourseTitleChange = (e) => {
    const value = e.target.value;
    const matchedCourse = courses.find(
      (course) => course.title.trim().toLowerCase() === value.trim().toLowerCase()
    );
    setForm((prev) => ({
      ...prev,
      courseTitle: value,
      courseId: matchedCourse && !matchedCourse.isFallback ? matchedCourse.id : "",
      category: matchedCourse?.category || prev.category,
      subtitle: matchedCourse?.subtitle || prev.subtitle,
    }));
    setFormErrors((prev) => ({ ...prev, courseTitle: "" }));
    setMessage("");
    setError("");
  };

  const validateForm = () => {
    const required = ["courseTitle", "title", "description", "startTime", "endTime", "meetingLink"];
    const nextErrors = required.reduce((acc, key) => {
      if (!String(form[key] || "").trim()) acc[key] = `${sessionFieldLabels[key]} is required.`;
      return acc;
    }, {});
    if (getDurationMinutes(form.startTime, form.endTime) <= 0) {
      nextErrors.startTime = "Choose a valid start time.";
      nextErrors.endTime = "End time must be after start time.";
    }
    if (form.isRecurring && (!form.recurringDays || form.recurringDays.length === 0)) {
      nextErrors.recurringDays = "Please select at least one recurring day.";
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
    const thumbnailPreview = await readImageFile(file);
    setForm((prev) => ({ ...prev, thumbnailPreview, thumbnailFile: file }));
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
      if (editingSessionId) await updateTrainerSession(editingSessionId, form);
      else await createTrainerSession(form);
      const successMessage = editingSessionId
        ? "Recurring live session updated successfully."
        : "Daily recurring live session created successfully.";
      setForm(initialSessionForm);
      setFormErrors({});
      setEditingSessionId("");
      setMessage(successMessage);
      toast.success(successMessage);
      navigate(PATHS.TRAINER_RECURRING_SESSIONS);
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
        courseTitle: details.courseTitle,
        category: details.category || "",
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
        trainerInstructions: details.trainerInstructions || "",
        recurringDays: details.recurringDays || [],
        enableWhatsApp: details.enableWhatsApp !== false,
        whatsappTemplateName: details.whatsappTemplateName || "",
        whatsappCustomTitle: details.whatsappCustomTitle || "",
        whatsappButtonUrl: details.whatsappButtonUrl || "",
      });
      setMessage("");
      setError("");
      setFormErrors({});
      navigate(PATHS.TRAINER_CREATE_SESSION);
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
    setForm(initialSessionForm);
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
      if (action === "pause") await pauseTrainerSession(sessionId);
      else if (action === "resume") await resumeTrainerSession(sessionId);
      else if (action === "end") await endTrainerSession(sessionId);
      else if (action === "delete") await deleteTrainerSession(sessionId);
      else if (action === "cancelToday") await cancelTodayTrainerSession(sessionId, reason.trim());
      else if (action === "restoreToday") await restoreTodayTrainerSession(sessionId);
      toast.success(getActionSuccessMessage(action));
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
    const dialogCopy = {
      cancelToday: {
        title: "Cancel today's class",
        message: "Only today's class will be cancelled. The daily recurring session will continue tomorrow.",
      },
      end: {
        title: "End recurring session",
        message: "This permanently ends the daily session. Use pause if you only need a temporary stop.",
      },
      delete: {
        title: "Delete recurring session",
        message: "This permanently deletes the session record. Use end if you want to keep the history but stop future classes.",
      },
    };
    setConfirmDialog({ open: true, action, sessionId, reason: "", ...dialogCopy[action] });
  };

  const closeSessionDialog = () => setConfirmDialog(emptyConfirmDialog);

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

  const fieldClass = (name, extra = "") =>
    [
      extra,
      "border",
      formErrors[name]
        ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100"
        : "border-slate-200 focus:border-[#006b58] focus:ring-4 focus:ring-emerald-900/5",
    ].join(" ");

  if (location.pathname === PATHS.TRAINER_DASHBOARD) {
    return <Navigate to={PATHS.TRAINER_OVERVIEW} replace />;
  }

  return (
    <main className="h-dvh overflow-hidden bg-[#f4f7f6] text-slate-950">
      <ToastContainer position="top-right" autoClose={3200} newestOnTop closeOnClick pauseOnHover theme="colored" />
      <ConfirmSessionDialog
        dialog={confirmDialog}
        onClose={closeSessionDialog}
        onConfirm={confirmSessionDialog}
        onReasonChange={(reason) => setConfirmDialog((prev) => ({ ...prev, reason }))}
      />

      <TrainerDashboardLayout
        activeTab={activeTab}
        activePaymentView={activePaymentView}
        inactiveMessage={INACTIVE_TRAINER_MESSAGE}
        isTrainerActive={isTrainerActive}
        mobileSidebarOpen={mobileSidebarOpen}
        onLogout={logout}
        onNavigate={goTo}
        onOpenSidebar={() => setMobileSidebarOpen(true)}
        onSetMobileSidebarOpen={setMobileSidebarOpen}
        onSetPaymentMenuOpen={setPaymentMenuOpen}
        onToggleSidebarCollapsed={() => setSidebarCollapsed((v) => !v)}
        paymentMenuOpen={paymentMenuOpen}
        sidebarCollapsed={sidebarCollapsed}
        statusError={statusError}
        statusLoading={statusLoading}
        trainerActionsLocked={trainerActionsLocked}
        user={user}
      >
        <DashboardSectionRenderer
          activeTab={activeTab}
          activePaymentView={activePaymentView}
          data={{
            actionId,
            combinedCategorySuggestions,
            courses,
            courseTitleSuggestions,
            editingSessionId,
            error,
            form,
            formErrors,
            isTrainerActive,
            loadingCourses,
            loadingSessions,
            message,
            nextSession,
            sessions,
            submitting,
            todaysCancelledCount,
            trainerActionsLocked,
          }}
          handlers={{
            cancelEditing,
            fieldClass,
            goTo,
            handleChange,
            handleCourseTitleChange,
            handleSubmit,
            handleThumbnailChange,
            loadSessions,
            openSessionDialog,
            startEditingSession,
            updateSessionAction,
          }}
        />
      </TrainerDashboardLayout>
    </main>
  );
}

function getActionSuccessMessage(action) {
  const messages = {
    pause: "Recurring session paused.",
    resume: "Recurring session resumed.",
    end: "Recurring session ended permanently.",
    delete: "Recurring session deleted.",
    cancelToday: "Today's class cancelled.",
    restoreToday: "Today's class restored.",
  };
  return messages[action] || "Session updated successfully.";
}
