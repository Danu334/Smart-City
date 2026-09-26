import { useEffect, useState } from "react";
import Victor from "@/components/guide/Victor";
import { useI18n } from "@/lib/i18n";
import { fill } from "@/lib/validation";
import styles from "./Coach.module.css";

const CARD_W = 320;

// Victor explains what is wrong with one form field, next to that field.
// `target` is the element id to point at; `message` is [short, tip].
// Hidden entirely when the user switched the guide off; the form then shows
// the tip inline instead (see useCoachOff).
export default function Coach({ target, message, tone = "error", onClose }) {
  const { t } = useI18n();
  const [rect, setRect] = useState(null);

  useEffect(() => {
    const el = target && document.getElementById(target);
    if (!el) return;
    let raf = 0;
    const measure = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        setRect({ top: r.top, left: r.left, right: r.right, bottom: r.bottom, height: r.height });
      });
    };
    measure();
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [target]);

  if (!message || !rect) return null;

  const beside = typeof window !== "undefined" && window.innerWidth >= 900 && window.innerWidth - rect.right >= CARD_W + 40;
  const style = beside
    ? { left: rect.right + 22, top: Math.max(12, Math.min(rect.top + rect.height / 2 - 48, window.innerHeight - 220)) }
    : undefined;

  return (
    <div
      key={message[0]}
      className={styles.coach}
      data-coach
      data-tone={tone}
      data-beside={beside || undefined}
      style={style}
      role="status"
      aria-live="polite"
    >
      <Victor className={styles.face} viewBox="46 28 108 108" />
      <div className={styles.body}>
        <p className={styles.name}>{t.auth.coach.name}</p>
        <p className={styles.short}>{message[0]}</p>
        <p className={styles.tip}>{message[1]}</p>
      </div>
      <button type="button" className={styles.close} onClick={onClose} aria-label={t.auth.coach.close}>
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

// True when the user turned Victor off ("experienced user").
export function useCoachOff() {
  const [off, setOff] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => {
      try {
        setOff(localStorage.getItem("sc-guide-off") === "1");
      } catch {}
    }, 0);
    return () => clearTimeout(id);
  }, []);
  return off;
}

// [short, tip] for a validation/server error, with {n} filled in.
export function messageFor(t, err) {
  if (!err) return null;
  const pair = t.auth.coach.codes[err.code];
  if (!pair) return null;
  return [fill(pair[0], err), fill(pair[1], err)];
}
