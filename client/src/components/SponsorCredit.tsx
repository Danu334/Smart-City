import { useI18n } from "@/lib/i18n";
import { STEMA } from "./PartnerMark";
import styles from "./SponsorCredit.module.css";

export default function SponsorCredit({ className = "" }) {
  const { t } = useI18n();
  return (
    <div className={`${styles.credit} ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={STEMA} alt="" width="30" height="44" className={styles.logo} />
      <p>
        <span className={styles.label}>{t.sponsor.label}</span>
        <span className={styles.name}>{t.sponsor.name}</span>
      </p>
    </div>
  );
}
