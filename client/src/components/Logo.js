import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import styles from "./Nav.module.css";

export function LogoMark({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden="true" className={styles.mark}>
      <rect x="4.5" y="2.5" width="16" height="21" rx="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8.5 8h8M8.5 11.5h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.45" />
      <path d="M8.5 15h6" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="21.5" cy="21" r="4.5" fill="var(--accent)" />
      <circle cx="21.5" cy="21" r="1.6" fill="var(--paper)" />
    </svg>
  );
}

export default function Logo() {
  const { t } = useI18n();
  return (
    <Link href="/" className={styles.brand}>
      <LogoMark />
      <span className={styles.brandText}>
        <span className={styles.brandName}>{t.brand.name}</span>
        <span className={styles.brandTag}>{t.brand.tag}</span>
      </span>
    </Link>
  );
}
