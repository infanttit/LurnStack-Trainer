import { axiosClient } from "../../../shared/api/axiosClient";
import { getAxiosErrorMessage, getAxiosErrorStatus } from "../../../shared/api/axiosError";

function unwrap(res) {
  const data = res?.data;
  if (!data?.success) throw new Error(data?.message || "Request failed");
  return data;
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function toPercent(value) {
  return Math.max(0, Math.min(100, toNumber(value)));
}

function attendanceError(err, fallback) {
  const status = getAxiosErrorStatus(err);
  if (status === 401) return "Please log in as a trainer to view attendance.";
  if (status === 403) return "You can view attendance only for sessions created by you.";
  if (status === 404) return "Attendance is not available for this session yet.";
  if (status >= 500) return "Attendance service is unavailable. Please try again later.";
  return getAxiosErrorMessage(err, fallback);
}

function normalizeStudent(dto) {
  const raw = dto || {};
  return {
    studentId: String(raw.studentId || raw.id || raw._id || raw.userId || ""),
    fullName: raw.fullName || raw.name || raw.studentName || "Student",
    email: raw.email || raw.emailAddress || raw.EMAIL_ADDRESS || "",
    status: String(raw.status || raw.attendanceStatus || "absent").toLowerCase(),
    firstJoinedAt: raw.firstJoinedAt || raw.first_joined_at || "",
    lastJoinedAt: raw.lastJoinedAt || raw.last_joined_at || "",
    joinCount: toNumber(raw.joinCount ?? raw.joins),
    raw,
  };
}

function normalizeSessionAttendance(payload) {
  const source = payload?.data || payload || {};
  const presentCount = toNumber(source.presentCount);
  const lateCount = toNumber(source.lateCount);
  const absentCount = toNumber(source.absentCount);

  return {
    sessionId: String(source.sessionId || source.id || source._id || ""),
    sessionTitle: source.sessionTitle || source.title || source.classTitle || "Session attendance",
    totalStudents: toNumber(source.totalStudents),
    presentCount,
    lateCount,
    absentCount,
    attendedCount: toNumber(source.attendedCount ?? presentCount + lateCount),
    attendancePercentage: toPercent(source.attendancePercentage ?? source.attendancePercent),
    students: Array.isArray(source.students) ? source.students.map(normalizeStudent) : [],
    raw: source,
  };
}

function normalizeTrainerSession(dto) {
  const raw = dto || {};
  return {
    id: String(raw.id || raw._id || raw.sessionId || ""),
    title: raw.title || raw.sessionTitle || raw.classTitle || "Session",
    courseTitle: raw.courseTitle || raw.course?.title || raw.courseName || "Course",
    scheduledAt: raw.scheduledAt || raw.startsAt || raw.startTime || raw.createdAt || "",
    raw,
  };
}

export async function getTrainerAttendanceSessions() {
  try {
    const res = await axiosClient.get("/api/trainer/sessions");
    const payload = unwrap(res);
    const sessions = Array.isArray(payload.data) ? payload.data : [];
    return sessions.map(normalizeTrainerSession).filter((session) => session.id);
  } catch (err) {
    throw new Error(attendanceError(err, "Unable to load trainer sessions."));
  }
}

export async function getTrainerSessionAttendance(sessionId) {
  try {
    const res = await axiosClient.get(
      `/api/trainer/sessions/${encodeURIComponent(sessionId)}/attendance`
    );
    return normalizeSessionAttendance(unwrap(res));
  } catch (err) {
    throw new Error(attendanceError(err, "Unable to load session attendance."));
  }
}
