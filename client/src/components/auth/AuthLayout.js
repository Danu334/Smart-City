import Head from "next/head";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useI18n } from "@/lib/i18n";
import Logo from "@/components/Logo";
import PartnerMark from "@/components/PartnerMark";
import LanguageSwitch from "@/components/LanguageSwitch";
import SponsorCredit from "@/components/SponsorCredit";
import styles from "./Auth.module.css";

const DocsScene = dynamic(() => import("@/components/three/DocsScene"), { ssr: false });

export default function AuthLayout({ title, children }) {
  const { t } = useI18n();
  return (
    <>
      <Head>
        <title>{`${title} · Smart City`}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <a href="#main" className="skip-link">
        {t.nav.skip}
      </a>

      <div className={styles.shell}>
        <div className={styles.formCol}>
          <header className={styles.top}>
            <div className={styles.brandGroup}>
              <Logo />
              <PartnerMark />
            </div>
            <LanguageSwitch />
          </header>

          <main id="main" className={styles.main}>
            <Link href="/" className={styles.back}>
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <path d="M16 10H5M9 5.5L4.5 10 9 14.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {t.auth.back}
            </Link>
            {children}
          </main>
        </div>

        <aside className={styles.panel} aria-label={t.brand.tag}>
          <DocsScene className={styles.scene} />
          <div className={styles.panelText}>
            <p className={styles.panelEyebrow}>
              <span aria-hidden="true" />
              RO · RU
            </p>
            <p className={styles.panelQuote}>{t.auth.panelQuote}</p>
            <p className={styles.panelCaption}>{t.auth.panelCaption}</p>
            <SponsorCredit className={styles.panelSponsor} />
          </div>
        </aside>
      </div>
    </>
  );
}
