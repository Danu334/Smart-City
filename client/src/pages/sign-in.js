import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useI18n } from "@/lib/i18n";
import AuthLayout from "@/components/auth/AuthLayout";
import Guide from "@/components/guide/Guide";
import { Field, Notice, PasswordInput, focusFirstInvalid, isEmail } from "@/components/auth/Fields";
import styles from "@/components/auth/Auth.module.css";

const SIGN_IN_TOUR = [{}, { target: "si-details" }, { target: "si-finish" }, { target: "si-new", radius: 12 }];

export default function SignIn() {
  const { t } = useI18n();
  const s = t.auth.signIn;
  const e = t.auth.errors;
  const { query } = useRouter();
  const pending = typeof query.q === "string" ? query.q : "";

  const form = useRef(null);
  const [values, setValues] = useState({ email: "", password: "", remember: true });
  const [errors, setErrors] = useState({});
  const [done, setDone] = useState(false);

  const set = (key) => (ev) => {
    const v = ev.target.type === "checkbox" ? ev.target.checked : ev.target.value;
    setValues((prev) => ({ ...prev, [key]: v }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
    setDone(false);
  };

  const submit = (ev) => {
    ev.preventDefault();
    const next = {};
    if (!values.email.trim()) next.email = e.required;
    else if (!isEmail(values.email)) next.email = e.email;
    if (!values.password) next.password = e.required;
    setErrors(next);
    if (Object.keys(next).length) return focusFirstInvalid(form.current);
    setDone(true);
  };

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

      <form ref={form} className={styles.form} onSubmit={submit} noValidate>
        <div id="si-details" className={styles.group}>
          <Field id="email" label={t.auth.email} error={errors.email}>
            {(aria) => (
              <input
                {...aria}
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                className={styles.input}
                value={values.email}
                onChange={set("email")}
              />
            )}
          </Field>

          <Field
            id="password"
            label={t.auth.password}
            error={errors.password}
            action={
              <Link href="/sign-in" className={styles.inlineLink}>
                {s.forgot}
              </Link>
            }
          >
            {(aria) => (
              <PasswordInput {...aria} autoComplete="current-password" value={values.password} onChange={set("password")} />
            )}
          </Field>
        </div>

        <div id="si-finish" className={styles.group}>
          <label className={styles.check}>
            <input type="checkbox" checked={values.remember} onChange={set("remember")} />
            <span>{s.remember}</span>
          </label>

          <button type="submit" className={styles.submit}>
            {s.submit}
          </button>
        </div>

        {done && <Notice>{t.auth.notConnected}</Notice>}
      </form>

      <p id="si-new" className={styles.alt}>
        {s.alt}{" "}
        <Link href="/sign-up" className={styles.inlineLink}>
          {s.altLink}
        </Link>
      </p>

      <Guide tour="signIn" steps={SIGN_IN_TOUR} />
    </AuthLayout>
  );
}
