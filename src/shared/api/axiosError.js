export function getAxiosErrorMessage(err, fallback = "Something went wrong") {
  const data = err?.response?.data;

  if (typeof data === "string" && data.trim()) return data.trim();
  if (data && typeof data === "object") {
    if (typeof data.message === "string" && data.message.trim()) return data.message.trim();
    if (typeof data.error === "string" && data.error.trim()) return data.error.trim();
  }

  if (typeof err?.message === "string" && err.message.trim()) return err.message.trim();

  if (err?.code === "ECONNABORTED") return "Request timed out. Please try again.";
  if (err?.request && !err?.response) return "Network error. Please check your connection.";

  return fallback;
}

export function getAxiosErrorStatus(err) {
  const status = err?.response?.status;
  return typeof status === "number" ? status : 0;
}

