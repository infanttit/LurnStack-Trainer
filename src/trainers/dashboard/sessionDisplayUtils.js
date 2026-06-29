export function getDurationMinutes(startTime, endTime) {
  const [startHour, startMinute] = String(startTime || "").split(":").map(Number);
  const [endHour, endMinute] = String(endTime || "").split(":").map(Number);
  if (![startHour, startMinute, endHour, endMinute].every(Number.isFinite)) return 0;
  const startTotal = startHour * 60 + startMinute;
  const endTotal = endHour * 60 + endMinute;
  return endTotal > startTotal ? endTotal - startTotal : 0;
}

export function formatTime(time, timezone = "Asia/Kolkata") {
  if (!/^\d{2}:\d{2}$/.test(String(time || ""))) return "";
  const date = new Date(`2026-01-01T${time}:00+05:30`);
  return date.toLocaleTimeString("en-IN", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDailyWindow(session) {
  const start = formatTime(session?.startTime, session?.timezone);
  const end = formatTime(session?.endTime, session?.timezone);
  if (!start || !end) return "Time not set";
  return `Every day, ${start} to ${end}`;
}

export function getSessionStatus(session) {
  if (session?.isEnded || session?.status === "ended") return "ended";
  if (session?.isPaused || session?.status === "paused") return "paused";
  if (session?.isTodayCancelled) return "today cancelled";
  if (session?.todayStatus === "completed_today") return "today completed";
  if (session?.todayStatus === "live") return "live now";
  if (session?.todayStatus === "upcoming") return "upcoming today";
  return session?.status || "active";
}

export function getStatusClass(status) {
  if (status === "ended") return "bg-slate-100 text-slate-700 border-slate-200";
  if (status === "paused") return "bg-amber-50 text-amber-700 border-amber-100";
  if (status === "today cancelled") return "bg-red-50 text-red-700 border-red-100";
  if (status === "today completed") return "bg-slate-100 text-slate-700 border-slate-200";
  if (status === "live now") return "bg-blue-50 text-blue-700 border-blue-100";
  if (status === "upcoming today") return "bg-cyan-50 text-cyan-700 border-cyan-100";
  return "bg-emerald-50 text-emerald-700 border-emerald-100";
}

export function formatMoney(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

export function formatPriceInPaise(priceInPaise) {
  if (priceInPaise === null || priceInPaise === undefined || priceInPaise === "") return "";
  return formatMoney(Number(priceInPaise) / 100);
}

export function readImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function formatDurationHours(totalHours) {
  if (totalHours === null || totalHours === undefined || totalHours === "") return "";
  const totalHoursNum = Number(totalHours);
  if (isNaN(totalHoursNum) || totalHoursNum <= 0) return "";
  const hours = Math.floor(totalHoursNum);
  const minutes = Math.round((totalHoursNum - hours) * 60);
  if (hours > 0 && minutes > 0) {
    return `${hours} hr${hours > 1 ? "s" : ""} ${minutes} min${minutes > 1 ? "s" : ""}`;
  } else if (hours > 0) {
    return `${hours} hr${hours > 1 ? "s" : ""}`;
  } else if (minutes > 0) {
    return `${minutes} min${minutes > 1 ? "s" : ""}`;
  }
  return "";
}
