import { useState } from "react";

// Form state for sign-in / sign-up plus "what should Victor point at now".
// Errors only show for fields the user has left (touched) or after a submit
// attempt, so nobody is scolded while still typing their first letter.
export function useAuthForm({ initial, validators, order }) {
  const [values, setValues] = useState(initial);
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [focus, setFocus] = useState(null);
  const [caps, setCaps] = useState(false);
  const [server, setServer] = useState(null); // { field, code, n?, info? }
  const [dismissed, setDismissed] = useState(null);
  const [busy, setBusy] = useState(false);

  const errors = {};
  order.forEach((k) => {
    const e = validators[k]?.(values[k]);
    if (e) errors[k] = e;
  });
  const shown = (k) => ((submitted || touched[k]) && errors[k]) || null;
  // Informational notices (info: true) go to Victor only, not the red field error.
  const fieldError = (k) => (server && !server.info && server.field === k ? server : shown(k));

  const set = (k) => (ev) => {
    const v = ev.target.type === "checkbox" ? ev.target.checked : ev.target.value;
    setValues((prev) => ({ ...prev, [k]: v }));
    setServer(null);
    setDismissed(null);
  };
  const update = (k, v) => {
    setValues((prev) => ({ ...prev, [k]: v }));
    setServer(null);
  };
  const bind = (k) => ({
    onFocus: () => setFocus(k),
    onBlur: () => {
      setFocus((f) => (f === k ? null : f));
      setTouched((prev) => ({ ...prev, [k]: true }));
    },
  });
  const readCaps = (e) => setCaps(Boolean(e.getModifierState?.("CapsLock")));
  const capsHandlers = { onKeyDown: readCaps, onKeyUp: readCaps };

  // Priority: server error > error on the focused field > Caps Lock warning
  // > first invalid field after a submit attempt.
  let coach = null;
  if (server) coach = { ...server, target: server.field === "submit" ? "auth-submit" : server.field, tone: server.info ? "warn" : "error" };
  else if (focus && shown(focus)) coach = { ...shown(focus), target: focus, tone: "error" };
  else if (focus === "password" && caps) coach = { code: "capsLock", target: "password", tone: "warn" };
  else if (submitted) {
    const first = order.find((k) => errors[k]);
    if (first) coach = { ...errors[first], target: first, tone: "error" };
  }
  const coachKey = coach && `${coach.target}:${coach.code}`;
  if (coach && coachKey === dismissed) coach = null;

  const submit = (onValid) => async (ev) => {
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
