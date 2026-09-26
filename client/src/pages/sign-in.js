import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useI18n } from "@/lib/i18n";
import { signIn, useSession } from "@/lib/auth-client";
import { checkEmail, checkPassword, fromServerError } from "@/lib/validation";
import AuthLayout from "@/components/auth/AuthLayout";
import Guide from "@/components/guide/Guide";
import Coach, { messageFor, useCoachOff } from "@/components/auth/Coach";
import { Field, PasswordInput } from "@/components/auth/Fields";
import { useAuthForm } from "@/components/auth/useAuthForm";
import PrivacyText from "@/components/PrivacyText";
import styles from "@/components/auth/Auth.module.css";

const SIGN_IN_TOUR = [{}, { target: "si-details" }, { target: "si-finish" }, { target: "si-new", radius: 12 }];

const ORDER = ["email", "password"];
const VALIDATORS = {
  email: checkEmail,
  password: (v) => checkPassword(v, { isNew: false }),
};

// A question typed on the home page before signing in, kept for the chat.
const PENDING_KEY = "sc-pending-question";

export default function SignIn() {
  const { t } = useI18n();
  const s = t.auth.signIn;
  const router = useRouter();
  const pending = typeof router.query.q === "string" ? router.query.q : "";
  const { data: session } = useSession();
  const coachOff = useCoachOff();

  const form = useAuthForm({
    initial: { email: "", password: "", remember: true },
    validators: VALIDATORS,
    order: ORDER,
  });
  const { values, set, bind, capsHandlers, fieldError, coach, dismiss, busy, setServer } = form;

  useEffect(() => {
    if (session) router.replace("/");
  }, [session, router]);

  const inline = (k) => {
    const m = messageFor(t, fieldError(k));
    return m && (coachOff ? `${m[0]} ${m[1]}` : m[0]);
  };

  const onSubmit = form.submit(async (v, setErr) => {
    let retryAfter;
    try {
      const { error } = await signIn.email(
        { email: v.email.trim().toLowerCase(), password: v.password, rememberMe: v.remember },
        { onError: (ctx) => (retryAfter = Number(ctx.response?.headers?.get("X-Retry-After")) || undefined) }
      );
      if (error) return setErr(fromServerError(error, retryAfter));
      if (pending) {
        try {
          sessionStorage.setItem(PENDING_KEY, pending);
        } catch {}
      }
      router.push("/");
    } catch {
      setErr({ field: "submit", code: "network" });
    }
  });

  const submitError = inline("submit");

  return (
    <AuthLayout title={s.title}>
      <h1 className={styles.title}>{s.title}</h1>
      <p className={styles.sub}>{s.sub}</p>

      {pending && (
        <div className={styles.pending}>
          <span>{s.pending}</span>
          <q>{pending}</q>
        </div>
      )}

      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <div id="si-details" className={styles.group}>
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

          <Field
            id="password"
            label={t.auth.password}
            error={inline("password")}
            action={
              <button
                type="button"
                className={styles.inlineLink}
                onClick={() => setServer({ field: "password", code: "forgotSoon", info: true })}
              >
                {s.forgot}
              </button>
            }
          >
            {(aria) => (
              <PasswordInput
                {...aria}
                {...bind("password")}
                {...capsHandlers}
                autoComplete="current-password"
                value={values.password}
                onChange={set("password")}
              />
            )}
          </Field>
        </div>

        <div id="si-finish" className={styles.group}>
          <label className={styles.check}>
            <input type="checkbox" checked={values.remember} onChange={set("remember")} />
            <span>{s.remember}</span>
          </label>

          <button id="auth-submit" type="submit" className={styles.submit} disabled={busy} aria-busy={busy}>
            {busy ? s.submitting : s.submit}
          </button>
          {submitError && (
            <p className={styles.error} role="alert">
              {submitError}
            </p>
          )}
          <p className={styles.legal}>
            <PrivacyText text={t.privacy.signInNote} linkText={t.privacy.signInLink} className={styles.inlineLink} />
          </p>
        </div>
      </form>

      <p id="si-new" className={styles.alt}>
        {s.alt}{" "}
        <Link href="/sign-up" className={styles.inlineLink}>
          {s.altLink}
        </Link>
      </p>

      {!coachOff && coach && (
        <Coach target={coach.target} tone={coach.tone} message={messageFor(t, coach)} onClose={dismiss} />
      )}
      <Guide tour="signIn" steps={SIGN_IN_TOUR} />
    </AuthLayout>
  );
}
