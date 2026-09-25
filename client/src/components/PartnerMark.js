import { useI18n } from "@/lib/i18n";
import styles from "./Nav.module.css";

// Chișinău coat of arms (public-domain insignia, Wikimedia Commons) shown as
// the challenge sponsor next to our own brand, not as our logo.
export const STEMA = "/logos/primaria-chisinau-stema.png";

export default function PartnerMark() {
  const { t } = useI18n();
  return (
    <a
      href="https://www.chisinau.md"
      target="_blank"
      rel="noreferrer"
      className={styles.partner}
      aria-label={`${t.sponsor.label} ${t.sponsor.name} (chisinau.md)`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={STEMA} alt="" width="27" height="40" />
      <span className={styles.partnerName}>{t.sponsor.name}</span>
    </a>
  );
}
