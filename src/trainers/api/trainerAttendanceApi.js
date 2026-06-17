import { axiosClient } from "../../shared/api/axiosClient";
import { getAxiosErrorMessage, getAxiosErrorStatus } from "../../shared/api/axiosError";

function unwrap(res) {
  const data = res?.data;
  if (!data?.success) throw new Error(data?.message || "Request failed");
  return data;
}

// Cache-busting via _t query param only — no Cache-Control/Pragma headers (CORS-safe).
function getFreshRequestConfig() {
  return {
    params: { _t: Date.now() },
  };
}

function toNumber(value) {
  if (typeof value === "string") {
    const match = value.match(/[\d.]+/);
    if (match) {
      const number = Number(match[0]);
      return Number.isFinite(number) ? number : 0;
    }
  }
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function toPercent(value) {
  return Math.max(0, Math.min(100, toNumber(value)));
}

function firstValue(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== "") || "";
}

const PRESENT_THRESHOLD_SECONDS = 600; // 10 minutes

function getRecordDurationSeconds(record, sessionEndedAt = "", isSessionEnded = false) {
  const raw = record || {};

  const joinedAt = firstValue(raw.firstJoinedAt, raw.joinedAt, raw.startTime, raw.joined_at, raw.joinTime);
  const explicitLeftAt = firstValue(raw.lastJoinedAt, raw.last_joined_at, raw.leftAt, raw.left_at, raw.leaveTime);
  const isAggregate = toNumber(raw.joinCount ?? raw.joins) > 1;

  // 1. If this is a SINGLE join session (not an aggregate of multiple joins with a gap), 
  // calculate the exact duration between join and leave times.
  if (!isAggregate && joinedAt && explicitLeftAt && explicitLeftAt !== joinedAt) {
    const start = new Date(joinedAt);
    const end = new Date(explicitLeftAt);
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end > start) {
      return Math.max(0, Math.round((end.getTime() - start.getTime()) / 1000));
    }
  }

  // 2. Fall back to backend-provided duration.
  // (Crucial for aggregate records where the student joined multiple times and we don't have the individual session logs).
  const seconds = toNumber(
    firstValue(raw.durationSeconds, raw.totalDurationSeconds, raw.attendanceDurationSeconds)
  );
  if (seconds > 0) return seconds;

  // We explicitly check raw.duration assuming it represents minutes in most cases if not specified
  const minutes = toNumber(
    firstValue(raw.durationMinutes, raw.totalDurationMinutes, raw.attendanceDurationMinutes, raw.duration)
  );
  if (minutes > 0) return minutes * 60;

  // 3. Fall back to session end time for ongoing single sessions
  let leftAt = explicitLeftAt;
  
  if (!leftAt) {
    leftAt = isSessionEnded ? sessionEndedAt : new Date().toISOString();
  }

  if (joinedAt && leftAt) {
    const start = new Date(joinedAt);
    const end = new Date(leftAt);
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end > start) {
      return Math.max(0, Math.round((end.getTime() - start.getTime()) / 1000));
    }
  }

  return 0;
}

function getTotalDurationSeconds(raw, sessionEndedAt = "", isSessionEnded = false) {
  const records = firstValue(
    raw.attendanceRecords,
    raw.attendanceEntries,
    raw.joinRecords,
    raw.joinEvents,
    raw.sessions,
    Array.isArray(raw.joins) ? raw.joins : null
  );

  if (Array.isArray(records) && records.length) {
    const recordsDuration = records.reduce(
      (total, record) => total + getRecordDurationSeconds(record, sessionEndedAt, isSessionEnded),
      0
    );
    if (recordsDuration > 0) return recordsDuration;
  }

  return getRecordDurationSeconds(raw, sessionEndedAt, isSessionEnded);
}

function attendanceError(err, fallback) {
  const status = getAxiosErrorStatus(err);
  if (status === 401) return "Please log in as a trainer to view attendance.";
  if (status === 403) return "You can view attendance only for sessions created by you.";
  if (status === 404) return "Attendance is not available for this session yet.";
  if (status >= 500) return "Attendance service is unavailable. Please try again later.";
  return getAxiosErrorMessage(err, fallback);
}

function normalizeStudent(dto, sessionEndedAt = "", isSessionEnded = false) {
  const raw = dto || {};
  const records = firstValue(
    raw.attendanceRecords,
    raw.attendanceEntries,
    raw.joinRecords,
    raw.joinEvents,
    raw.sessions,
    Array.isArray(raw.joins) ? raw.joins : null
  );
  const totalDurationSeconds = getTotalDurationSeconds(raw, sessionEndedAt, isSessionEnded);
  const backendStatus = String(firstValue(raw.status, raw.attendanceStatus, raw.sessionStatus)).toLowerCase();
  const hasJoinEvidence = Boolean(
    firstValue(raw.firstJoinedAt, raw.joinedAt, raw.startTime, raw.joined_at) ||
    toNumber(raw.joinCount ?? raw.joins) > 0 ||
    (Array.isArray(records) && records.length > 0)
  );

  let status = "absent";
  if (totalDurationSeconds >= PRESENT_THRESHOLD_SECONDS) {
    status = "present";
  } else if (totalDurationSeconds > 0 && totalDurationSeconds < PRESENT_THRESHOLD_SECONDS) {
    status = "absent";
  } else if (backendStatus === "tracking" || backendStatus === "pending") {
    status = backendStatus;
  } else if (backendStatus === "rescheduled") {
    status = "rescheduled";
  } else if (["present", "joined", "attended", "late"].includes(backendStatus)) {
    status = "present";
  } else {
    status = "absent";
  }

  const joinTime = firstValue(raw.joinTime, raw.join_time, raw.firstJoinedAt, raw.first_joined_at, raw.joinedAt, raw.joined_at, raw.startTime) || "";
  const explicitLeave = raw.leaveTime ?? raw.leave_time ?? raw.lastJoinedAt ?? raw.last_joined_at ?? raw.leftAt ?? raw.clientLeftAt ?? null;
  const isLeaveTimeNull = raw.leaveTime === null || raw.leave_time === null || raw.leftAt === null;

  return {
    studentId: String(raw.studentId || raw.id || raw._id || raw.userId || ""),
    fullName: raw.fullName || raw.name || raw.studentName || "Student",
    email: raw.email || raw.emailAddress || raw.EMAIL_ADDRESS || "",
    status,
    joinTime,
    leaveTime: explicitLeave,
    isLeaveTimeNull,
    joinCount: toNumber(raw.joinCount ?? raw.joins) || (Array.isArray(records) ? records.length : 0),
    durationMinutes: Math.floor(totalDurationSeconds / 60),
    durationSeconds: totalDurationSeconds,
    // Flag whether duration was estimated (sessionEndedAt used as fallback)
    durationEstimated: totalDurationSeconds > 0 && !firstValue(raw.durationSeconds, raw.durationMinutes) && (!explicitLeave || explicitLeave === joinTime),
    raw,
  };
}

function normalizeSessionAttendance(payload) {
  const source = payload?.data || payload || {};

  // 🔍 DEV DEBUG — remove once duration field names are confirmed
  if (process.env.NODE_ENV === "development") {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem("lurnstack:debug:attendance", JSON.stringify(payload));
        fetch("/api/debug-log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }).catch(() => {});
      }
    } catch (e) { }
    console.group("[LurnStack] 📋 Raw attendance response from backend");
    console.log("Session endedAt:", source.endedAt, "| endsAt:", source.endsAt, "| endTime:", source.endTime, "| completedAt:", source.completedAt);
    if (Array.isArray(source.students)) {
      source.students.forEach((s, i) => {
        console.log(
          `[${i}] ${s.fullName || s.name}` +
          ` | durationSeconds=${s.durationSeconds ?? "—"}` +
          ` | durationMinutes=${s.durationMinutes ?? "—"}` +
          ` | totalDurationSeconds=${s.totalDurationSeconds ?? "—"}` +
          ` | firstJoinedAt=${s.firstJoinedAt ?? "—"}` +
          ` | lastJoinedAt=${s.lastJoinedAt ?? "—"}` +
          ` | leftAt=${s.leftAt ?? "—"}` +
          ` | joinCount=${s.joinCount ?? "—"}` +
          ` | joins=${s.joins ?? "—"}`
        );
      });
    }
    console.groupEnd();
  }


  // Use session end time so student duration can be estimated when leftAt is missing
  // If no end time is provided by the backend, assume the session is ongoing and calculate up to NOW.
  const explicitSessionEndedAt = firstValue(
    source.endedAt,
    source.endsAt,
    source.endTime,
    source.completedAt
  );
  const isSessionEnded = Boolean(explicitSessionEndedAt);
  const sessionEndedAt = explicitSessionEndedAt || new Date().toISOString(); // ← Fallback to current time if ongoing

  const sourceRows = firstValue(
    source.history,
    source.students,
    source.attendance,
    source.records,
    source.rows,
    source.classes,
    source.sessions
  );

  const studentGroups = new Map();
  if (Array.isArray(sourceRows)) {
    sourceRows.forEach(row => {
      // Filter out trainers
      if (String(row.role).toLowerCase() === "trainer" || String(row.isTrainer) === "true") return;

      const id = String(row.studentId || row.id || row._id || row.userId || row.email || row.emailAddress || row.fullName || "unknown");
      if (!id || id === "unknown") return;

      if (!studentGroups.has(id)) {
        studentGroups.set(id, { ...row, joins: [row] });
      } else {
        const existing = studentGroups.get(id);
        existing.joins.push(row);
        
        // Update earliest join time
        const rJoin = firstValue(row.joinTime, row.join_time, row.firstJoinedAt, row.first_joined_at, row.joinedAt, row.joined_at, row.startTime);
        const eJoin = firstValue(existing.joinTime, existing.join_time, existing.firstJoinedAt, existing.first_joined_at, existing.joinedAt, existing.joined_at, existing.startTime);
        if (rJoin && (!eJoin || new Date(rJoin) < new Date(eJoin))) {
          existing.joinTime = rJoin;
          existing.joinedAt = rJoin;
        }
        
        // Update latest leave time
        const rLeave = firstValue(row.leaveTime, row.leave_time, row.lastJoinedAt, row.last_joined_at, row.leftAt, row.left_at, row.clientLeftAt);
        const eLeave = firstValue(existing.leaveTime, existing.leave_time, existing.lastJoinedAt, existing.last_joined_at, existing.leftAt, existing.left_at, existing.clientLeftAt);
        if (rLeave && (!eLeave || new Date(rLeave) > new Date(eLeave))) {
          existing.leaveTime = rLeave;
          existing.leftAt = rLeave;
        }
      }
    });
  }
  const students = Array.from(studentGroups.values()).map((dto) => normalizeStudent(dto, sessionEndedAt, isSessionEnded));
  const totalStudents = toNumber(source.totalStudents) || students.length;
  const presentCount = students.filter((student) => student.status === "present").length;
  const absentCount = students.filter((student) => student.status === "absent").length;
  const activeCount = students.filter((student) => student.status === "tracking" || student.status === "pending").length;

  return {
    sessionId: String(source.sessionId || source.id || source._id || ""),
    sessionTitle: source.sessionTitle || source.title || source.classTitle || "Session attendance",
    sessionDate: firstValue(source.sessionDate, source.date, source.scheduledDate),
    scheduledAt: firstValue(source.scheduledAt, source.startsAt, source.startTime, source.startedAt),
    endedAt: firstValue(source.endedAt, source.endsAt, source.endTime, source.completedAt),
    status: String(firstValue(source.status, source.sessionStatus, source.attendanceStatus, "not finalized")).toLowerCase(),
    totalStudents,
    presentCount,
    absentCount,
    attendedCount: presentCount,
    attendancePercentage: totalStudents ? toPercent((presentCount / totalStudents) * 100) : 0,
    students,
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
    endedAt: raw.endedAt || raw.endsAt || raw.endTime || raw.completedAt || "",
    status: String(raw.status || raw.sessionStatus || "").toLowerCase(),
    raw,
  };
}

export async function getTrainerAttendanceSessions() {
  try {
    const res = await axiosClient.get("/api/trainer/sessions", getFreshRequestConfig());
    const payload = unwrap(res);
    const sessions = Array.isArray(payload.data) ? payload.data : [];
    return sessions.map(normalizeTrainerSession).filter((session) => session.id && session.status !== "rescheduled");
  } catch (err) {
    console.error("getTrainerAttendanceSessions", err);
    if (getAxiosErrorStatus(err) === 404) return [];
    throw new Error(attendanceError(err, "Unable to load trainer sessions."));
  }
}

export async function getTrainerSessionAttendance(sessionId, date) {
  try {
    const url = date 
      ? `/api/trainer/sessions/${encodeURIComponent(sessionId)}/attendance?date=${encodeURIComponent(date)}`
      : `/api/trainer/sessions/${encodeURIComponent(sessionId)}/attendance`;
      
    const res = await axiosClient.get(url, getFreshRequestConfig());
    const payload = unwrap(res);
    const data = payload?.data || payload;
    if (Array.isArray(data)) {
      return data.map(normalizeSessionAttendance);
    }
    return [normalizeSessionAttendance(payload)];
  } catch (err) {
    console.error("getTrainerSessionAttendance", err);
    throw new Error(attendanceError(err, "Unable to load session attendance."));
  }
}
