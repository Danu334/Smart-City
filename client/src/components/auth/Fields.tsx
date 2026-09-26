import { useState, type ChangeEventHandler, type InputHTMLAttributes, type ReactNode } from "react";
import { useI18n } from "@/lib/i18n";
import styles from "./Auth.module.css";

/** Accessibility props a Field hands to its input. */
export type FieldAria = { id: string; "aria-invalid"?: true; "aria-describedby"?: string };

type FieldProps = {
  id: string;
  label: string;
  error?: string | null;
  hint?: string;
  /** Extra control next to the label (e.g. "Forgot password?"). */
  action?: ReactNode;
  children: (aria: FieldAria) => ReactNode;
};

export function Field({ id, label, error, hint, children, action }: FieldProps) {
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  return (
    <div className={styles.field} data-invalid={!!error}>
      <div className={styles.labelRow}>
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
        {action}
      </div>
      {children({ id, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy })}
      {hint && !error && (
        <p id={`${id}-hint`} className={styles.hint}>
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className={styles.error}>
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <path d="M10 6.5v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="10" cy="13.5" r="1" fill="currentColor" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
};

export function PasswordInput({ value, onChange, autoComplete, ...aria }: PasswordInputProps) {
  const { t } = useI18n();
  const [shown, setShown] = useState(false);
  return (
    <div className={styles.inputWrap}>
      <input
        {...aria}
        name="password"
        type={shown ? "text" : "password"}
        className={styles.input}
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
      />
      <button
        type="button"
        className={styles.reveal}
        aria-label={shown ? t.auth.hidePassword : t.auth.showPassword}
        aria-pressed={shown}
        onClick={() => setShown((s) => !s)}
      >
        {shown ? t.auth.hide : t.auth.show}
      </button>
    </div>
  );
}
