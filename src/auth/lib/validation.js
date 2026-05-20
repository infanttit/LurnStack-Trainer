const EMAIL_MAX_LEN = 254;

export function normalizeEmail(raw) {
  return String(raw || "").trim().toLowerCase();
}

export function isValidEmail(email) {
  const value = normalizeEmail(email);
  if (!value) return false;
  if (value.length > EMAIL_MAX_LEN) return false;
  // Pragmatic email check (avoids over-restrictive RFC regex).
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) return false;
  if (value.includes("..")) return false;
  // Catch common provider typos that are syntactically valid but usually wrong.
  const domain = value.split("@")[1] || "";
  const commonTypos = new Set([
    "gmail.co",
    "gamil.com",
    "gmial.com",
    "gmal.com",
    "hotmail.co",
    "yahoo.co",
  ]);
  if (commonTypos.has(domain)) return false;
  return true;
}

export function passwordRules(password) {
  const value = String(password || "");
  return {
    length: value.length >= 8,
    upper: /[A-Z]/.test(value),
    lower: /[a-z]/.test(value),
    number: /[0-9]/.test(value),
    special: /[^A-Za-z0-9]/.test(value),
  };
}

export function isStrongPassword(password) {
  const r = passwordRules(password);
  return r.length && r.upper && r.lower && r.number && r.special;
}

export function passwordPolicyText() {
  return "Use 8+ chars with uppercase, lowercase, number, and special character.";
}
