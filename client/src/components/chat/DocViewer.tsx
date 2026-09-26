import { useEffect, useRef } from "react";
import { useI18n } from "@/lib/i18n";
import { getDoc } from "@/lib/corpus";
import styles from "./Chat.module.css";
import type { Citation } from "@/types/chat";

type DocViewerProps = {
  docId: string;
  sectionId: string | null;
  /** All citations of the answer, for prev/next. */
  citations: Citation[];
  index: number;
  onStep: (delta: number) => void;
  onClose: () => void;
};

export default function DocViewer({ docId, sectionId, citations, index, onStep, onClose }: DocViewerProps) {
  const { t } = useI18n();
  const s = t.chat.reader;
  // Search passages carry their own document on the citation.
  const doc = getDoc(docId, citations.find((c) => c.docId === docId)?.doc);
  const heading = useRef<HTMLHeadingElement>(null);
  const sections = useRef(new Map<string, HTMLElement>());

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => ev.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Move focus into the panel when it opens, so keyboard users land in the document.
  useEffect(() => {
    heading.current?.focus();
  }, [docId]);

  // Bring the cited passage into view inside the panel's own scroll container.
  useEffect(() => {
    const target = sectionId ? sections.current.get(sectionId) : undefined;
    if (!target) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
  }, [docId, sectionId]);

  if (!doc) return null;

  const total = citations?.length ?? 0;

  return (
    <aside className={styles.reader} aria-label={s.label}>
      <header className={styles.readerHead}>
        <div className={styles.readerHeadTop}>
          <span className={styles.kind} data-kind={doc.kind}>
            {s.kinds[doc.kind] ?? doc.kind}
          </span>
          <button type="button" className={styles.iconBtn} onClick={onClose}>
            <span className="visually-hidden">{s.close}</span>
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <h2 className={styles.readerTitle} ref={heading} tabIndex={-1}>
          {doc.title}
        </h2>
        <p className={styles.readerMeta}>
          {doc.issuer} · {doc.reference}
        </p>

        <div className={styles.readerTools}>
          <a href={doc.sourceUrl} target="_blank" rel="noopener noreferrer" className={styles.sourceBtn}>
            {s.openSource}
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="M6 14L14 6M8 6h6v6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>

          {total > 1 && (
            <div className={styles.stepper}>
              <button type="button" onClick={() => onStep(-1)}>
                <span className="visually-hidden">{s.prev}</span>
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M12 5l-5 5 5 5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <span>
                {index + 1}/{total}
              </span>
              <button type="button" onClick={() => onStep(1)}>
                <span className="visually-hidden">{s.next}</span>
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M8 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </header>

      <div className={styles.readerBody}>
        <p className={styles.fidelity} data-fidelity={doc.fidelity}>
          {s.fidelity[doc.fidelity]}
          {doc.retrieved ? ` ${s.retrieved}: ${doc.retrieved}.` : ""}
          {"published" in doc ? ` ${doc.published ? `${s.published}: ${doc.published}.` : s.publishedUnknown}` : ""}
        </p>

        {doc.sections.map((section) => (
          <section
            key={section.id}
            className={styles.docSection}
            data-active={section.id === sectionId}
            ref={(el) => {
              if (el) sections.current.set(section.id, el);
              else sections.current.delete(section.id);
            }}
          >
            <h3>{section.heading}</h3>
            {section.paragraphs.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </section>
        ))}
      </div>
    </aside>
  );
}
