import { useEffect, useState } from "react";
import { STEMA } from "./PartnerMark";
import styles from "./Loader.module.css";

const MIN_MS = 3300; // logo animation (~2.6s) plus a moment to see it
const MAX_MS = 5000; // never hold people longer than this
const LEAVE_MS = 900; // curtain slide-up
export const LOADED_KEY = "sc-loaded";

// Full-screen splash shown once per browser session. It is server-rendered
// so it covers the page from the first paint; _document.js hides it before
// paint on repeat visits (html.skip-loader) and while it shows, html has
// .is-loading (scroll locked, hero animations paused).
export default function Loader() {
  const [phase, setPhase] = useState("show"); // show -> leaving -> done

  useEffect(() => {
    window.__loaderOk = true;
    const root = document.documentElement;
    if (root.classList.contains("skip-loader")) {
      const id = setTimeout(() => setPhase("done"), 0);
      return () => clearTimeout(id);
    }

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const minEnd = reduce ? 1200 : MIN_MS;
    const timers = [];
    let left = false;

    const leave = () => {
      if (left) return;
      left = true;
      try {
        sessionStorage.setItem(LOADED_KEY, "1");
      } catch {}
      root.classList.remove("is-loading");
      setPhase("leaving");
      timers.push(setTimeout(() => setPhase("done"), reduce ? 250 : LEAVE_MS));
    };
    // performance.now() counts from navigation start, so time already spent
    // loading the page counts towards the minimum.
    const whenReady = () => timers.push(setTimeout(leave, Math.max(0, minEnd - performance.now())));

    if (document.readyState === "complete") whenReady();
    else window.addEventListener("load", whenReady, { once: true });
    timers.push(setTimeout(leave, Math.max(0, MAX_MS - performance.now())));

    return () => {
      window.removeEventListener("load", whenReady);
      timers.forEach(clearTimeout);
    };
  }, []);

  if (phase === "done") return null;

  return (
    <div className={styles.loader} data-loader data-phase={phase} role="status" aria-live="polite" aria-busy={phase === "show"}>
      <span className="visually-hidden">Se încarcă… / Загрузка…</span>

      <div className={styles.center} aria-hidden="true">
        <svg className={styles.mark} viewBox="0 0 96 96">
          <path className={styles.page} d="M26 12h32l16 16v52a4 4 0 0 1-4 4H26a4 4 0 0 1-4-4V16a4 4 0 0 1 4-4z" />
          <path className={styles.fold} d="M58 12v16h16" />
          <line className={styles.row} style={{ "--d": "1.0s" }} x1="32" y1="38" x2="62" y2="38" />
          <line className={styles.row} style={{ "--d": "1.2s" }} x1="32" y1="48" x2="58" y2="48" />
          <rect className={styles.marker} x="29" y="54" width="36" height="10" rx="2" />
          <line className={styles.row} style={{ "--d": "1.4s" }} x1="32" y1="59" x2="62" y2="59" />
          <line className={styles.row} style={{ "--d": "1.6s" }} x1="32" y1="70" x2="50" y2="70" />
          <circle className={styles.dot} cx="72" cy="76" r="11" />
          <circle className={styles.dotInner} cx="72" cy="76" r="4" />
        </svg>

        <p className={styles.name}>Smart City</p>
        <p className={styles.tag}>
          <span lang="ro">Asistent municipal</span>
          <span className={styles.sep}>·</span>
          <span lang="ru">Муниципальный помощник</span>
        </p>
      </div>

      <div className={styles.bottom} aria-hidden="true">
        <div className={styles.progress}>
          <span />
        </div>
        <div className={styles.partner}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={STEMA} alt="" width="20" height="30" />
          <span lang="ro">Provocare lansată de Primăria Municipiului Chișinău</span>
        </div>
      </div>
    </div>
  );
}
