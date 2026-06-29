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
  requestDeleteTrainerSession,
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

function autoCalculateDuration(formState) {
  const { startTime, endTime, recurringDays, recurrenceEndDate, totalDays } = formState;

  if (!startTime || !endTime) {
    return {
      totalDays: totalDays || "",
      totalHoursPart: "",
      totalMinutesPart: "",
    };
  }

  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);
  if (isNaN(startHour) || isNaN(startMinute) || isNaN(endHour) || isNaN(endMinute)) {
    return {
      totalDays: totalDays || "",
      totalHoursPart: "",
      totalMinutesPart: "",
    };
  }

  const startTotal = startHour * 60 + startMinute;
  const endTotal = endHour * 60 + endMinute;
  const durationPerClass = endTotal - startTotal;

  if (durationPerClass <= 0) {
    return {
      totalDays: totalDays || "",
      totalHoursPart: "",
      totalMinutesPart: "",
    };
  }

  // Determine number of days
  let daysCount = 0;
  let hasRecurrence = false;

  if (recurrenceEndDate && recurringDays && recurringDays.length > 0) {
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const parts = recurrenceEndDate.split("-").map(Number);
    if (parts.length === 3 && !parts.some(isNaN)) {
      const endDate = new Date(parts[0], parts[1] - 1, parts[2]);
      if (endDate >= startDate) {
        hasRecurrence = true;
        let current = new Date(startDate);
        let limit = 10000;
        while (current <= endDate && limit > 0) {
          if (recurringDays.includes(current.getDay())) {
            daysCount++;
          }
          current.setDate(current.getDate() + 1);
          limit--;
        }
      }
    }
  }

  // Fallback to manual totalDays or default to 1 day
  let finalDays = 1;
  let finalDaysString = totalDays || "";

  if (hasRecurrence) {
    finalDays = daysCount > 0 ? daysCount : 1;
    finalDaysString = String(daysCount);
  } else if (totalDays && !isNaN(Number(totalDays)) && Number(totalDays) > 0) {
    finalDays = Number(totalDays);
    finalDaysString = String(totalDays);
  }

  const totalMinutes = finalDays * durationPerClass;
  const calculatedHoursPart = Math.floor(totalMinutes / 60);
  const calculatedMinutesPart = totalMinutes % 60;

  return {
    totalDays: finalDaysString,
    totalHoursPart: calculatedHoursPart === 0 ? "" : String(calculatedHoursPart),
    totalMinutesPart: calculatedMinutesPart === 0 ? "" : String(calculatedMinutesPart),
  };
}

export default function TrainerDashboardPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { activeTab, activePaymentView } = getDashboardRouteState(location.pathname);

  const [paymentMenuOpen, setPaymentMenuOpen] = useState(activeTab === "earnings");
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

  useEffect(() => {
    if (activeTab === "earnings") {
      setPaymentMenuOpen(true);
    } else {
      setPaymentMenuOpen(false);
    }
  }, [activeTab]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: type === "checkbox" ? checked : value };
      if (
        name === "startTime" ||
        name === "endTime" ||
        name === "recurringDays" ||
        name === "recurrenceEndDate" ||
        name === "totalDays"
      ) {
        const calc = autoCalculateDuration(next);
        return {
          ...next,
          totalDays: calc.totalDays,
          totalHoursPart: calc.totalHoursPart,
          totalMinutesPart: calc.totalMinutesPart,
        };
      }
      return next;
    });
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
    setMessage("");
    setError("");
  };

  const handleCourseTitleChange = (e) => {
    const value = e.target.value;
    const matchedCourse = courses.find(
      (course) => course.title.trim().toLowerCase() === value.trim().toLowerCase()
    );
    setForm((prev) => {
      const next = {
        ...prev,
        courseTitle: value,
        courseId: matchedCourse && !matchedCourse.isFallback ? matchedCourse.id : "",
        category: matchedCourse?.category || prev.category,
        subtitle: matchedCourse?.subtitle || prev.subtitle,
      };
      return next;
    });
    setFormErrors((prev) => ({ ...prev, courseTitle: "" }));
    setMessage("");
    setError("");
  };

  const validateForm = (formToValidate = form) => {
    const required = [
      "courseTitle",
      "title",
      "category",
      "subtitle",
      "description",
      "trainerInstructions",
      "startTime",
      "endTime",
      "timezone",
      "meetingLink",
      "recurrenceEndDate"
    ];
    const nextErrors = required.reduce((acc, key) => {
      if (!String(formToValidate[key] || "").trim()) {
        const label = sessionFieldLabels[key] || (
          key === "category" ? "Category" :
          key === "subtitle" ? "Subtitle" :
          key === "trainerInstructions" ? "Instructions / Notes for Students" :
          key === "timezone" ? "Timezone" :
          key
        );
        acc[key] = `${label} is required.`;
      }
      return acc;
    }, {});

    if (!formToValidate.thumbnailPreview) {
      nextErrors.thumbnailPreview = "Session thumbnail is required.";
    }

    if (getDurationMinutes(formToValidate.startTime, formToValidate.endTime) <= 0) {
      if (!nextErrors.startTime) nextErrors.startTime = "Choose a valid start time.";
      if (!nextErrors.endTime) nextErrors.endTime = "End time must be after start time.";
    }

    if (formToValidate.isRecurring) {
      if (!formToValidate.recurringDays || formToValidate.recurringDays.length === 0) {
        nextErrors.recurringDays = "Please select at least one recurring day.";
      }
      if (!formToValidate.recurrenceEndDate) {
        nextErrors.recurrenceEndDate = "Recurrence end date is required.";
      } else {
        const parts = String(formToValidate.recurrenceEndDate).split("-").map(Number);
        if (parts.length === 3 && !parts.some(isNaN)) {
          const selectedDate = new Date(parts[0], parts[1] - 1, parts[2]);
          const today = new Date();
          const localToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
          if (selectedDate < localToday) {
            nextErrors.recurrenceEndDate = "Recurrence end date cannot be in the past.";
          }
        }
      }
    }

    // Validate combined total hours
    const hoursPart = formToValidate.totalHoursPart !== "" && formToValidate.totalHoursPart !== undefined && formToValidate.totalHoursPart !== null ? Number(formToValidate.totalHoursPart) : 0;
    const minutesPart = formToValidate.totalMinutesPart !== "" && formToValidate.totalMinutesPart !== undefined && formToValidate.totalMinutesPart !== null ? Number(formToValidate.totalMinutesPart) : 0;
    const totalHoursVal = hoursPart + (minutesPart / 60);

    if (!formToValidate.totalHoursPart && !formToValidate.totalMinutesPart) {
      nextErrors.totalHours = "Total Course Duration (Hours) is required.";
    } else if (isNaN(totalHoursVal) || totalHoursVal <= 0) {
      nextErrors.totalHours = "Total duration must be greater than zero.";
    } else if (isNaN(hoursPart) || hoursPart < 0) {
      nextErrors.totalHours = "Hours must be a non-negative number.";
    } else if (isNaN(minutesPart) || minutesPart < 0 || minutesPart >= 60) {
      nextErrors.totalHours = "Minutes must be between 0 and 59.";
    }

    if (formToValidate.totalDays !== "" && formToValidate.totalDays !== undefined && formToValidate.totalDays !== null) {
      const daysVal = Number(formToValidate.totalDays);
      if (isNaN(daysVal) || daysVal <= 0) {
        nextErrors.totalDays = "Total days must be a positive number.";
      }
    } else {
      nextErrors.totalDays = "Total Course Duration (Days) is required.";
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

    const hoursPart = form.totalHoursPart !== "" && form.totalHoursPart !== undefined && form.totalHoursPart !== null ? Number(form.totalHoursPart) : 0;
    const minutesPart = form.totalMinutesPart !== "" && form.totalMinutesPart !== undefined && form.totalMinutesPart !== null ? Number(form.totalMinutesPart) : 0;
    
    let calculatedTotalHours = "";
    if (
      (form.totalHoursPart !== "" && form.totalHoursPart !== undefined && form.totalHoursPart !== null) ||
      (form.totalMinutesPart !== "" && form.totalMinutesPart !== undefined && form.totalMinutesPart !== null)
    ) {
      calculatedTotalHours = hoursPart + (minutesPart / 60);
    }
    
    const formWithCalculatedHours = {
      ...form,
      totalHours: calculatedTotalHours !== "" ? calculatedTotalHours : "",
    };

    const nextErrors = validateForm(formWithCalculatedHours);
    if (Object.keys(nextErrors).length) {
      const firstError = Object.values(nextErrors)[0];
      setError(firstError);
      toast.error(firstError);
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      if (editingSessionId) await updateTrainerSession(editingSessionId, formWithCalculatedHours);
      else await createTrainerSession(formWithCalculatedHours);
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

      const rawTotalHours = details.totalHours ?? "";
      let totalHoursPart = "";
      let totalMinutesPart = "";
      if (rawTotalHours !== "" && rawTotalHours !== null && rawTotalHours !== undefined) {
        const totalHoursNum = Number(rawTotalHours);
        if (!isNaN(totalHoursNum)) {
          totalHoursPart = Math.floor(totalHoursNum);
          totalMinutesPart = Math.round((totalHoursNum - totalHoursPart) * 60);
          
          if (totalHoursPart === 0 && totalMinutesPart === 0) {
            totalHoursPart = "";
            totalMinutesPart = "";
          } else if (totalHoursPart === 0) {
            totalHoursPart = "";
          }
        }
      }

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
        recurringDays: details.recurringDays
          ? (typeof details.recurringDays === "string"
              ? JSON.parse(details.recurringDays)
              : details.recurringDays)
          : [],
        recurrenceEndDate: details.recurrenceEndDate ? String(details.recurrenceEndDate).substring(0, 10) : "",
        enableWhatsApp: details.enableWhatsApp !== false,
        whatsappTemplateName: details.whatsappTemplateName || "",
        whatsappCustomTitle: details.whatsappCustomTitle || "",
        whatsappButtonUrl: details.whatsappButtonUrl || "",
        totalHours: details.totalHours ?? "",
        totalHoursPart,
        totalMinutesPart,
        totalDays: details.totalDays ?? "",
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
      else if (action === "requestDelete") await requestDeleteTrainerSession(sessionId);
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
      requestDelete: {
        title: "Request session deletion",
        message: "You cannot delete a session directly. This will send a request to the admin to delete the session.",
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
    requestDelete: "Deletion request sent to admin.",
    cancelToday: "Today's class cancelled.",
    restoreToday: "Today's class restored.",
  };
  return messages[action] || "Session updated successfully.";
}
