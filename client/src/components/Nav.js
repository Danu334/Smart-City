import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useI18n } from "@/lib/i18n";
import Logo from "./Logo";
import PartnerMark from "./PartnerMark";
import LanguageSwitch from "./LanguageSwitch";
import styles from "./Nav.module.css";

export default function Nav() {
  const { t } = useI18n();
  const { pathname } = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const links = [
    ["/", t.nav.home],
    ["/about", t.nav.about],
    ["/faq", t.nav.faq],
  ];

  return (
    <header className={styles.header}>
      <a href="#main" className="skip-link">
        {t.nav.skip}
      </a>
      <nav className={styles.nav} aria-label="Main">
        <div className={styles.brandGroup}>
          <Logo />
          <PartnerMark />
        </div>

        <ul className={styles.links}>
          {links.map(([href, label]) => (
            <li key={href}>
              <Link href={href} className={styles.link} aria-current={pathname === href ? "page" : undefined}>
                {label}
              </Link>
            </li>
          ))}
        </ul>

        <div className={styles.actions}>
          <LanguageSwitch />
          <Link href="/sign-in" className={styles.ghost}>
            {t.nav.signIn}
          </Link>
          <Link href="/sign-up" className={styles.solid}>
            {t.nav.signUp}
          </Link>
        </div>

        <button
          type="button"
          className={styles.burger}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? t.nav.close : t.nav.menu}
          onClick={() => setOpen((o) => !o)}
        >
          <span data-open={open} />
        </button>
      </nav>

      <div id="mobile-menu" className={styles.drawer} data-open={open} hidden={!open}>
        <ul>
          {links.map(([href, label]) => (
            <li key={href}>
              <Link href={href} className={styles.drawerLink} onClick={() => setOpen(false)}>
                {label}
              </Link>
            </li>
          ))}
        </ul>
        <LanguageSwitch />
        <div className={styles.drawerActions}>
          <Link href="/sign-in" className={styles.ghost} onClick={() => setOpen(false)}>
            {t.nav.signIn}
          </Link>
          <Link href="/sign-up" className={styles.solid} onClick={() => setOpen(false)}>
            {t.nav.signUp}
          </Link>
        </div>
      </div>
    </header>
  );
}
