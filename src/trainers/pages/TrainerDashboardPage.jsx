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
  FiPlusCircle,
  FiRefreshCw,
  FiSend,
  FiSidebar,
  FiTrash2,
  FiX,
  FiXCircle,
  FiUploadCloud,
  FiUsers,
  FiVideo,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { PATHS } from "../../app/router/paths";
import { useAuth } from "../../auth";
import SmartImage from "../../shared/components/SmartImage";
import {
  cancelTrainerSession,
  createTrainerSession,
  deleteTrainerSession,
  getTrainerSessions,
  getTrainerStatus,
  publishTrainerSession,
  updateTrainerSession,
} from "../api/trainerSessionsApi";

const INACTIVE_TRAINER_MESSAGE =
  "Your trainer account is inactive. You cannot create new classes.";

const initialForm = {
  courseTitle: "",
  category: "Trainer Courses",
  description: "",
  classTitle: "",
  scheduledDate: "",
  startTime: "",
  endTime: "",
  meetUrl: "",
  price: "499",
  thumbnailPreview: "",
  thumbnailFile: null,
};

const tabs = [
  { id: "overview", label: "Overview", icon: FiBookOpen },
  { id: "create", label: "Create live class", icon: FiPlusCircle },
  { id: "classes", label: "Uploaded classes", icon: FiVideo },
];

const categoryOptions = [
  "Trainer Courses",
  "Web Development",
  "Full Stack Development",
  "Frontend Development",
  "Backend Development",
  "Mobile App Development",
  "Data Science",
  "Artificial Intelligence",
  "Cloud Computing",
  "DevOps",
  "Cybersecurity",
  "Database",
  "UI/UX Design",
  "Digital Marketing",
  "Business Strategy",
];

const courseTitleOptionsByCategory = {
  "Trainer Courses": [
    "Full Stack Web Development Masterclass",
    "React Hooks and State Management",
    "Professional Web Development Bootcamp",
    "SQL",
    " PLSQL",
    "Python",
    "Java",
    "Frontend Development",
  ],
  "Web Development": [
    "Master React JS",
    "Modern JavaScript Development",
    "HTML CSS and Responsive Web Design",
  ],
  "Full Stack Development": [
    "Full Stack Web Development",
    "MERN Stack Project Bootcamp",
    "Node.js React PostgreSQL Masterclass",
  ],
  "Frontend Development": [
    "React Frontend Engineering",
    "Advanced UI Development",
    "Next.js Production Masterclass",
  ],
  "Backend Development": [
    "Node.js Backend API Development",
    "Express.js and Authentication",
    "Backend Architecture with PostgreSQL",
  ],
  "Mobile App Development": [
    "Flutter Mobile App Development",
    "React Native App Development",
    "Mobile UI and API Integration",
  ],
  "Data Science": [
    "Python Data Science Bootcamp",
    "SQL for Data Analysis",
    "Machine Learning Foundations",
  ],
  "Artificial Intelligence": [
    "AI Engineering Masterclass",
    "Generative AI for Developers",
    "LLM Application Development",
  ],
  "Cloud Computing": [
    "AWS Cloud Practitioner",
    "Cloud Deployment Fundamentals",
    "Firebase and Cloud Firestore",
  ],
  DevOps: [
    "Docker and Kubernetes Essentials",
    "CI/CD Pipeline Masterclass",
    "VPS Deployment and Nginx",
  ],
  Cybersecurity: [
    "Web Application Security",
    "Ethical Hacking Foundations",
    "API Security Masterclass",
  ],
  Database: [
    "PostgreSQL Database Design",
    "MongoDB NoSQL Guide",
    "Prisma ORM Masterclass",
  ],
  "UI/UX Design": [
    "UI UX Design Foundations",
    "Design Systems Masterclass",
    "Figma for Product Design",
  ],
  "Digital Marketing": [
    "Digital Marketing Strategy",
    "SEO and Content Marketing",
    "Performance Marketing Masterclass",
  ],
  "Business Strategy": [
    "Strategic Mastery for Global Markets",
    "Leadership and Business Growth",
    "Startup Strategy Masterclass",
  ],
};

const emptyConfirmDialog = {
  open: false,
  action: "",
  sessionId: "",
  title: "",
  message: "",
  reason: "",
};

const fieldLabels = {
  courseTitle: "Course title",
  category: "Category",
  description: "Course description",
  classTitle: "Live class title",
  scheduledDate: "Date",
  startTime: "Start time",
  endTime: "End time",
  meetUrl: "Meeting link",
};

function formatClassTime(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Not scheduled";
  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatTimeOnly(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatClassTimeRange(liveClass) {
  const start = formatClassTime(liveClass?.scheduledAt);
  const end = formatTimeOnly(liveClass?.endsAt);
  return end ? `${start} to ${end}` : start;
}

function getDisplayStatus(liveClass) {
  const status = String(liveClass?.status || "").toLowerCase();
  const endsAt = new Date(liveClass?.endsAt || "").getTime();
  if (status !== "cancelled" && Number.isFinite(endsAt) && Date.now() > endsAt) return "completed";
  return status || "draft";
}

function getDurationMinutes(startTime, endTime) {
  const [startHour, startMinute] = String(startTime || "").split(":").map(Number);
  const [endHour, endMinute] = String(endTime || "").split(":").map(Number);
  if (![startHour, startMinute, endHour, endMinute].every(Number.isFinite)) return 0;

  const startTotal = startHour * 60 + startMinute;
  const endTotal = endHour * 60 + endMinute;
  return endTotal > startTotal ? endTotal - startTotal : 0;
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
  const [liveClasses, setLiveClasses] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionId, setActionId] = useState("");
  const [editingSessionId, setEditingSessionId] = useState("");
  const [confirmDialog, setConfirmDialog] = useState(emptyConfirmDialog);
  const [isTrainerActive, setIsTrainerActive] = useState(true);
  const [statusLoading, setStatusLoading] = useState(true);
  const [statusError, setStatusError] = useState("");

  const trainerClasses = useMemo(
    () => liveClasses.filter((liveClass) => !user?.email || liveClass.trainerEmail === user.email),
    [liveClasses, user?.email]
  );
  const courseTitleOptions = useMemo(() => {
    const options = courseTitleOptionsByCategory[form.category] || courseTitleOptionsByCategory["Trainer Courses"];
    return form.courseTitle && !options.includes(form.courseTitle)
      ? [form.courseTitle, ...options]
      : options;
  }, [form.category, form.courseTitle]);

  const nextClass = useMemo(() => {
    const now = Date.now();
    return [...trainerClasses]
      .filter((liveClass) => new Date(liveClass.scheduledAt).getTime() >= now)
      .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))[0];
  }, [trainerClasses]);
  const trainerActionsLocked = !isTrainerActive;

  const loadTrainerClasses = async ({ silent = false } = {}) => {
    if (!silent) setLoadingClasses(true);
    setError("");
    try {
      const sessions = await getTrainerSessions();
      setLiveClasses(sessions);
    } catch (err) {
      setError(err?.message || "Unable to load trainer live classes.");
    } finally {
      if (!silent) setLoadingClasses(false);
    }
  };

  useEffect(() => {
    loadTrainerClasses();
  }, []);

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
    loadTrainerStatus();
    const intervalId = window.setInterval(() => {
      loadTrainerStatus({ silent: true });
    }, 30000);
    return () => window.clearInterval(intervalId);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      if (name === "category") {
        return { ...prev, category: value, courseTitle: "", classTitle: "" };
      }
      return { ...prev, [name]: value };
    });
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
    setMessage("");
    setError("");
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
    const required = [
      "courseTitle",
      "category",
      "description",
      "classTitle",
      "scheduledDate",
      "startTime",
      "endTime",
      "meetUrl",
    ];
    const nextErrors = required.reduce((acc, key) => {
      if (!String(form[key] || "").trim()) acc[key] = `${fieldLabels[key]} is required.`;
      return acc;
    }, {});
    if (Object.keys(nextErrors).length) {
      setFormErrors(nextErrors);
      const firstError = Object.values(nextErrors)[0];
      setError(firstError);
      toast.error(firstError);
      return;
    }

    const durationMinutes = getDurationMinutes(form.startTime, form.endTime);
    if (durationMinutes <= 0) {
      setFormErrors((prev) => ({
        ...prev,
        startTime: "Choose a valid start time.",
        endTime: "End time must be after start time.",
      }));
      setError("Please select a valid class time range.");
      toast.error("Please select a valid class time range.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const payload = {
        courseTitle: String(form.courseTitle || "").trim(),
        category: String(form.category || "").trim(),
        description: String(form.description || "").trim(),
        classTitle: String(form.classTitle || "").trim(),
        scheduledDate: form.scheduledDate,
        startTime: form.startTime,
        endTime: form.endTime,
        meetingLink: String(form.meetUrl || "").trim(),
        thumbnailFile: form.thumbnailFile,
      };

      if (editingSessionId) {
        await updateTrainerSession(editingSessionId, payload);
      } else {
        await createTrainerSession(payload);
      }
      const successMessage = editingSessionId
        ? "Live class updated successfully."
        : "Live class created successfully.";
      setForm(initialForm);
      setFormErrors({});
      setEditingSessionId("");
      setMessage(successMessage);
      toast.success(successMessage);
      setActiveTab("classes");
      await loadTrainerClasses({ silent: true });
    } catch (err) {
      const errorMessage = err?.message || "Unable to create live class.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const startEditingSession = (liveClass) => {
    if (trainerActionsLocked) {
      setError(INACTIVE_TRAINER_MESSAGE);
      toast.warn(INACTIVE_TRAINER_MESSAGE);
      return;
    }
    setEditingSessionId(liveClass.id);
    setForm({
      courseTitle: liveClass.courseTitle || liveClass.courseName || "",
      category: liveClass.category || liveClass.tab || "Trainer Courses",
      description: liveClass.description || "",
      classTitle: liveClass.classTitle || liveClass.title || "",
      scheduledDate: liveClass.scheduledDate || "",
      startTime: liveClass.startTime || "",
      endTime: liveClass.endTime || "",
      meetUrl: liveClass.meetingLink || liveClass.meetUrl || "",
      price: "499",
      thumbnailPreview: liveClass.thumbnail || "",
      thumbnailFile: null,
    });
    setMessage("");
    setError("");
    setFormErrors({});
    setActiveTab("create");
  };

  const cancelEditing = () => {
    setEditingSessionId("");
    setForm(initialForm);
    setMessage("");
    setError("");
    setFormErrors({});
  };

  const openSessionDialog = (sessionId, action) => {
    if (!sessionId) return;
    if (trainerActionsLocked) {
      setError(INACTIVE_TRAINER_MESSAGE);
      toast.warn(INACTIVE_TRAINER_MESSAGE);
      return;
    }
    if (action === "cancel") {
      setConfirmDialog({
        open: true,
        action,
        sessionId,
        title: "Cancel live class",
        message: "Share a short reason. This status will be saved to the live session.",
        reason: "",
      });
      return;
    }
    if (action === "delete") {
      setConfirmDialog({
        open: true,
        action,
        sessionId,
        title: "Delete live class",
        message: "This will permanently delete the live class from the database.",
        reason: "",
      });
    }
  };

  const updateSessionStatus = async (sessionId, action, reason = "") => {
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
      if (action === "publish") {
        await publishTrainerSession(sessionId);
        setMessage("Live class published successfully.");
        toast.success("Live class published successfully.");
      } else if (action === "cancel") {
        if (!reason || !reason.trim()) return;
        await cancelTrainerSession(sessionId, reason.trim());
        setMessage("Live class cancelled successfully.");
        toast.success("Live class cancelled successfully.");
      } else if (action === "delete") {
        await deleteTrainerSession(sessionId);
        setMessage("Live class deleted successfully.");
        toast.success("Live class deleted successfully.");
      }
      await loadTrainerClasses({ silent: true });
    } catch (err) {
      const errorMessage = err?.message || "Unable to update live class.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setActionId("");
    }
  };

  const closeSessionDialog = () => {
    setConfirmDialog(emptyConfirmDialog);
  };

  const confirmSessionDialog = async () => {
    if (!confirmDialog.open) return;
    if (confirmDialog.action === "cancel" && !confirmDialog.reason.trim()) {
      setError("Please enter a cancellation reason.");
      toast.error("Please enter a cancellation reason.");
      return;
    }
    const { sessionId, action, reason } = confirmDialog;
    closeSessionDialog();
    await updateSessionStatus(sessionId, action, reason);
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
        "w-full h-11 rounded-xl px-0 lg:px-4 text-sm font-extrabold inline-flex items-center justify-center gap-3 transition-colors",
        activeTab === id
          ? "bg-white text-[#00342b]"
          : "text-white/70 hover:bg-white/10 hover:text-white",
        sidebarCollapsed ? "justify-center" : "justify-start px-4",
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
      <ToastContainer
        position="top-right"
        autoClose={3200}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="colored"
      />
      {confirmDialog.open ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-950">{confirmDialog.title}</h2>
                <p className="mt-1 text-sm text-slate-500 leading-relaxed">{confirmDialog.message}</p>
              </div>
              <button
                type="button"
                onClick={closeSessionDialog}
                className="w-9 h-9 rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-100 inline-flex items-center justify-center"
                aria-label="Close dialog"
              >
                <FiX />
              </button>
            </div>
            {confirmDialog.action === "cancel" ? (
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
                    placeholder="Example: Trainer is unavailable today."
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#006b58] focus:ring-4 focus:ring-emerald-900/5 resize-none"
                  />
                </label>
              </div>
            ) : null}
            <div className="px-5 py-4 bg-slate-50 flex flex-col sm:flex-row justify-end gap-2">
              <button
                type="button"
                onClick={closeSessionDialog}
                className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-sm font-extrabold text-slate-600"
              >
                Keep class
              </button>
              <button
                type="button"
                onClick={confirmSessionDialog}
                className={[
                  "h-10 px-5 rounded-xl text-sm font-extrabold text-white",
                  confirmDialog.action === "delete" ? "bg-red-600 hover:bg-red-700" : "bg-amber-600 hover:bg-amber-700",
                ].join(" ")}
              >
                {confirmDialog.action === "delete" ? "Delete class" : "Cancel class"}
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
            "fixed lg:static inset-y-0 left-0 z-50 lg:z-auto h-dvh min-h-0 bg-[#00342b] text-white p-5 flex flex-col overflow-hidden transition-transform duration-300",
            mobileSidebarOpen ? "translate-x-0 w-[280px]" : "-translate-x-full w-[280px]",
            "lg:translate-x-0",
            sidebarCollapsed ? "lg:w-[92px]" : "lg:w-auto",
          ].join(" ")}
        >
          <div className={["flex items-center gap-3", sidebarCollapsed ? "justify-center" : "justify-between"].join(" ")}>
            {sidebarCollapsed ? (
              <div className="hidden lg:flex w-11 h-11 rounded-2xl bg-white/10 items-center justify-center text-sm font-black">
                LS
              </div>
            ) : (
              <div className="min-w-0">
                <div className="text-2xl font-extrabold leading-none">LurnStack</div>
                <div className="mt-1 text-xs text-white/60 font-semibold">Trainer Portal</div>
              </div>
            )}
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(false)}
              className="lg:hidden w-11 h-11 rounded-xl bg-white/10 text-white inline-flex items-center justify-center hover:bg-white/15 transition-colors flex-shrink-0"
              title="Close sidebar"
            >
              <FiX />
            </button>
            <button
              type="button"
              onClick={() => setSidebarCollapsed((v) => !v)}
              className="hidden lg:inline-flex w-11 h-11 rounded-xl bg-white/10 text-white items-center justify-center hover:bg-white/15 transition-colors flex-shrink-0"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <FiSidebar />
            </button>
          </div>

          <nav className="mt-10 space-y-2">{tabs.map(renderTabButton)}</nav>

          <div className={["mt-auto rounded-2xl bg-white/10 p-2 lg:p-4", sidebarCollapsed ? "lg:px-2" : ""].join(" ")}>
            {sidebarCollapsed ? (
              <div className="mx-auto w-10 h-10 rounded-full bg-white/15 flex items-center justify-center text-sm font-extrabold">
                {(user?.fullName || "T").slice(0, 1).toUpperCase()}
              </div>
            ) : (
              <>
                <div className="text-sm font-extrabold truncate">{user?.fullName || "Trainer"}</div>
                <div className="mt-1 text-xs text-white/60 break-all line-clamp-2">{user?.email}</div>
              </>
            )}
            <button
              type="button"
              onClick={logout}
              className="mt-4 h-10 w-full rounded-xl border border-white/20 text-sm font-extrabold inline-flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
              title="Log out"
            >
              <FiLogOut />
              <span className={sidebarCollapsed ? "hidden" : "inline"}>Log out</span>
            </button>
          </div>
        </aside>

        <section className="min-w-0 h-dvh min-h-0 flex flex-col overflow-hidden">
          <header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-4 sm:py-5 flex-shrink-0">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => setMobileSidebarOpen(true)}
                  className="lg:hidden mt-0.5 w-11 h-11 rounded-xl bg-[#00342b] text-white inline-flex items-center justify-center flex-shrink-0"
                  aria-label="Open trainer sidebar"
                >
                  <FiMenu />
                </button>
                <div>
                  <div className="lg:hidden text-xs font-extrabold uppercase tracking-[0.18em] text-[#006b58]">
                    Trainer Portal
                  </div>
                  <h1 className="text-xl sm:text-3xl font-extrabold text-slate-950 leading-tight">
                    Live class management
                  </h1>
                  <p className="mt-1 text-xs sm:text-sm text-slate-500 leading-relaxed">
                    Create trainer-led classes and publish them directly to student Courses, Categories, and Live Classes.
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span
                      className={[
                        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider border",
                        statusLoading
                          ? "bg-slate-50 text-slate-600 border-slate-200"
                          : isTrainerActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : "bg-amber-50 text-amber-700 border-amber-100",
                      ].join(" ")}
                    >
                      {statusLoading ? "Checking status" : isTrainerActive ? "Active trainer" : "Inactive trainer"}
                    </span>
                    {statusError ? (
                      <span className="text-xs font-semibold text-red-600">{statusError}</span>
                    ) : null}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={logout}
                className="lg:hidden h-10 px-4 rounded-xl border border-slate-200 text-sm font-extrabold inline-flex items-center justify-center gap-2"
              >
                <FiLogOut />
                Log out
              </button>
            </div>

          </header>

          <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-6 lg:p-8">
            {trainerActionsLocked ? (
              <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900 flex items-start gap-3">
                <FiAlertCircle className="mt-0.5 flex-shrink-0" />
                <span>{INACTIVE_TRAINER_MESSAGE}</span>
              </div>
            ) : null}

            {activeTab === "overview" ? (
              <div className="space-y-6">
                <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  {[
                    ["Published classes", trainerClasses.length, FiVideo],
                    ["Live API status", loadingClasses ? "Syncing" : "Connected", FiUsers],
                    ["Account status", statusLoading ? "Checking" : isTrainerActive ? "Active" : "Inactive", FiCheckCircle],
                    ["Next class", nextClass ? formatClassTime(nextClass.scheduledAt) : "Not scheduled", FiClock],
                  ].map(([label, value, Icon]) => (
                    <div key={label} className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
                      <Icon className="text-[#006b58] text-xl" />
                      <div className="mt-4 text-xl font-extrabold">{value}</div>
                      <div className="mt-1 text-sm font-semibold text-slate-500">{label}</div>
                    </div>
                  ))}
                </section>

                <section className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 shadow-sm">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-[#00342b] text-white flex items-center justify-center text-2xl font-black">
                        {(user?.fullName || "T").slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <h2 className="text-xl font-extrabold text-slate-950">{user?.fullName || "Trainer"}</h2>
                        <p className="mt-1 text-sm font-semibold text-slate-500 break-all">{user?.email || "No email available"}</p>
                        {user?.phoneNumber ? (
                          <p className="mt-1 text-sm font-semibold text-slate-500">{user.phoneNumber}</p>
                        ) : null}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="text-xs font-black uppercase tracking-widest text-slate-500">Trainer access</div>
                      <div
                        className={[
                          "mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider border",
                          isTrainerActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : "bg-amber-50 text-amber-700 border-amber-100",
                        ].join(" ")}
                      >
                        {isTrainerActive ? "Creation enabled" : "Creation locked"}
                      </div>
                      <p className="mt-2 max-w-sm text-xs leading-relaxed text-slate-500">
                        Admin activation controls whether this trainer can create or manage live sessions.
                      </p>
                    </div>
                  </div>
                </section>

                <section className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-extrabold">Publishing flow</h2>
                      <p className="mt-1 text-sm text-slate-500">
                        A single upload creates the student-facing course card, category listing, course details live-class block, and student live-class card.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab("create")}
                      disabled={trainerActionsLocked}
                      className="h-11 px-5 rounded-xl bg-[#00342b] text-white text-sm font-extrabold inline-flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <FiPlusCircle />
                      Create class
                    </button>
                  </div>

                  <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-3">
                    {["Upload thumbnail", "Add class details", "Publish", "Students view"].map((item, index) => (
                      <div key={item} className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                        <div className="w-8 h-8 rounded-full bg-[#00342b] text-white flex items-center justify-center text-sm font-extrabold">
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
              <form
                onSubmit={handleSubmit}
                className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-6 shadow-sm"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-[#00342b] text-white flex items-center justify-center">
                      <FiUploadCloud className="text-xl" />
                    </div>
                    <div>
                      <h2 className="text-xl font-extrabold">
                        {editingSessionId ? "Edit live class" : "Create live class"}
                      </h2>
                      <p className="text-sm text-slate-500">
                        {editingSessionId
                          ? "Update the class details that students will see."
                          : "Upload a thumbnail and class details for the student course pages."}
                      </p>
                    </div>
                  </div>
                  {editingSessionId ? (
                    <button
                      type="button"
                      onClick={cancelEditing}
                      className="h-10 px-4 rounded-xl border border-slate-200 text-sm font-extrabold text-slate-600 hover:border-red-200 hover:text-red-700 transition-colors"
                    >
                      Cancel edit
                    </button>
                  ) : null}
                  {message ? (
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
                      {message}
                    </div>
                  ) : null}
                  {error ? (
                    <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 flex items-start gap-2">
                      <FiAlertCircle className="mt-0.5 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  ) : null}
                  {trainerActionsLocked ? (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900 flex items-start gap-2">
                      <FiAlertCircle className="mt-0.5 flex-shrink-0" />
                      <span>{INACTIVE_TRAINER_MESSAGE}</span>
                    </div>
                  ) : null}
                </div>

                <fieldset
                  disabled={trainerActionsLocked || submitting}
                  className="mt-6 grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-6 items-start disabled:opacity-60"
                >
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 xl:sticky xl:top-0">
                    <div className="aspect-[16/10] rounded-xl overflow-hidden bg-white border border-slate-200">
                      {form.thumbnailPreview ? (
                        <img src={form.thumbnailPreview} alt="Class thumbnail preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-emerald-950 via-teal-800 to-cyan-600 flex flex-col items-center justify-center text-white">
                          <FiImage className="text-4xl opacity-80" />
                          <div className="mt-2 text-sm font-extrabold">Thumbnail preview</div>
                        </div>
                      )}
                    </div>
                    <label className="mt-4 h-11 rounded-xl bg-white border border-slate-200 text-sm font-extrabold text-slate-700 flex items-center justify-center gap-2 cursor-pointer hover:border-[#006b58] transition-colors">
                      <FiImage />
                      Upload thumbnail
                      <input type="file" accept="image/*" onChange={handleThumbnailChange} className="hidden" />
                    </label>
                    <p className="mt-2 text-xs text-slate-500">
                      This image appears on student course cards and live class cards.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="sm:col-span-2">
                      <span className="text-xs font-extrabold uppercase tracking-widest text-slate-500">Course title</span>
                      <select name="courseTitle" value={form.courseTitle} onChange={handleChange} className={fieldClass("courseTitle", "mt-1 w-full h-11 rounded-xl px-4 text-sm outline-none bg-white")}>
                        <option value="">Select course title</option>
                        {courseTitleOptions.map((title) => (
                          <option key={title} value={title}>
                            {title}
                          </option>
                        ))}
                      </select>
                      {formErrors.courseTitle ? <p className="mt-1 text-xs font-semibold text-red-600">{formErrors.courseTitle}</p> : null}
                    </label>

                    <label>
                      <span className="text-xs font-extrabold uppercase tracking-widest text-slate-500">Category</span>
                      <select name="category" value={form.category} onChange={handleChange} className={fieldClass("category", "mt-1 w-full h-11 rounded-xl px-4 text-sm outline-none bg-white")}>
                        {categoryOptions.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                      {formErrors.category ? <p className="mt-1 text-xs font-semibold text-red-600">{formErrors.category}</p> : null}
                    </label>

                    <label className="sm:col-span-2">
                      <span className="text-xs font-extrabold uppercase tracking-widest text-slate-500">Course description</span>
                      <textarea name="description" value={form.description} onChange={handleChange} rows={3} placeholder="What will students learn in this class?" className={fieldClass("description", "mt-1 w-full rounded-xl px-4 py-3 text-sm outline-none resize-none")} />
                      {formErrors.description ? <p className="mt-1 text-xs font-semibold text-red-600">{formErrors.description}</p> : null}
                    </label>

                    <label className="sm:col-span-2">
                      <span className="text-xs font-extrabold uppercase tracking-widest text-slate-500">Live class title</span>
                      <input name="classTitle" value={form.classTitle} onChange={handleChange} placeholder="Example: React Hooks and State Management" className={fieldClass("classTitle", "mt-1 w-full h-11 rounded-xl px-4 text-sm outline-none")} />
                      {formErrors.classTitle ? <p className="mt-1 text-xs font-semibold text-red-600">{formErrors.classTitle}</p> : null}
                    </label>

                    <label>
                      <span className="text-xs font-extrabold uppercase tracking-widest text-slate-500">Date</span>
                      <input name="scheduledDate" type="date" value={form.scheduledDate} onChange={handleChange} className={fieldClass("scheduledDate", "mt-1 w-full h-11 rounded-xl px-4 text-sm outline-none")} />
                      {formErrors.scheduledDate ? <p className="mt-1 text-xs font-semibold text-red-600">{formErrors.scheduledDate}</p> : null}
                    </label>

                    <label>
                      <span className="text-xs font-extrabold uppercase tracking-widest text-slate-500">Start time</span>
                      <input name="startTime" type="time" value={form.startTime} onChange={handleChange} className={fieldClass("startTime", "mt-1 w-full h-11 rounded-xl px-4 text-sm outline-none")} />
                      {formErrors.startTime ? <p className="mt-1 text-xs font-semibold text-red-600">{formErrors.startTime}</p> : null}
                    </label>

                    <label>
                      <span className="text-xs font-extrabold uppercase tracking-widest text-slate-500">End time</span>
                      <input name="endTime" type="time" value={form.endTime} onChange={handleChange} className={fieldClass("endTime", "mt-1 w-full h-11 rounded-xl px-4 text-sm outline-none")} />
                      {formErrors.endTime ? <p className="mt-1 text-xs font-semibold text-red-600">{formErrors.endTime}</p> : null}
                    </label>

                    {form.startTime && form.endTime ? (
                      <div className="sm:col-span-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-extrabold text-emerald-950">
                        Class timing: {formatTimeOnly(`2026-01-01T${form.startTime}:00+05:30`)} to {formatTimeOnly(`2026-01-01T${form.endTime}:00+05:30`)}
                      </div>
                    ) : null}

                    <label>
                      <span className="text-xs font-extrabold uppercase tracking-widest text-slate-500">Meeting link</span>
                      <input name="meetUrl" type="url" value={form.meetUrl} onChange={handleChange} placeholder="https://meet.google.com/..." className={fieldClass("meetUrl", "mt-1 w-full h-11 rounded-xl px-4 text-sm outline-none")} />
                      {formErrors.meetUrl ? <p className="mt-1 text-xs font-semibold text-red-600">{formErrors.meetUrl}</p> : null}
                    </label>
                  </div>
                </fieldset>

                <button
                  type="submit"
                  disabled={submitting || trainerActionsLocked}
                  className="mt-6 w-full h-12 rounded-xl bg-[#00342b] text-white text-sm font-extrabold inline-flex items-center justify-center gap-2 hover:bg-[#004d40] transition-colors disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitting ? (
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    <FiCheckCircle className="text-lg" />
                  )}
                  {submitting
                    ? editingSessionId
                      ? "Updating live class..."
                      : "Creating live class..."
                    : editingSessionId
                      ? "Update live class"
                      : "Create live class"}
                </button>
              </form>
            ) : null}

            {activeTab === "classes" ? (
              <section className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-extrabold">Uploaded live classes</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      These classes are visible on the student Courses, Categories, Course Details, and Live Classes pages.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("create")}
                    disabled={trainerActionsLocked}
                    className="h-11 px-5 rounded-xl bg-[#00342b] text-white text-sm font-extrabold inline-flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <FiPlusCircle />
                    New class
                  </button>
                  <button
                    type="button"
                    onClick={() => loadTrainerClasses()}
                    className="h-11 px-5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-extrabold inline-flex items-center justify-center gap-2 hover:border-[#006b58] transition-colors"
                  >
                    <FiRefreshCw className={loadingClasses ? "animate-spin" : ""} />
                    Refresh
                  </button>
                </div>

                {message ? (
                  <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
                    {message}
                  </div>
                ) : null}
                {error ? (
                  <div className="mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 flex items-start gap-2">
                    <FiAlertCircle className="mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                ) : null}

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {loadingClasses ? (
                    <div className="md:col-span-2 xl:col-span-3 rounded-2xl bg-slate-50 border border-slate-100 p-8 text-center">
                      <span className="mx-auto block w-8 h-8 rounded-full border-2 border-slate-200 border-t-[#00342b] animate-spin" />
                      <div className="mt-3 text-lg font-extrabold">Loading live classes</div>
                      <p className="mt-1 text-sm text-slate-500">Fetching your trainer sessions securely.</p>
                    </div>
                  ) : trainerClasses.length === 0 ? (
                    <div className="md:col-span-2 xl:col-span-3 rounded-2xl bg-slate-50 border border-slate-100 p-8 text-center">
                      <FiVideo className="mx-auto text-4xl text-slate-300" />
                      <div className="mt-3 text-lg font-extrabold">No classes uploaded yet</div>
                      <p className="mt-1 text-sm text-slate-500">Create your first live class to publish it for students.</p>
                    </div>
                  ) : (
                    trainerClasses.map((liveClass) => (
                      <article key={liveClass.id} className="rounded-2xl border border-slate-200 overflow-hidden bg-white">
                        <div className="aspect-[16/9] bg-slate-100">
                          <SmartImage
                            src={liveClass.thumbnail}
                            alt={liveClass.title}
                            className="w-full h-full object-cover"
                            fallbackClassName="w-full h-full bg-gradient-to-br from-emerald-950 via-teal-800 to-cyan-600"
                          />
                        </div>
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-[11px] font-extrabold uppercase tracking-widest text-[#006b58] truncate">
                                {liveClass.courseName}
                              </div>
                              <h3 className="mt-1 text-base font-extrabold text-slate-950 line-clamp-2">
                                {liveClass.title}
                              </h3>
                            </div>
                            <span
                              className={[
                                "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider",
                                getDisplayStatus(liveClass) === "completed"
                                  ? "bg-slate-100 text-slate-700 border border-slate-200"
                                  : getDisplayStatus(liveClass) === "published"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                    : getDisplayStatus(liveClass) === "cancelled"
                                      ? "bg-red-50 text-red-700 border border-red-100"
                                      : "bg-amber-50 text-amber-700 border border-amber-100",
                              ].join(" ")}
                            >
                              {getDisplayStatus(liveClass)}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-slate-500 line-clamp-2">
                            {liveClass.description}
                          </p>
                          <div className="mt-4 space-y-2 text-xs font-semibold text-slate-500">
                            <span className="flex items-center gap-2">
                              <FiClock />
                              {formatClassTimeRange(liveClass)} IST
                            </span>
                            <span className="flex items-center gap-2">
                              <FiCalendar />
                              {liveClass.durationMinutes} minutes
                            </span>
                          </div>
                          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <button
                              type="button"
                              disabled={trainerActionsLocked}
                              onClick={() => startEditingSession(liveClass)}
                              className="h-9 rounded-lg bg-slate-50 text-slate-700 text-[11px] font-extrabold inline-flex items-center justify-center gap-1.5 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Edit live class"
                            >
                              <FiEdit3 />
                              Edit
                            </button>
                            <button
                              type="button"
                              disabled={trainerActionsLocked || actionId === `publish:${liveClass.id}` || liveClass.status === "published"}
                              onClick={() => updateSessionStatus(liveClass.id, "publish")}
                              className="h-9 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-extrabold inline-flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Publish live class"
                            >
                              <FiSend />
                              Publish
                            </button>
                            <button
                              type="button"
                              disabled={trainerActionsLocked || actionId === `cancel:${liveClass.id}` || liveClass.status === "cancelled"}
                              onClick={() => openSessionDialog(liveClass.id, "cancel")}
                              className="h-9 rounded-lg bg-amber-50 text-amber-700 text-[11px] font-extrabold inline-flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Cancel live class"
                            >
                              <FiXCircle />
                              Cancel
                            </button>
                            <button
                              type="button"
                              disabled={trainerActionsLocked || actionId === `delete:${liveClass.id}`}
                              onClick={() => openSessionDialog(liveClass.id, "delete")}
                              className="h-9 rounded-lg bg-red-50 text-red-700 text-[11px] font-extrabold inline-flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Delete live class"
                            >
                              <FiTrash2 />
                              Delete
                            </button>
                          </div>
                        </div>
                      </article>
                    ))
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
