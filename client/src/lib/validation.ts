// Field checks for the sign-in / sign-up forms. Each returns null when the
// value is fine, or { code, ...params } naming exactly what is wrong, so the
// UI (and Victor) can explain it in plain words. Copy lives in i18n
// under t.auth.coach.codes[code] as [short, tip].

/** A validation or server problem: which copy to show, plus any {n} params. */
export type Issue = { code: CoachCode; n?: number };
/** A problem tied to a form field ("submit" = the form as a whole). */
export type FieldIssue = Issue & { field: string; info?: boolean };

export type CoachCode =
  | "nameRequired" | "nameShort"
  | "emailRequired" | "emailSpaces" | "emailNoAt" | "emailTwoAt" | "emailNoName" | "emailNoDomain" | "emailNoDot" | "emailInvalid"
  | "passwordRequired" | "passwordMissing" | "passwordShort" | "passwordLong"
  | "terms" | "privacy" | "capsLock"
  | "userExists" | "badCredentials" | "rateLimited" | "network" | "server" | "forgotSoon";

export const MIN_PASSWORD = 8;
export const MAX_PASSWORD = 128;

export function checkName(value: string): Issue | null {
  const v = value.trim();
  if (!v) return { code: "nameRequired" };
  if (v.length < 2) return { code: "nameShort" };
  return null;
}

export function checkEmail(value: string): Issue | null {
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
export function checkPassword(value: string, { isNew }: { isNew: boolean }): Issue | null {
  if (!value) return { code: isNew ? "passwordRequired" : "passwordMissing" };
  if (isNew && value.length < MIN_PASSWORD) return { code: "passwordShort", n: value.length };
  if (value.length > MAX_PASSWORD) return { code: "passwordLong" };
  return null;
}

export function checkTerms(checked: boolean): Issue | null {
  return checked ? null : { code: "terms" };
}

export function checkPrivacy(checked: boolean): Issue | null {
  return checked ? null : { code: "privacy" };
}

// Map a Better Auth error to the field it concerns and a coach code.
type AuthError = { code?: string; message?: string; status?: number } | null | undefined;

export function fromServerError(error: AuthError, retryAfter?: number): FieldIssue | null {
  if (!error) return null;
  const code = error.code || "";
  if (error.status === 429) return { field: "submit", code: "rateLimited", n: retryAfter || 60 };
  if (code.startsWith("USER_ALREADY_EXISTS")) return { field: "email", code: "userExists" };
  if ((error.message || "").includes("PRIVACY_CONSENT_REQUIRED")) return { field: "privacy", code: "privacy" };
  if (code === "INVALID_EMAIL_OR_PASSWORD") return { field: "password", code: "badCredentials" };
  if (code === "INVALID_EMAIL") return { field: "email", code: "emailInvalid" };
  if (code === "PASSWORD_TOO_SHORT") return { field: "password", code: "passwordShort", n: MIN_PASSWORD - 1 };
  if (code === "PASSWORD_TOO_LONG") return { field: "password", code: "passwordLong" };
  if (!error.status) return { field: "submit", code: "network" };
  return { field: "submit", code: "server" };
}

// "{n}" placeholders in copy.
export const fill = (text: string, params: Record<string, unknown> = {}): string =>
  text.replace(/\{(\w+)\}/g, (_, k: string) => (k in params ? String(params[k]) : `{${k}}`));
