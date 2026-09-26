import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import styles from "./Chat.module.css";

// Shown to a visitor after an answer: what an account adds. Closing it keeps
// it closed for this tab, so it doesn't come back after every question.

const OFF_KEY = "sc-account-nudge-off";

export function nudgeDismissed(): boolean {
  try {
    return sessionStorage.getItem(OFF_KEY) === "1";
  } catch {
    return false;
  }
}

type AccountNudgeProps = {
  onClose: () => void;
  /** Called before going to sign-in or sign-up, so this chat can be kept. */
  onLeave: () => void;
};

export default function AccountNudge({ onClose, onLeave }: AccountNudgeProps) {
  const { t } = useI18n();
  const n = t.chat.nudge;

  const close = () => {
    try {
      sessionStorage.setItem(OFF_KEY, "1");
    } catch {}
    onClose();
  };

  return (
    <aside className={styles.nudge} role="status" aria-live="polite" aria-labelledby="nudge-title">
      <button type="button" className={styles.nudgeClose} onClick={close}>
        <span className="visually-hidden">{n.close}</span>
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      </button>
      <p id="nudge-title" className={styles.nudgeTitle}>
        {n.title}
      </p>
      <p className={styles.nudgeText}>{n.text}</p>
      <ul className={styles.nudgeList}>
        {n.benefits.map((benefit) => (
          <li key={benefit}>{benefit}</li>
        ))}
      </ul>
      <div className={styles.nudgeActions}>
        <Link href="/sign-up" className={styles.nudgePrimary} onClick={onLeave}>
          {n.signUp}
        </Link>
        <Link href="/sign-in" className={styles.nudgeGhost} onClick={onLeave}>
          {n.signIn}
        </Link>
        <button type="button" className={styles.nudgeLater} onClick={close}>
          {n.later}
        </button>
      </div>
    </aside>
  );
}
