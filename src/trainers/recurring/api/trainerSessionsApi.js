import { axiosClient } from "../../../shared/api/axiosClient";
import { getAxiosErrorMessage, getAxiosErrorStatus } from "../../../shared/api/axiosError";
import { env } from "../../../shared/config/env";
import { FALLBACK_TRAINER_COURSES } from "../data/fallbackTrainerCourses";

function getTrainerSessionError(err, fallback, { preferBackendForbiddenMessage = false } = {}) {
  const status = getAxiosErrorStatus(err);
  if (status === 401) return "Please log in as a trainer to continue.";
  if (status === 403) {
    return preferBackendForbiddenMessage
      ? getAxiosErrorMessage(err, "Action restricted. Inactive trainers cannot manage sessions.")
      : "Action restricted. Your trainer account is inactive.";
  }
  if (status === 404) return "The recurring live session could not be found.";
  if (status >= 500) return "Trainer session service is unavailable. Please try again later.";
  return getAxiosErrorMessage(err, fallback);
}

function unwrap(res) {
  const data = res?.data;
  if (!data?.success) throw new Error(data?.message || "Request failed");
  return data;
}

function normalizeActiveStatus(payload) {
  const source = payload?.data || payload?.trainer || payload?.user || payload || {};
  const raw =
    source.isActive ??
    source.status ??
    source.active ??
    source.IS_ACTIVE ??
    source.STATUS ??
    false;

  if (typeof raw === "boolean") return raw;
  if (typeof raw === "number") return raw === 1;

  const value = String(raw || "").trim().toLowerCase();
  return ["true", "1", "active", "activated", "enabled", "approved"].includes(value);
}

function normalizeCourse(dto) {
  const raw = dto || {};
  return {
    id: String(raw.id || raw._id || raw.courseId || ""),
    isFallback: Boolean(raw.isFallback),
    title: raw.title || raw.courseTitle || raw.name || raw.courseName || "Untitled course",
    subtitle: raw.subtitle || raw.shortDescription || "",
    category: raw.category || raw.tab || "",
    raw,
  };
}

function toAbsoluteAssetUrl(path) {
  const value = String(path || "").trim();
  if (!value) return "";
  if (/^(https?:|data:|blob:)/i.test(value)) return value;
  const baseUrl = String(env.apiBaseUrl || "").replace(/\/+$/, "");
  return `${baseUrl}/${value.replace(/^\/+/, "")}`;
}

function normalizeSession(dto) {
  const raw = dto || {};
  const status = String(raw.status || (raw.isPaused ? "paused" : "active") || "active").toLowerCase();
  const todayStatus = String(
    raw.todayStatus ||
      raw.todaysStatus ||
      raw.currentDayStatus ||
      raw.dailyStatus ||
      ""
  )
    .trim()
    .toLowerCase();
  const todayCancellation =
    raw.todayCancellation ||
    raw.todayCancel ||
    raw.cancelledToday ||
    raw.todaysCancellation ||
    null;

  let recurringDays = [];
  if (Array.isArray(raw.recurringDays)) {
    recurringDays = raw.recurringDays.map(Number);
  } else if (typeof raw.recurringDays === "string") {
    try {
      const parsed = JSON.parse(raw.recurringDays);
      if (Array.isArray(parsed)) {
        recurringDays = parsed.map(Number);
      }
    } catch {
      recurringDays = raw.recurringDays
        .split(",")
        .map(Number)
        .filter((n) => !isNaN(n));
    }
  }

  return {
    id: String(raw.id || raw._id || raw.sessionId || ""),
    courseId: String(raw.courseId || raw.course?._id || raw.course?.id || ""),
    courseTitle:
      raw.courseTitle ||
      raw.courseName ||
      raw.course?.title ||
      raw.course?.courseTitle ||
      raw.course?.name ||
      "Assigned course",
    category: raw.category || raw.course?.category || raw.tab || "",
    title: raw.title || raw.classTitle || "Recurring live session",
    subtitle: raw.subtitle || "",
    description: raw.description || "",
    startTime: raw.startTime || "",
    endTime: raw.endTime || "",
    timezone: raw.timezone || "Asia/Kolkata",
    meetingLink: raw.meetingLink || raw.meetUrl || "",
    thumbnail: toAbsoluteAssetUrl(raw.thumbnail || raw.thumbnailUrl || raw.image || ""),
    isRecurring: raw.isRecurring !== false,
    recurrenceType: raw.recurrenceType || "daily",
    trainerInstructions: raw.trainerInstructions || "",
    recurringDays,
    recurrenceEndDate: raw.recurrenceEndDate || raw.recurrence_end_date || null,
    enableWhatsApp: raw.enableWhatsApp !== false,
    whatsappTemplateName: raw.whatsappTemplateName || "",
    whatsappCustomTitle: raw.whatsappCustomTitle || "",
    whatsappButtonUrl: raw.whatsappButtonUrl || "",
    status,
    isPaused: Boolean(raw.isPaused) || status === "paused",
    isEnded: Boolean(raw.isEnded) || status === "ended",
    todayStatus,
    isTodayCancelled: Boolean(
      todayStatus === "cancelled_today" ||
        todayStatus === "today_cancelled" ||
      raw.isTodayCancelled ||
        raw.cancelledToday ||
        raw.todayCancelled ||
        todayCancellation?.isCancelled
    ),
    todayCancellationReason:
      raw.todayCancellationReason ||
      raw.cancellationReason ||
      todayCancellation?.reason ||
      "",
    priceInPaise:
      raw.priceInPaise ??
      raw.price_in_paise ??
      raw.adminPriceInPaise ??
      raw.adminSetPriceInPaise ??
      null,
    trainerSharePercentage:
      raw.trainerSharePercentage ??
      raw.trainerSharePercent ??
      raw.trainer_share_percentage ??
      raw.commissionPercent ??
      null,
    trainerId: raw.trainerId || "",
    trainerName: raw.trainerName || "",
    trainerEmail: raw.trainerEmail || "",
    createdAt: raw.createdAt || "",
    updatedAt: raw.updatedAt || "",
    totalHours: raw.totalHours !== undefined && raw.totalHours !== null ? Number(raw.totalHours) : (raw.total_hours !== undefined && raw.total_hours !== null ? Number(raw.total_hours) : null),
    totalDays: raw.totalDays !== undefined && raw.totalDays !== null ? Number(raw.totalDays) : (raw.total_days !== undefined && raw.total_days !== null ? Number(raw.total_days) : null),
    completedHours: raw.completedHours !== undefined && raw.completedHours !== null ? Number(raw.completedHours) : (raw.completed_hours !== undefined && raw.completed_hours !== null ? Number(raw.completed_hours) : 0),
    completedDays: raw.completedDays !== undefined && raw.completedDays !== null ? Number(raw.completedDays) : (raw.completed_days !== undefined && raw.completed_days !== null ? Number(raw.completed_days) : 0),
    raw,
  };
}

function normalizeSessionPayload(payload) {
  const courseId = String(payload.courseId || "").trim();
  const courseTitle = String(payload.courseTitle || "").trim();
  const category = String(payload.category || "").trim();

  const WEEKDAY_MAP = { sunday: 0, sun: 0, monday: 1, mon: 1, tuesday: 2, tue: 2, wednesday: 3, wed: 3, thursday: 4, thu: 4, friday: 5, fri: 5, saturday: 6, sat: 6 };
  
  let rawDays = payload.recurringDays;
  if (typeof rawDays === 'string') {
    try {
      rawDays = JSON.parse(rawDays);
    } catch {
      rawDays = rawDays.split(',').map(s => s.trim());
    }
  }
  const selectedDays = Array.isArray(rawDays) ? rawDays : [];

  const formattedRecurringDays = selectedDays.map(day => {
    const val = String(day).trim().toLowerCase();
    return WEEKDAY_MAP[val] ?? Number(val);
  }).filter(n => !isNaN(n) && n >= 0 && n <= 6);

  const data = {
    title: String(payload.title || "").trim(),
    subtitle: String(payload.subtitle || "").trim(),
    description: String(payload.description || "").trim(),
    startTime: payload.startTime,
    endTime: payload.endTime,
    timezone: payload.timezone || "Asia/Kolkata",
    meetingLink: String(payload.meetingLink || "").trim(),
    isRecurring: payload.isRecurring !== false,
    recurrenceType: payload.recurrenceType || "daily",
    trainerInstructions: String(payload.trainerInstructions || "").trim(),
    recurringDays: formattedRecurringDays.length > 0 ? JSON.stringify(formattedRecurringDays) : null,
    recurrenceEndDate: payload.recurrenceEndDate || null,
    enableWhatsApp: payload.enableWhatsApp !== false,
    whatsappTemplateName: String(payload.whatsappTemplateName || "").trim() || null,
    whatsappCustomTitle: String(payload.whatsappCustomTitle || "").trim() || null,
    whatsappButtonUrl: String(payload.whatsappButtonUrl || "").trim() || null,
    totalHours: payload.totalHours !== "" && payload.totalHours !== undefined && payload.totalHours !== null ? Number(payload.totalHours) : null,
    totalDays: payload.totalDays !== "" && payload.totalDays !== undefined && payload.totalDays !== null ? Number(payload.totalDays) : null,
  };

  if (courseId) {
    data.courseId = courseId;
  } else {
    data.courseTitle = courseTitle;
    if (category) data.category = category;
  }

  if (!payload.thumbnailFile) return data;

  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((v) => formData.append(key, v));
    } else {
      formData.append(key, value);
    }
  });
  formData.append("thumbnail", payload.thumbnailFile);
  return formData;
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function normalizeSessionEarning(dto) {
  const raw = dto || {};
  const session = raw.session || raw.liveSession || {};
  return {
    sessionId: String(raw.sessionId || raw.id || session.id || session._id || ""),
    sessionTitle: raw.sessionTitle || raw.title || session.title || session.classTitle || "Live session",
    adminSetPrice: toNumber(raw.adminSetPrice ?? raw.sessionPrice ?? raw.price),
    paidStudents: toNumber(raw.paidStudents ?? raw.paidStudentCount ?? raw.studentsPaid),
    grossRevenue: toNumber(raw.grossRevenue ?? raw.totalRevenue),
    trainerSharePercent: toNumber(raw.trainerSharePercent ?? raw.commissionPercent ?? raw.sharePercent),
    trainerEarning: toNumber(raw.trainerEarning ?? raw.trainerAmount ?? raw.earningAmount),
    status: String(raw.status || raw.payoutStatus || "pending").toLowerCase(),
    raw,
  };
}

function normalizeEarnings(payload) {
  const source = payload?.data || payload || {};
  const summary = source.summary || source.totals || source;
  const rawSessions =
    source.sessions ||
    source.sessionEarnings ||
    source.earnings ||
    source.items ||
    [];

  return {
    totalEarnings: toNumber(summary.totalEarnings ?? summary.total ?? summary.trainerEarnings),
    pendingEarnings: toNumber(summary.pendingEarnings ?? summary.pending),
    payableEarnings: toNumber(summary.payableEarnings ?? summary.payable),
    paidEarnings: toNumber(summary.paidEarnings ?? summary.paid),
    sessionEarnings: Array.isArray(rawSessions)
      ? rawSessions.map(normalizeSessionEarning)
      : [],
    raw: source,
  };
}

function normalizePayout(dto) {
  const raw = dto || {};
  return {
    id: String(raw.id || raw._id || raw.payoutId || ""),
    amount: toNumber(raw.amount ?? raw.payoutAmount),
    status: String(raw.status || raw.payoutStatus || "pending").toLowerCase(),
    requestedAt: raw.requestedAt || raw.createdAt || "",
    paidAt: raw.paidAt || raw.completedAt || "",
    reference: raw.reference || raw.transactionId || raw.utr || "",
    raw,
  };
}

export async function getTrainerCourses() {
  try {
    const res = await axiosClient.get("/api/trainer/courses");
    const payload = unwrap(res);
    const courses = Array.isArray(payload.data) ? payload.data : [];
    const normalizedCourses = courses.map(normalizeCourse).filter((course) => course.id);
    return normalizedCourses.length
      ? normalizedCourses
      : FALLBACK_TRAINER_COURSES.map(normalizeCourse);
  } catch (err) {
    if (getAxiosErrorStatus(err) === 404) {
      return FALLBACK_TRAINER_COURSES.map(normalizeCourse);
    }
    throw new Error(getTrainerSessionError(err, "Unable to load trainer courses."));
  }
}

export async function getTrainerSessions() {
  try {
    let res;
    try {
      res = await axiosClient.get("/api/trainer/my-sessions");
    } catch (err) {
      if (getAxiosErrorStatus(err) !== 404) throw err;
      res = await axiosClient.get("/api/trainer/sessions");
    }
    const payload = unwrap(res);
    const sessions = Array.isArray(payload.data) ? payload.data : [];
    return sessions.map(normalizeSession).filter((session) => session.id);
  } catch (err) {
    throw new Error(getTrainerSessionError(err, "Unable to load recurring live sessions."));
  }
}

export async function getTrainerSession(sessionId) {
  try {
    const res = await axiosClient.get(`/api/trainer/sessions/${encodeURIComponent(sessionId)}`);
    const payload = unwrap(res);
    return normalizeSession(payload.data);
  } catch (err) {
    throw new Error(getTrainerSessionError(err, "Unable to load session details."));
  }
}

export async function getTrainerStatus() {
  try {
    const res = await axiosClient.get("/api/trainer/status");
    const payload = unwrap(res);
    return { isActive: normalizeActiveStatus(payload) };
  } catch (err) {
    const status = getAxiosErrorStatus(err);
    if ([404, 405].includes(status)) {
      return { isActive: true, isStatusEndpointMissing: true };
    }
    if (status === 403) {
      return {
        isActive: false,
        isStatusForbidden: true,
        message: getAxiosErrorMessage(
          err,
          "Your trainer account is not active yet. Class management is restricted."
        ),
      };
    }
    throw new Error(getAxiosErrorMessage(err, "Unable to verify trainer account status."));
  }
}

export async function createTrainerSession(payload) {
  try {
    const res = await axiosClient.post(
      "/api/trainer/sessions",
      normalizeSessionPayload(payload)
    );
    const responsePayload = unwrap(res);
    return normalizeSession(responsePayload.data);
  } catch (err) {
    const backendMessage = getAxiosErrorMessage(err, "");
    if (getAxiosErrorStatus(err) === 400 && backendMessage) {
      throw new Error(backendMessage);
    }
    throw new Error(
      getTrainerSessionError(err, "Unable to create recurring live session.", {
        preferBackendForbiddenMessage: true,
      })
    );
  }
}

export async function updateTrainerSession(sessionId, payload) {
  try {
    const res = await axiosClient.patch(
      `/api/trainer/sessions/${encodeURIComponent(sessionId)}`,
      normalizeSessionPayload(payload)
    );
    const responsePayload = unwrap(res);
    return normalizeSession(responsePayload.data);
  } catch (err) {
    throw new Error(getTrainerSessionError(err, "Unable to update recurring live session."));
  }
}

export async function pauseTrainerSession(sessionId) {
  try {
    const res = await axiosClient.post(
      `/api/trainer/sessions/${encodeURIComponent(sessionId)}/pause`
    );
    const payload = unwrap(res);
    return normalizeSession(payload.data);
  } catch (err) {
    throw new Error(getTrainerSessionError(err, "Unable to pause recurring live session."));
  }
}

export async function resumeTrainerSession(sessionId) {
  try {
    const res = await axiosClient.post(
      `/api/trainer/sessions/${encodeURIComponent(sessionId)}/resume`
    );
    const payload = unwrap(res);
    return normalizeSession(payload.data);
  } catch (err) {
    throw new Error(getTrainerSessionError(err, "Unable to resume recurring live session."));
  }
}

export async function endTrainerSession(sessionId) {
  try {
    const res = await axiosClient.post(
      `/api/trainer/sessions/${encodeURIComponent(sessionId)}/end`
    );
    const payload = unwrap(res);
    return normalizeSession(payload.data);
  } catch (err) {
    throw new Error(getTrainerSessionError(err, "Unable to end recurring live session."));
  }
}

export async function deleteTrainerSession(sessionId) {
  try {
    const res = await axiosClient.delete(
      `/api/trainer/sessions/${encodeURIComponent(sessionId)}`
    );
    unwrap(res);
    return true;
  } catch (err) {
    throw new Error(getTrainerSessionError(err, "Unable to delete recurring live session."));
  }
}

export async function cancelTodayTrainerSession(sessionId, reason) {
  try {
    const res = await axiosClient.post(
      `/api/trainer/sessions/${encodeURIComponent(sessionId)}/cancel-today`,
      { reason }
    );
    const payload = unwrap(res);
    return normalizeSession(payload.data);
  } catch (err) {
    throw new Error(getTrainerSessionError(err, "Unable to cancel today's class."));
  }
}

export async function restoreTodayTrainerSession(sessionId) {
  try {
    const res = await axiosClient.delete(
      `/api/trainer/sessions/${encodeURIComponent(sessionId)}/cancel-today`
    );
    const payload = unwrap(res);
    return payload.data ? normalizeSession(payload.data) : true;
  } catch (err) {
    throw new Error(getTrainerSessionError(err, "Unable to restore today's class."));
  }
}

export async function getTrainerEarnings() {
  try {
    const res = await axiosClient.get("/api/trainer/earnings");
    const payload = unwrap(res);
    return normalizeEarnings(payload);
  } catch (err) {
    throw new Error(getAxiosErrorMessage(err, "Unable to load trainer earnings."));
  }
}

export async function getTrainerSessionEarnings(sessionId) {
  try {
    const res = await axiosClient.get(
      `/api/trainer/sessions/${encodeURIComponent(sessionId)}/earnings`
    );
    const payload = unwrap(res);
    return normalizeSessionEarning(payload.data);
  } catch (err) {
    throw new Error(getAxiosErrorMessage(err, "Unable to load session earnings."));
  }
}

export async function getTrainerPayouts() {
  try {
    const res = await axiosClient.get("/api/trainer/payouts");
    const payload = unwrap(res);
    const payouts = Array.isArray(payload.data)
      ? payload.data
      : payload.data?.payouts || payload.payouts || [];
    return Array.isArray(payouts) ? payouts.map(normalizePayout) : [];
  } catch (err) {
    throw new Error(getAxiosErrorMessage(err, "Unable to load trainer payouts."));
  }
}
