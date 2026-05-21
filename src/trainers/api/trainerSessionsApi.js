import { axiosClient } from "../../shared/api/axiosClient";
import { getAxiosErrorMessage, getAxiosErrorStatus } from "../../shared/api/axiosError";
import { env } from "../../shared/config/env";

function getTrainerSessionError(err, fallback, { preferBackendForbiddenMessage = false } = {}) {
  const status = getAxiosErrorStatus(err);
  if (status === 401) return "Please log in as a trainer to continue.";
  if (status === 403) {
    return preferBackendForbiddenMessage
      ? getAxiosErrorMessage(err, "Action restricted. Inactive trainers cannot create classes.")
      : "Action restricted. Your trainer account is inactive.";
  }
  if (status === 404) return "The live class could not be found.";
  if (status >= 500) return "Trainer session service is unavailable. Please try again later.";
  return getAxiosErrorMessage(err, fallback);
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
  const cancellationReason =
    raw.cancellationReason ||
    raw.cancelReason ||
    raw.cancelledReason ||
    raw.cancelled_reason ||
    raw.reason ||
    "";
  const scheduledAt = toKolkataIso(raw.scheduledDate, raw.startTime) || raw.scheduledAt || "";
  const endsAt = toKolkataIso(raw.scheduledDate, raw.endTime) || raw.endsAt || "";
  const durationMinutes =
    getDurationMinutes(raw.startTime, raw.endTime) ||
    getDurationMinutesFromIso(scheduledAt, endsAt) ||
    Number(raw.durationMinutes) ||
    60;

  return {
    id: raw.id,
    courseId: raw.id,
    courseName: raw.courseTitle || "",
    courseTitle: raw.courseTitle || "",
    tab: raw.category || "Trainer Courses",
    category: raw.category || "Trainer Courses",
    title: raw.classTitle || "",
    classTitle: raw.classTitle || "",
    instructorName: raw.trainerName || "Trainer",
    description: raw.description || "",
    scheduledDate: raw.scheduledDate || "",
    startTime: raw.startTime || "",
    endTime: raw.endTime || "",
    scheduledAt,
    endsAt,
    durationMinutes,
    meetUrl: raw.meetingLink || "",
    meetingLink: raw.meetingLink || "",
    thumbnail: toAbsoluteAssetUrl(raw.thumbnail),
    trainerId: raw.trainerId || "",
    trainerName: raw.trainerName || "",
    trainerEmail: raw.trainerEmail || "",
    status: raw.status || "draft",
    cancellationReason,
    createdAt: raw.createdAt || "",
    updatedAt: raw.updatedAt || "",
    raw,
  };
}

function getDurationMinutes(startTime, endTime) {
  const [startHour, startMinute] = String(startTime || "").split(":").map(Number);
  const [endHour, endMinute] = String(endTime || "").split(":").map(Number);
  if (![startHour, startMinute, endHour, endMinute].every(Number.isFinite)) return 0;
  const startTotal = startHour * 60 + startMinute;
  const endTotal = endHour * 60 + endMinute;
  return endTotal > startTotal ? endTotal - startTotal : 0;
}

function toKolkataIso(date, time) {
  const d = String(date || "").trim();
  const t = String(time || "").trim();
  if (d.includes("T")) return d;
  if (!d || !/^\d{2}:\d{2}$/.test(t)) return "";
  return `${d}T${t}:00+05:30`;
}

function getDurationMinutesFromIso(startIso, endIso) {
  const startMs = new Date(startIso || "").getTime();
  const endMs = new Date(endIso || "").getTime();
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) return 0;
  return Math.round((endMs - startMs) / 60000);
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

export async function getTrainerSessions() {
  try {
    const res = await axiosClient.get("/api/trainer/sessions");
    const payload = unwrap(res);
    const sessions = Array.isArray(payload.data) ? payload.data : [];
    return sessions.map(normalizeSession);
  } catch (err) {
    throw new Error(getTrainerSessionError(err, "Unable to load trainer live classes."));
  }
}

export async function getTrainerStatus() {
  try {
    const res = await axiosClient.get("/api/trainer/status");
    const payload = unwrap(res);
    return { isActive: normalizeActiveStatus(payload) };
  } catch (err) {
    throw new Error(getAxiosErrorMessage(err, "Unable to verify trainer account status."));
  }
}

export async function createTrainerSession({
  courseTitle,
  category,
  description,
  classTitle,
  scheduledDate,
  startTime,
  endTime,
  meetingLink,
  thumbnailFile,
}) {
  try {
    const formData = new FormData();
    formData.append("courseTitle", courseTitle);
    formData.append("category", category);
    formData.append("description", description);
    formData.append("classTitle", classTitle);
    formData.append("scheduledDate", scheduledDate);
    formData.append("startTime", startTime);
    formData.append("endTime", endTime);
    formData.append("meetingLink", meetingLink);
    if (thumbnailFile) formData.append("thumbnail", thumbnailFile);

    const res = await axiosClient.post("/api/trainer/sessions", formData);
    const payload = unwrap(res);
    return normalizeSession(payload.data);
  } catch (err) {
    throw new Error(
      getTrainerSessionError(err, "Unable to create live class.", {
        preferBackendForbiddenMessage: true,
      })
    );
  }
}

export async function updateTrainerSession(
  sessionId,
  {
    courseTitle,
    category,
    description,
    classTitle,
    scheduledDate,
    startTime,
    endTime,
    meetingLink,
    thumbnailFile,
  }
) {
  try {
    const formData = new FormData();
    formData.append("courseTitle", courseTitle);
    formData.append("category", category);
    formData.append("description", description);
    formData.append("classTitle", classTitle);
    formData.append("scheduledDate", scheduledDate);
    formData.append("startTime", startTime);
    formData.append("endTime", endTime);
    formData.append("meetingLink", meetingLink);
    if (thumbnailFile) formData.append("thumbnail", thumbnailFile);

    const res = await axiosClient.patch(
      `/api/trainer/sessions/${encodeURIComponent(sessionId)}`,
      formData
    );
    const responsePayload = unwrap(res);
    return normalizeSession(responsePayload.data);
  } catch (err) {
    throw new Error(getTrainerSessionError(err, "Unable to update live class."));
  }
}

export async function publishTrainerSession(sessionId) {
  try {
    const res = await axiosClient.patch(
      `/api/trainer/sessions/${encodeURIComponent(sessionId)}/publish`
    );
    const payload = unwrap(res);
    return normalizeSession(payload.data);
  } catch (err) {
    throw new Error(getTrainerSessionError(err, "Unable to publish live class."));
  }
}

export async function cancelTrainerSession(sessionId, reason) {
  try {
    const res = await axiosClient.patch(
      `/api/trainer/sessions/${encodeURIComponent(sessionId)}/cancel`,
      { reason }
    );
    const payload = unwrap(res);
    return normalizeSession(payload.data);
  } catch (err) {
    throw new Error(getTrainerSessionError(err, "Unable to cancel live class."));
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
    throw new Error(getTrainerSessionError(err, "Unable to delete live class."));
  }
}
