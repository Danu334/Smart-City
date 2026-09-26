import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import Logo from "./Logo";
import SponsorCredit from "./SponsorCredit";
import styles from "./Footer.module.css";

export default function Footer() {
  const { t } = useI18n();
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.about}>
          <Logo />
          <SponsorCredit />
          <p className={styles.disclaimer}>{t.footer.disclaimer}</p>
        </div>

        <div className={styles.col}>
          <h2 className={styles.heading}>{t.footer.product}</h2>
          <ul>
            <li><Link href="/">{t.nav.home}</Link></li>
            <li><Link href="/about">{t.nav.about}</Link></li>
            <li><Link href="/faq">{t.nav.faq}</Link></li>
            <li><Link href="/sign-in">{t.nav.signIn}</Link></li>
            <li><Link href="/privacy">{t.privacy.title}</Link></li>
          </ul>
        </div>

        <div className={styles.col}>
          <h2 className={styles.heading}>{t.footer.sources}</h2>
          <ul>
            {t.footer.links.map(([label, href]) => (
              <li key={href}>
                <a href={href} target="_blank" rel="noreferrer">
                  {label} <span aria-hidden="true">↗</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className={styles.base}>
        <span>© {new Date().getFullYear()} Smart City</span>
        <span lang="ro">Română</span>
        <span lang="ru">Русский</span>
      </div>
    </footer>
  );
}
