import { axiosClient } from "../../shared/api/axiosClient";
import { getAxiosErrorMessage, getAxiosErrorStatus } from "../../shared/api/axiosError";

const AUTH_ERROR_FALLBACK = "Unable to complete the request. Please try again.";

function toApiRole(role) {
  const normalized = String(role || "student").trim().toUpperCase();
  return normalized === "TRAINER" ? "TRAINER" : "STUDENT";
}

function unwrap(res) {
  const data = res?.data;
  if (!data?.success) {
    throw new Error(data?.message || "Request failed");
  }
  return data;
}

function getSafeAuthErrorMessage(err, fallback = AUTH_ERROR_FALLBACK) {
  const status = getAxiosErrorStatus(err);
  if (status === 400 || status === 409 || status === 422) {
    return getAxiosErrorMessage(err, fallback);
  }
  if (status === 401 || status === 403) return "Invalid email or password.";
  if (status >= 500) return "Authentication service is unavailable. Please try again later.";
  return getAxiosErrorMessage(err, fallback);
}

export async function registerApi({ fullName, email, phoneNumber, password, role = "student" }) {
  try {
    const apiRole = toApiRole(role);
    const payload = {
      FULL_NAME: fullName,
      EMAIL_ADDRESS: email,
      PHONE_NUMBER: phoneNumber,
      PASSWORD: password,
    };

    if (apiRole === "TRAINER") {
      payload.role = apiRole;
    }

    const res = await axiosClient.post("/api/auth/register", payload);
    const data = unwrap(res);
    return {
      user: data.user,
      token: data.token || null,
      message: data.message,
    };
  } catch (err) {
    throw new Error(getSafeAuthErrorMessage(err, "Unable to register. Please try again."));
  }
}

export async function loginApi({ email, password }) {
  try {
    const res = await axiosClient.post("/api/auth/login", {
      EMAIL_ADDRESS: email,
      PASSWORD: password,
    });
    const data = unwrap(res);
    return {
      user: data.user,
      token: data.token,
      message: data.message,
    };
  } catch (err) {
    throw new Error(getSafeAuthErrorMessage(err, "Unable to log in. Please try again."));
  }
}

function normalizeProfile(raw) {
  const source = raw?.data || raw?.user || raw?.profile || raw || {};
  return {
    id: source.id || source.userId || source.USER_ID || "",
    fullName: source.fullName || source.FULL_NAME || source.name || source.NAME || "",
    email: source.email || source.EMAIL_ADDRESS || source.emailAddress || "",
    phoneNumber: source.phoneNumber || source.PHONE_NUMBER || source.mobile || source.phone || "",
    role: String(source.role || source.ROLE || "student").toLowerCase(),
    createdAt: source.createdAt || source.created_at || source.CREATED_AT || "",
    updatedAt: source.updatedAt || source.updated_at || source.UPDATED_AT || "",
  };
}

export async function getAuthProfileApi() {
  const endpoints = ["/api/auth/me", "/api/auth/profile", "/api/user/profile", "/api/users/me"];
  let lastError = null;

  for (const endpoint of endpoints) {
    try {
      const res = await axiosClient.get(endpoint);
      const data = unwrap(res);
      return normalizeProfile(data);
    } catch (err) {
      const status = getAxiosErrorStatus(err);
      if (status === 404 || status === 405) {
        lastError = err;
        continue;
      }
      throw new Error(getAxiosErrorMessage(err, "Unable to fetch profile details."));
    }
  }

  throw new Error(getAxiosErrorMessage(lastError, "Profile endpoint is not available yet."));
}
