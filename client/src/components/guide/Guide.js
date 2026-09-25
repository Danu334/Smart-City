import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import Victor from "./Victor";
import styles from "./Guide.module.css";

const OFF_KEY = "sc-guide-off"; // persisted: experienced users opt out
const SEEN_KEY = "sc-guide-seen"; // per session: don't replay on every visit
const CARD_W = 400;

const read = (store, key) => {
  try {
    return store.getItem(key);
  } catch {
    return null;
  }
};
const write = (store, key, value) => {
  try {
    if (value === null) store.removeItem(key);
    else store.setItem(key, value);
  } catch {}
};

// Two-step welcome tour for the home page. Step 1: Victor says hello.
// Step 2: the page dims around the ask box and Victor points at it.
export default function Guide({ targetId }) {
  const { t } = useI18n();
  const g = t.guide;
  const [ready, setReady] = useState(false);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState(null);
  const [wide, setWide] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => {
      const off = read(localStorage, OFF_KEY) === "1";
      const seen = read(sessionStorage, SEEN_KEY) === "1";
      setReady(true);
      if (!off && !seen) setStep(1);
    }, 600);
    return () => clearTimeout(id);
  }, []);

  const finish = useCallback(() => {
    write(sessionStorage, SEEN_KEY, "1");
    setStep(0);
  }, []);

  const turnOff = () => {
    write(localStorage, OFF_KEY, "1");
    finish();
  };

  const restart = () => {
    write(localStorage, OFF_KEY, null);
    setStep(1);
  };

  // Track the ask box while it is spotlighted.
  useEffect(() => {
    if (step !== 2) return;
    const el = document.getElementById(targetId);
    if (!el) return;

    let raf = 0;
    const measure = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height, right: r.right });
        setWide(window.innerWidth >= 720 && window.innerWidth - r.right >= CARD_W + 40);
      });
    };

    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ block: "center", behavior: smooth ? "smooth" : "auto" });
    measure();
    const focusId = setTimeout(() => el.querySelector("input")?.focus({ preventScroll: true }), smooth ? 450 : 0);

    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(focusId);
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [step, targetId]);

  useEffect(() => {
    if (!step) return;
    const onKey = (e) => e.key === "Escape" && finish();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, finish]);

  if (!ready) return null;

  if (!step) {
    return (
      <button type="button" className={styles.launcher} onClick={restart} aria-label={g.launch}>
        <Victor className={styles.launcherFace} viewBox="46 28 108 108" />
        <span>{g.launcher}</span>
      </button>
    );
  }

  const pad = 8;
  const spot = step === 2 && rect;
  const beside = spot && wide;
  const cardStyle = beside
    ? {
        left: rect.right + 28,
        top: Math.max(16, Math.min(rect.top + rect.height / 2 - 130, window.innerHeight - 320)),
      }
    : undefined;

  return (
    <>
      {spot && (
        <div
          className={styles.spot}
          aria-hidden="true"
          style={{
            top: rect.top - pad,
            left: rect.left - pad,
            width: rect.width + pad * 2,
            height: rect.height + pad * 2,
          }}
        />
      )}

      <div
        key={step}
        className={styles.card}
        data-beside={beside || undefined}
        style={cardStyle}
        role="dialog"
        aria-modal="false"
        aria-labelledby="guide-name"
        aria-describedby="guide-text"
      >
        <button type="button" className={styles.close} onClick={finish} aria-label={g.close}>
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>

        <div className={styles.row}>
          <Victor pose={step === 1 ? "wave" : "point"} className={styles.victor} />
          <div className={styles.bubble}>
            <p id="guide-name" className={styles.name}>
              {g.name}
            </p>
            <p id="guide-text" className={styles.text} aria-live="polite">
              {step === 1 ? g.hello : g.ask}
            </p>
          </div>
        </div>

        <div className={styles.footer}>
          <span className={styles.progress}>
            <span className={styles.dots} aria-hidden="true">
              <span data-on={step >= 1} />
              <span data-on={step >= 2} />
            </span>
            {g.step.replace("{n}", step)}
          </span>
          <div className={styles.actions}>
            {step === 1 ? (
              <>
                <button type="button" className={styles.ghost} onClick={finish}>
                  {g.close}
                </button>
                <button type="button" className={styles.primary} onClick={() => setStep(2)}>
                  {g.next}
                  <svg viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M4 10h11M11 5.5L15.5 10 11 14.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </>
            ) : (
              <button type="button" className={styles.primary} onClick={finish}>
                {g.done}
              </button>
            )}
          </div>
        </div>

        <label className={styles.off}>
          <input type="checkbox" onChange={(e) => e.target.checked && turnOff()} />
          <span>{g.off}</span>
        </label>
      </div>
    </>
  );
}
