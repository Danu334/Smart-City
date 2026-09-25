import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import styles from "./SponsorCredit.module.css";

// Official logo supplied by the organisers; drop the file in public/logos/.
// Until it exists, only the text credit is shown (no broken image).
const LOGO = "/logos/primaria-chisinau.png";

export default function SponsorCredit({ tone = "light", className = "" }) {
  const { t } = useI18n();
  const img = useRef(null);
  const [hasLogo, setHasLogo] = useState(false);

  useEffect(() => {
    const el = img.current;
    if (!el) return;
    const check = () => setHasLogo(el.naturalWidth > 0);
    if (el.complete) check();
    el.addEventListener("load", check);
    return () => el.removeEventListener("load", check);
  }, []);

  return (
    <div className={`${styles.credit} ${className}`} data-tone={tone}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={img} src={LOGO} alt="" className={styles.logo} hidden={!hasLogo} />
      <p>
        <span className={styles.label}>{t.sponsor.label}</span>
        <span className={styles.name}>{t.sponsor.name}</span>
      </p>
    </div>
  );
}
