// Field checks for the sign-in / sign-up forms. Each returns null when the
// value is fine, or { code, ...params } naming exactly what is wrong, so the
// UI (and Victor) can explain it in plain words. Copy lives in i18n
// under t.auth.coach.codes[code] as [short, tip].

export const MIN_PASSWORD = 8;
export const MAX_PASSWORD = 128;

export function checkName(value) {
  const v = value.trim();
  if (!v) return { code: "nameRequired" };
  if (v.length < 2) return { code: "nameShort" };
  return null;
}

export function checkEmail(value) {
  const v = value.trim();
  if (!v) return { code: "emailRequired" };
  if (/\s/.test(v)) return { code: "emailSpaces" };
  const at = v.indexOf("@");
  if (at === -1) return { code: "emailNoAt" };
  if (v.indexOf("@", at + 1) !== -1) return { code: "emailTwoAt" };
  if (at === 0) return { code: "emailNoName" };
  const domain = v.slice(at + 1);
  if (!domain) return { code: "emailNoDomain" };
  if (domain.startsWith(".") || domain.includes("..") || !/\.[^.]{2,}$/.test(domain)) return { code: "emailNoDot" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return { code: "emailInvalid" };
  return null;
}

// On sign-in we only need *a* password; length rules apply to new ones.
export function checkPassword(value, { isNew }) {
  if (!value) return { code: isNew ? "passwordRequired" : "passwordMissing" };
  if (isNew && value.length < MIN_PASSWORD) return { code: "passwordShort", n: value.length };
  if (value.length > MAX_PASSWORD) return { code: "passwordLong" };
  return null;
}

export function checkTerms(checked) {
  return checked ? null : { code: "terms" };
}

// Map a Better Auth error to the field it concerns and a coach code.
export function fromServerError(error, retryAfter) {
  if (!error) return null;
  const code = error.code || "";
  if (error.status === 429) return { field: "submit", code: "rateLimited", n: retryAfter || 60 };
  if (code.startsWith("USER_ALREADY_EXISTS")) return { field: "email", code: "userExists" };
  if (code === "INVALID_EMAIL_OR_PASSWORD") return { field: "password", code: "badCredentials" };
  if (code === "INVALID_EMAIL") return { field: "email", code: "emailInvalid" };
  if (code === "PASSWORD_TOO_SHORT") return { field: "password", code: "passwordShort", n: MIN_PASSWORD - 1 };
  if (code === "PASSWORD_TOO_LONG") return { field: "password", code: "passwordLong" };
  if (!error.status) return { field: "submit", code: "network" };
  return { field: "submit", code: "server" };
}

// "{n}" placeholders in copy.
export const fill = (text, params = {}) => text.replace(/\{(\w+)\}/g, (_, k) => (k in params ? params[k] : `{${k}}`));
