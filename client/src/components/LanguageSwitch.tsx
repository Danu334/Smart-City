import { LOCALES, useI18n } from "@/lib/i18n";
import styles from "./Nav.module.css";

const NAMES = { ro: "Română", ru: "Русский", en: "English" };

export default function LanguageSwitch() {
  const { locale, setLocale, t } = useI18n();
  return (
    <div className={styles.lang} role="group" aria-label={t.nav.language}>
      {LOCALES.map((code) => (
        <button
          key={code}
          type="button"
          lang={code}
          aria-pressed={locale === code}
          aria-label={NAMES[code]}
          className={styles.langBtn}
          onClick={() => setLocale(code)}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
