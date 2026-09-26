import { useEffect } from "react";
import type { Locale } from "@/lib/i18n";
import Link from "next/link";
import { useRouter } from "next/router";
import { useI18n } from "@/lib/i18n";
import { signUp, useSession } from "@/lib/auth-client";
import { checkEmail, checkName, checkPassword, checkPrivacy, checkTerms, fromServerError } from "@/lib/validation";
import AuthLayout from "@/components/auth/AuthLayout";
import Guide from "@/components/guide/Guide";
import Coach, { messageFor, useCoachOff } from "@/components/auth/Coach";
import { Field, PasswordInput } from "@/components/auth/Fields";
import { useAuthForm, type Validators } from "@/components/auth/useAuthForm";
import PrivacyText from "@/components/PrivacyText";
import styles from "@/components/auth/Auth.module.css";

function strength(pw: string): number {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-ZĂÂÎȘȚА-ЯЁ]/.test(pw) && /[a-zăâîșțа-яё]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^\p{L}\d]/u.test(pw)) score++;
  if (pw.length >= 14) score++;
  return Math.min(score, 3);
}

const SIGN_UP_TOUR = [
  {},
  { target: "su-role" },
  { target: "su-details" },
  { target: "su-lang" },
  { target: "su-finish" },
];

type Role = "citizen" | "employee";
type AnswerLang = "ro" | "ru";

type SignUpValues = {
  name: string;
  email: string;
  password: string;
  role: Role;
  /** null until the user picks one; then it no longer follows the UI language. */
  lang: AnswerLang | null;
  terms: boolean;
  privacy: boolean;
};

const ORDER = ["name", "email", "password", "terms", "privacy"] as const;
const VALIDATORS: Validators<SignUpValues> = {
  name: checkName,
  email: checkEmail,
  password: (v) => checkPassword(v, { isNew: true }),
  terms: checkTerms,
  privacy: checkPrivacy,
};

type SegmentedProps<T extends string> = {
  id: string;
  name: string;
  legend: string;
  /** [value, label, lang attribute] */
  options: [T, string, Locale?][];
  value: T;
  onChange: (value: T) => void;
};

function Segmented<T extends string>({ id, name, legend, options, value, onChange }: SegmentedProps<T>) {
  return (
    <fieldset id={id} className={styles.fieldset}>
      <legend className={styles.label}>{legend}</legend>
      <div className={styles.segmented}>
        {options.map(([v, label, lang]) => (
          <label key={v} className={styles.segment} lang={lang}>
            <input type="radio" name={name} value={v} checked={value === v} onChange={() => onChange(v)} />
            <span>{label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default function SignUp() {
  const { t, locale } = useI18n();
  const s = t.auth.signUp;
  const router = useRouter();
  const { data: session } = useSession();
  const coachOff = useCoachOff();

  const form = useAuthForm<SignUpValues>({
    initial: { name: "", email: "", password: "", role: "citizen", lang: null, terms: false, privacy: false },
    validators: VALIDATORS,
    order: ORDER,
  });
  const { values, set, update, bind, capsHandlers, fieldError, coach, dismiss, busy } = form;

  // Already signed in: nothing to do here.
  useEffect(() => {
    if (session) router.replace("/");
  }, [session, router]);

  // Until the user picks one, the answer language follows the interface.
  const answerLang: AnswerLang = values.lang ?? (locale === "ru" ? "ru" : "ro");

  const inline = (k: string) => {
    const m = messageFor(t, fieldError(k));
    return m && (coachOff ? `${m[0]} ${m[1]}` : m[0]);
  };

  const onSubmit = form.submit(async (v, setServer) => {
    let retryAfter: number | undefined;
    try {
      const { error } = await signUp.email(
        {
          name: v.name.trim(),
          email: v.email.trim().toLowerCase(),
          password: v.password,
          role: v.role,
          lang: answerLang,
          privacyConsent: v.privacy,
        },
        {
          onError: (ctx) => {
            retryAfter = Number(ctx.response?.headers?.get("X-Retry-After")) || undefined;
          },
        },
      );
      if (error) return setServer(fromServerError(error, retryAfter));
      router.push("/");
    } catch {
      setServer({ field: "submit", code: "network" });
    }
  });

  const score = strength(values.password);
  const submitError = inline("submit");

  return (
    <AuthLayout title={s.title}>
      <h1 className={styles.title}>{s.title}</h1>
      <p className={styles.sub}>{s.sub}</p>

      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <Segmented
          id="su-role"
          name="role"
          legend={s.role}
          value={values.role}
          onChange={(v) => update("role", v)}
          options={[
            ["citizen", s.citizen],
            ["employee", s.employee],
          ]}
        />

        <div id="su-details" className={styles.group}>
          <Field id="name" label={s.name} error={inline("name")}>
            {(aria) => (
              <input
                {...aria}
                {...bind("name")}
                name="name"
                type="text"
                autoComplete="name"
                className={styles.input}
                value={values.name}
                onChange={set("name")}
              />
            )}
          </Field>

          <Field id="email" label={t.auth.email} error={inline("email")}>
            {(aria) => (
              <input
                {...aria}
                {...bind("email")}
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                className={styles.input}
                value={values.email}
                onChange={set("email")}
              />
            )}
          </Field>

          <Field id="password" label={t.auth.password} error={inline("password")} hint={s.hint}>
            {(aria) => (
              <>
                <PasswordInput
                  {...aria}
                  {...bind("password")}
                  {...capsHandlers}
                  autoComplete="new-password"
                  value={values.password}
                  onChange={set("password")}
                />
                <div className={styles.meter} data-score={values.password ? score : -1} aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
              </>
            )}
          </Field>
        </div>

        <Segmented
          id="su-lang"
          name="lang"
          legend={s.lang}
          value={answerLang}
          onChange={(v) => update("lang", v)}
          options={[
            ["ro", "Română", "ro"],
            ["ru", "Русский", "ru"],
          ]}
        />

        <div id="su-finish" className={styles.group}>
          <div className={styles.field} data-invalid={!!inline("terms")}>
            <label className={styles.check}>
              <input
                id="terms"
                type="checkbox"
                checked={values.terms}
                onChange={set("terms")}
                {...bind("terms")}
                aria-invalid={!!inline("terms") || undefined}
                aria-describedby={inline("terms") ? "terms-error" : undefined}
              />
              <span>{s.terms}</span>
            </label>
            {inline("terms") && (
              <p id="terms-error" className={styles.error}>
                {inline("terms")}
              </p>
            )}
          </div>

          <div className={styles.field} data-invalid={!!inline("privacy")}>
            <label className={styles.check}>
              <input
                id="privacy"
                type="checkbox"
                checked={values.privacy}
                onChange={set("privacy")}
                {...bind("privacy")}
                aria-invalid={!!inline("privacy") || undefined}
                aria-describedby={inline("privacy") ? "privacy-error" : undefined}
              />
              <PrivacyText text={t.privacy.consent} linkText={t.privacy.consentLink} className={styles.inlineLink} />
            </label>
            {inline("privacy") && (
              <p id="privacy-error" className={styles.error}>
                {inline("privacy")}
              </p>
            )}
          </div>

          <button id="auth-submit" type="submit" className={styles.submit} disabled={busy} aria-busy={busy}>
            {busy ? s.submitting : s.submit}
          </button>
          {submitError && (
            <p className={styles.error} role="alert">
              {submitError}
            </p>
          )}
        </div>
      </form>

      <p className={styles.alt}>
        {s.alt}{" "}
        <Link href="/sign-in" className={styles.inlineLink}>
          {s.altLink}
        </Link>
      </p>

      {!coachOff && coach && (
        <Coach target={coach.target} tone={coach.tone} message={messageFor(t, coach)} onClose={dismiss} />
      )}
      <Guide tour="signUp" steps={SIGN_UP_TOUR} />
    </AuthLayout>
  );
}
