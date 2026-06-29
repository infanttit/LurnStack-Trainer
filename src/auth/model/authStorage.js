import { getAuthProfileApi, loginApi, registerApi } from "../api/authApi";

const USER_KEY = "lurnstack:auth:user:v1";
const TOKEN_KEY = "lurnstack:auth:token:v1";

function getWebStorage(type) {
  if (typeof window === "undefined") return null;
  return type === "session" ? window.sessionStorage : window.localStorage;
}

function safeJsonParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveUser(user, { persist } = {}) {
  const storage = getWebStorage(persist ? "local" : "session");
  if (!storage) return;
  storage.setItem(USER_KEY, JSON.stringify(user || null));
}

function loadUser() {
  const local = getWebStorage("local");
  const session = getWebStorage("session");
  const raw = local?.getItem(USER_KEY) || session?.getItem(USER_KEY);
  const parsed = safeJsonParse(raw);
  return parsed && typeof parsed === "object" ? parsed : null;
}

function saveToken(token, { persist } = {}) {
  const storage = getWebStorage(persist ? "local" : "session");
  if (!storage) return;

  if (!token) storage.removeItem(TOKEN_KEY);
  else storage.setItem(TOKEN_KEY, String(token));
}

function loadToken() {
  const local = getWebStorage("local");
  const session = getWebStorage("session");
  const raw = local?.getItem(TOKEN_KEY) || session?.getItem(TOKEN_KEY) || "";
  return String(raw);
}

function normalizeRole(role) {
  const value = String(role || "").trim().toLowerCase();
  return value === "trainer" ? "trainer" : "student";
}

function parseJwtPayload(token) {
  try {
    const [, payload] = String(token || "").split(".");
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
    return JSON.parse(window.atob(padded));
  } catch {
    return null;
  }
}

function getTokenRole(token) {
  const payload = parseJwtPayload(token);
  const rawRole =
    payload?.role ||
    payload?.ROLE ||
    payload?.userRole ||
    payload?.USER_ROLE ||
    payload?.accountType ||
    payload?.ACCOUNT_TYPE;
  return rawRole ? normalizeRole(rawRole) : "";
}

function toPublicUser(user) {
  if (!user || typeof user !== "object") return null;
  const fullName = user.fullName || user.FULL_NAME || user.name || "";
  const email = user.email || user.EMAIL_ADDRESS || "";
  const phoneNumber = user.phoneNumber || user.PHONE_NUMBER || "";
  const role = user.role || user.ROLE || user.userRole || user.USER_ROLE || user.accountType || user.ACCOUNT_TYPE;
  const { password, PASSWORD, token, ...rest } = user;
  return { ...rest, fullName, email, phoneNumber, role: normalizeRole(role) };
}

function ensureExpectedRole(user, expectedRole) {
  const normalizedExpectedRole = normalizeRole(expectedRole);
  if (user?.role === normalizedExpectedRole) return;
  throw new Error(`Please use a ${normalizedExpectedRole} account to continue.`);
}

async function loginAndPersist({ email, password, persist, expectedRole }) {
  logoutUser();
  const result = await loginApi({ email, password, role: expectedRole });
  if (!result.token) throw new Error("Login succeeded but no session token was returned.");
  const user = toPublicUser(result.user);
  ensureExpectedRole(user, expectedRole);
  const tokenRole = getTokenRole(result.token);
  if (tokenRole && tokenRole !== normalizeRole(expectedRole)) {
    throw new Error("Backend returned a non-trainer session token. Please use trainer login on the backend.");
  }
  saveToken(result.token, { persist });
  saveUser(user, { persist });
  return user;
}

export function getAuthToken() {
  return loadToken() || "";
}

export function getCurrentUser() {
  const token = loadToken();
  const user = loadUser();
  if (!token || !user) return null;
  return user;
}

export async function registerUser({ fullName, email, phoneNumber, password, persist = true }) {
  const result = await registerApi({
    fullName,
    email,
    phoneNumber,
    password,
    role: "student",
  });
  if (result.token) {
    const user = {
      ...toPublicUser(result.user),
      phoneNumber: String(phoneNumber || "").trim(),
    };
    ensureExpectedRole(user, "student");
    saveToken(result.token, { persist });
    saveUser(user, { persist });
    return user;
  }
  return loginAndPersist({ email, password, persist, expectedRole: "student" });
}

export async function authenticateUser({ email, password, persist = true }) {
  return loginAndPersist({ email, password, persist, expectedRole: "student" });
}

export async function registerTrainer({ fullName, email, phoneNumber, password, persist = true }) {
  const result = await registerApi({
    fullName,
    email,
    phoneNumber,
    password,
    role: "trainer",
  });
  if (result.token) {
    const user = {
      ...toPublicUser(result.user),
      phoneNumber: String(phoneNumber || "").trim(),
    };
    ensureExpectedRole(user, "trainer");
    saveToken(result.token, { persist });
    saveUser(user, { persist });
  }
}

export async function authenticateTrainer({ email, password, persist = true }) {
  return loginAndPersist({ email, password, persist, expectedRole: "trainer" });
}

export async function authenticateWithToken({ token, persist = true }) {
  const safeToken = String(token || "").trim();
  if (!safeToken) throw new Error("Missing authentication token.");
  saveToken(safeToken, { persist });
  const user = await getAuthProfileApi();
  ensureExpectedRole(user, "trainer");
  saveUser(user, { persist });
  return user;
}

export function logoutUser() {
  const local = getWebStorage("local");
  const session = getWebStorage("session");
  local?.removeItem(TOKEN_KEY);
  local?.removeItem(USER_KEY);
  session?.removeItem(TOKEN_KEY);
  session?.removeItem(USER_KEY);
}

export function updateLocalUser(updates) {
  const user = loadUser();
  if (!user) return null;
  const updatedUser = { ...user, ...updates };
  
  const local = getWebStorage("local");
  const persist = !!(local && local.getItem(USER_KEY));
  
  saveUser(updatedUser, { persist });
  return updatedUser;
}

