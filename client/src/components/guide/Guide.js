import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import Victor from "./Victor";
import styles from "./Guide.module.css";

const OFF_KEY = "sc-guide-off"; // persisted: experienced users opt out everywhere
const seenKey = (tour) => `sc-guide-seen-${tour}`; // per session, per page
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

/*
  A short guided tour with Victor. `tour` names the copy in t.guide.tours;
  `steps` lines up with it:
    { target?: element id to spotlight, radius?: spotlight corner radius,
      focus?: focus the target's first input when the step opens }
  Steps without a target show Victor waving in the corner.
*/
export default function Guide({ tour, steps }) {
  const { t } = useI18n();
  const g = t.guide;
  const copy = g.tours[tour];
  const [ready, setReady] = useState(false);
  const [index, setIndex] = useState(-1); // -1 = closed
  const [rect, setRect] = useState(null);
  const [wide, setWide] = useState(false);

  const step = index >= 0 ? steps[index] : null;
  const total = steps.length;

  useEffect(() => {
    let id;
    const start = () => {
      // Wait until the loading screen has lifted.
      if (document.documentElement.classList.contains("is-loading")) {
        id = setTimeout(start, 300);
        return;
      }
      const off = read(localStorage, OFF_KEY) === "1";
      const seen = read(sessionStorage, seenKey(tour)) === "1";
      setReady(true);
      if (!off && !seen) setIndex(0);
    };
    id = setTimeout(start, 600);
    return () => clearTimeout(id);
  }, [tour]);

  const finish = useCallback(() => {
    write(sessionStorage, seenKey(tour), "1");
    setIndex(-1);
    setRect(null);
  }, [tour]);

  const turnOff = () => {
    write(localStorage, OFF_KEY, "1");
    finish();
  };

  const restart = () => {
    write(localStorage, OFF_KEY, null);
    setIndex(0);
  };

  const go = (next) => {
    setRect(null);
    setIndex(next);
  };

  // On phones the card is a bottom sheet; add room below the page so even
  // the last element can scroll clear of it.
  const open = index >= 0;
  useEffect(() => {
    if (!open || window.innerWidth > 600) return;
    const body = document.body.style;
    const prev = body.paddingBottom;
    body.paddingBottom = "60vh";
    return () => {
      body.paddingBottom = prev;
    };
  }, [open]);

  // Keep the spotlight glued to the current target.
  const target = step?.target;
  const focus = step?.focus;
  useEffect(() => {
    if (!target) return;
    const el = document.getElementById(target);
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
    const behavior = smooth ? "smooth" : "auto";
    // Phones show the card as a bottom sheet, so park the target near the top.
    if (window.innerWidth <= 600) {
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 16, behavior });
    } else {
      el.scrollIntoView({ block: "center", behavior });
    }
    measure();
    const settle = setTimeout(() => {
      measure();
      if (focus) el.querySelector("input, select, textarea")?.focus({ preventScroll: true });
    }, smooth ? 450 : 0);

    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(settle);
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [target, focus]);

  useEffect(() => {
    if (index < 0) return;
    const onKey = (e) => e.key === "Escape" && finish();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, finish]);

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
  const spot = step.target && rect;
  const beside = spot && wide;
  const cardStyle = beside
    ? {
        left: rect.right + 28,
        top: Math.max(16, Math.min(rect.top + rect.height / 2 - 130, window.innerHeight - 340)),
      }
    : undefined;
  const last = index === total - 1;

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
            borderRadius: step.radius ?? 16,
          }}
        />
      )}

      <div
        key={index}
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
          <Victor pose={step.target ? "point" : "wave"} className={styles.victor} />
          <div className={styles.bubble}>
            <p id="guide-name" className={styles.name}>
              {g.name}
            </p>
            <p id="guide-text" className={styles.text} aria-live="polite">
              {copy[index]}
            </p>
          </div>
        </div>

        <div className={styles.footer}>
          <span className={styles.progress}>
            <span className={styles.dots} aria-hidden="true">
              {steps.map((_, i) => (
                <span key={i} data-on={i <= index} />
              ))}
            </span>
            {g.step.replace("{n}", index + 1).replace("{total}", total)}
          </span>
          <div className={styles.actions}>
            {index === 0 ? (
              <button type="button" className={styles.ghost} onClick={finish}>
                {g.close}
              </button>
            ) : (
              <button type="button" className={styles.ghost} onClick={() => go(index - 1)}>
                {g.back}
              </button>
            )}
            {last ? (
              <button type="button" className={styles.primary} onClick={finish}>
                {g.done}
              </button>
            ) : (
              <button type="button" className={styles.primary} onClick={() => go(index + 1)}>
                {g.next}
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M4 10h11M11 5.5L15.5 10 11 14.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
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
