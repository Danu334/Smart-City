import { useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from "react";
import type { FieldIssue, Issue } from "@/lib/validation";

type Values = Record<string, unknown>;

/** Per-field check; only fields listed in `order` are validated. */
export type Validators<V extends Values> = { [K in keyof V]?: (value: V[K]) => Issue | null };

/** What Victor should point at right now, and in which tone. */
export type CoachState = FieldIssue & { target: string; tone: "error" | "warn" };

type Options<V extends Values> = {
  initial: V;
  validators: Validators<V>;
  /** Validated fields in on-screen order (first invalid one gets focus). */
  order: readonly (keyof V & string)[];
};

// Form state for sign-in / sign-up plus "what should Victor point at now".
// Errors only show for fields the user has left (touched) or after a submit
// attempt, so nobody is scolded while still typing their first letter.
export function useAuthForm<V extends Values>({ initial, validators, order }: Options<V>) {
  const [values, setValues] = useState<V>(initial);
  const [touched, setTouched] = useState<Partial<Record<keyof V, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [focus, setFocus] = useState<string | null>(null);
  const [caps, setCaps] = useState(false);
  const [server, setServer] = useState<FieldIssue | null>(null);
  const [dismissed, setDismissed] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const errors: Record<string, Issue> = {};
  order.forEach((k) => {
    const e = validators[k]?.(values[k]);
    if (e) errors[k] = e;
  });
  const shown = (k: string): Issue | null => ((submitted || touched[k]) && errors[k]) || null;
  // Informational notices (info: true) go to Victor only, not the red field error.
  const fieldError = (k: string): Issue | null =>
    server && !server.info && server.field === k ? server : shown(k);

  const set = (k: keyof V & string) => (ev: ChangeEvent<HTMLInputElement>) => {
    const v = ev.target.type === "checkbox" ? ev.target.checked : ev.target.value;
    setValues((prev) => ({ ...prev, [k]: v }));
    setServer(null);
    setDismissed(null);
  };
  const update = <K extends keyof V>(k: K, v: V[K]) => {
    setValues((prev) => ({ ...prev, [k]: v }));
    setServer(null);
  };
  const bind = (k: keyof V & string) => ({
    onFocus: () => setFocus(k),
    onBlur: () => {
      setFocus((f) => (f === k ? null : f));
      setTouched((prev) => ({ ...prev, [k]: true }));
    },
  });
  const readCaps = (e: KeyboardEvent<HTMLInputElement>) => setCaps(Boolean(e.getModifierState?.("CapsLock")));
  const capsHandlers = { onKeyDown: readCaps, onKeyUp: readCaps };

  // Priority: server error > error on the focused field > Caps Lock warning
  // > first invalid field after a submit attempt.
  let coach: CoachState | null = null;
  const focused = focus ? shown(focus) : null;
  if (server) {
    coach = { ...server, target: server.field === "submit" ? "auth-submit" : server.field, tone: server.info ? "warn" : "error" };
  } else if (focus && focused) {
    coach = { ...focused, field: focus, target: focus, tone: "error" };
  } else if (focus === "password" && caps) {
    coach = { code: "capsLock", field: "password", target: "password", tone: "warn" };
  } else if (submitted) {
    const first = order.find((k) => errors[k]);
    if (first) coach = { ...errors[first], field: first, target: first, tone: "error" };
  }
  const coachKey = coach && `${coach.target}:${coach.code}`;
  if (coach && coachKey === dismissed) coach = null;

  const submit =
    (onValid: (values: V, setServer: (issue: FieldIssue | null) => void) => Promise<void>) =>
    async (ev: FormEvent<HTMLFormElement>) => {
      ev.preventDefault();
      setSubmitted(true);
      setServer(null);
      setDismissed(null);
      const first = order.find((k) => errors[k]);
      if (first) {
        document.getElementById(first)?.focus();
        return;
      }
      setBusy(true);
      try {
        await onValid(values, setServer);
      } finally {
        setBusy(false);
      }
    };

  return {
    values,
    set,
    update,
    bind,
    capsHandlers,
    fieldError,
    coach,
    dismiss: () => setDismissed(coachKey),
    submit,
    busy,
    setServer,
  };
}
