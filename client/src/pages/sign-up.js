import { useRef, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import AuthLayout from "@/components/auth/AuthLayout";
import { Field, Notice, PasswordInput, focusFirstInvalid, isEmail } from "@/components/auth/Fields";
import styles from "@/components/auth/Auth.module.css";

function strength(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-ZĂÂÎȘȚА-ЯЁ]/.test(pw) && /[a-zăâîșțа-яё]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^\p{L}\d]/u.test(pw)) score++;
  if (pw.length >= 14) score++;
  return Math.min(score, 3);
}

function Segmented({ name, legend, options, value, onChange }) {
  return (
    <fieldset className={styles.fieldset}>
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
  const e = t.auth.errors;

  const form = useRef(null);
  const [values, setValues] = useState({
    name: "",
    email: "",
    password: "",
    role: "citizen",
    lang: null,
    terms: false,
  });
  const [errors, setErrors] = useState({});
  const [done, setDone] = useState(false);

  // Until the user picks one, the answer language follows the interface.
  const answerLang = values.lang ?? (locale === "ru" ? "ru" : "ro");

  const update = (key, v) => {
    setValues((prev) => ({ ...prev, [key]: v }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
    setDone(false);
  };
  const set = (key) => (ev) => update(key, ev.target.type === "checkbox" ? ev.target.checked : ev.target.value);

  const submit = (ev) => {
    ev.preventDefault();
    const next = {};
    if (!values.name.trim()) next.name = e.required;
    if (!values.email.trim()) next.email = e.required;
    else if (!isEmail(values.email)) next.email = e.email;
    if (!values.password) next.password = e.required;
    else if (values.password.length < 8) next.password = e.short;
    if (!values.terms) next.terms = e.terms;
    setErrors(next);
    if (Object.keys(next).length) return focusFirstInvalid(form.current);
    setDone(true);
  };

  const score = strength(values.password);

  return (
    <AuthLayout title={s.title}>
      <h1 className={styles.title}>{s.title}</h1>
      <p className={styles.sub}>{s.sub}</p>

      <form ref={form} className={styles.form} onSubmit={submit} noValidate>
        <Segmented
          name="role"
          legend={s.role}
          value={values.role}
          onChange={(v) => update("role", v)}
          options={[
            ["citizen", s.citizen],
            ["employee", s.employee],
          ]}
        />

        <Field id="name" label={s.name} error={errors.name}>
          {(aria) => (
            <input {...aria} name="name" type="text" autoComplete="name" className={styles.input} value={values.name} onChange={set("name")} />
          )}
        </Field>

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

        <Field id="password" label={t.auth.password} error={errors.password} hint={s.hint}>
          {(aria) => (
            <>
              <PasswordInput {...aria} autoComplete="new-password" value={values.password} onChange={set("password")} />
              <div className={styles.meter} data-score={values.password ? score : -1} aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
            </>
          )}
        </Field>

        <Segmented
          name="lang"
          legend={s.lang}
          value={answerLang}
          onChange={(v) => update("lang", v)}
          options={[
            ["ro", "Română", "ro"],
            ["ru", "Русский", "ru"],
          ]}
        />

        <div className={styles.field} data-invalid={!!errors.terms}>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={values.terms}
              onChange={set("terms")}
              aria-invalid={!!errors.terms || undefined}
              aria-describedby={errors.terms ? "terms-error" : undefined}
            />
            <span>{s.terms}</span>
          </label>
          {errors.terms && (
            <p id="terms-error" className={styles.error}>
              {errors.terms}
            </p>
          )}
        </div>

        <button type="submit" className={styles.submit}>
          {s.submit}
        </button>

        {done && <Notice>{t.auth.notConnected}</Notice>}
      </form>

      <p className={styles.alt}>
        {s.alt}{" "}
        <Link href="/sign-in" className={styles.inlineLink}>
          {s.altLink}
        </Link>
      </p>
    </AuthLayout>
  );
}
