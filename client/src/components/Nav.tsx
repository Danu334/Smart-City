import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useI18n } from "@/lib/i18n";
import { signOut, useSession } from "@/lib/auth-client";
import Logo from "./Logo";
import PartnerMark from "./PartnerMark";
import LanguageSwitch from "./LanguageSwitch";
import styles from "./Nav.module.css";

export default function Nav() {
  const { t } = useI18n();
  const { pathname } = useRouter();
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();
  const firstName = session?.user?.name?.trim().split(/\s+/)[0];
  const userId = session?.user?.id;

  // Only the team (ADMIN_EMAILS, checked on the server) sees the feedback link.
  const [adminFor, setAdminFor] = useState<string | null>(null);
  useEffect(() => {
    if (!userId) return;
    let live = true;
    fetch("/api/me")
      .then((res) => (res.ok ? res.json() : { feedbackAdmin: false }))
      .then((me: { feedbackAdmin?: boolean }) => live && setAdminFor(me.feedbackAdmin ? userId : null))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [userId]);
  const isAdmin = !!userId && adminFor === userId;

  const [leaving, setLeaving] = useState(false);
  const leave = async () => {
    setOpen(false);
    setLeaving(true);
    try {
      await signOut();
    } finally {
      setLeaving(false);
    }
  };

  // Signed in: greeting + sign out. Otherwise: sign in / sign up.
  const account = (onNavigate?: () => void) =>
    session ? (
      <>
        <span className={styles.greeting} title={session.user.email}>
          {t.nav.greeting.replace("{name}", firstName || "")}
        </span>
        <button type="button" className={styles.ghost} onClick={leave} disabled={leaving} aria-busy={leaving}>
          {t.nav.signOut}
        </button>
      </>
    ) : (
      <>
        <Link href="/sign-in" className={styles.ghost} onClick={onNavigate}>
          {t.nav.signIn}
        </Link>
        <Link href="/sign-up" className={styles.solid} onClick={onNavigate}>
          {t.nav.signUp}
        </Link>
      </>
    );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const links = [
    ["/", t.nav.home],
    ["/about", t.nav.about],
    ["/faq", t.nav.faq],
    ...(isAdmin ? [["/feedback", t.nav.feedback]] : []),
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
          {account()}
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
        <div className={styles.drawerActions}>{account(() => setOpen(false))}</div>
      </div>
    </header>
  );
}
