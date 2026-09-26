import StateIcon from "@/components/StateIcon";
import { useI18n } from "@/lib/i18n";
import styles from "./Chat.module.css";

const TONES = ["teal", "amber", "rose"];

export default function EmptyState({ onPick }) {
  const { t } = useI18n();
  const s = t.chat.empty;

  return (
    <div className={styles.intro}>
      <p className={styles.introEyebrow}>
        <span className={styles.pulse} aria-hidden="true" />
        {t.hero.eyebrow}
      </p>
      <h1 className={styles.introTitle}>{s.title}</h1>
      <p className={styles.introSub}>{s.sub}</p>

      <ul className={styles.introStates} aria-label={s.statesLabel}>
        {t.honesty.cards.map(([name, badge], i) => (
          <li key={name} className={styles.introState} data-tone={TONES[i]}>
            <span className={styles.introStateIcon}>
              <StateIcon tone={TONES[i]} />
            </span>
            <strong>{name}</strong>
            <span className={styles.introStateBadge}>{badge}</span>
          </li>
        ))}
      </ul>

      <p className={styles.suggestLabel}>{s.suggestionsLabel}</p>
      <ul className={styles.suggestions}>
        {s.suggestions.map((suggestion) => (
          <li key={suggestion}>
            <button type="button" className={styles.suggestion} onClick={() => onPick(suggestion)}>
              {suggestion}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
