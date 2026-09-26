import { useEffect, useId, useState } from "react";
import StateIcon from "@/components/StateIcon";
import MarkdownAnswer from "@/components/chat/MarkdownAnswer";
import PlacesPanel from "@/components/places/PlacesPanel";
import { useI18n } from "@/lib/i18n";
import { formatBytes, resolveCitationDoc } from "@/lib/corpus";
import styles from "./Chat.module.css";
import type {
  Action,
  ActiveCitation,
  AnswerStatus,
  Block as AnswerBlock,
  Citation,
  Conversation as ConversationData,
  OpenCitation,
  Tone,
} from "@/types/chat";

/** What the assistant is doing while the answer is on its way. */
export type StatusPhase = "think" | "search" | "tools" | "clock" | "draft";

function ExternalIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M6 14L14 6M8 6h6v6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M5.2 3.5h2.4l1.2 3-1.5 1.2a9 9 0 004.2 4.2l1.2-1.5 3 1.2v2.4a1.3 1.3 0 01-1.4 1.3A11.6 11.6 0 014 4.9 1.3 1.3 0 015.2 3.5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DocIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <rect x="4.5" y="2.5" width="11" height="15" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7.5 7h5M7.5 10h5M7.5 13h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/** Superscript citation markers trailing a block of answer text. */
type MarkerProps = { citations: Citation[]; onOpen: OpenCitation; active: number | null | undefined };

function Refs({ refs, citations, onOpen, active }: MarkerProps & { refs?: number[] }) {
  const { t } = useI18n();
  if (!refs?.length) return null;

  return (
    <>
      {refs.map((n) => {
        const citation = citations.find((c) => c.n === n);
        if (!citation) return null;
        const doc = resolveCitationDoc(citation);
        return (
          <button
            key={n}
            type="button"
            className={styles.marker}
            data-active={active === n}
            aria-expanded={active === n}
            onClick={(ev) => onOpen(citation, ev.currentTarget)}
            title={doc?.title}
          >
            <span className="visually-hidden">{`${t.chat.answer.citation} ${n}: ${doc?.title ?? ""}`}</span>
            <span aria-hidden="true">{n}</span>
          </button>
        );
      })}
    </>
  );
}

function Block({ block, citations, onOpen, active }: MarkerProps & { block: AnswerBlock }) {
  const refs = <Refs refs={block.refs} citations={citations} onOpen={onOpen} active={active} />;

  if (block.type === "steps")
    return (
      <div className={styles.steps}>
        {block.title && (
          <p className={styles.stepsTitle}>
            {block.title}
            {refs}
          </p>
        )}
        <ol>
          {block.items.map((item, i) => (
            <li key={i}>
              {item}
              <Refs refs={block.itemRefs?.[i]} citations={citations} onOpen={onOpen} active={active} />
            </li>
          ))}
        </ol>
      </div>
    );

  if (block.type === "documents") return <DocumentsList block={block} citations={citations} onOpen={onOpen} active={active} />;

  if (block.type === "status") return <StatusCard block={block} citations={citations} onOpen={onOpen} active={active} />;

  if (block.type === "institution")
    return <InstitutionCard block={block} citations={citations} onOpen={onOpen} active={active} />;

  if (block.type === "flag")
    return (
      <div className={styles.flag} data-tone={block.tone ?? "amber"}>
        <span className={styles.flagIcon}>
          <StateIcon tone={block.tone ?? "amber"} />
        </span>
        <div>
          <strong>{block.title}</strong>
          <p>{block.text}</p>
        </div>
      </div>
    );

  if (block.type === "places") return <PlacesPanel query={block.query} title={block.title} compact />;

  if (block.type === "quote")
    return (
      <blockquote className={styles.blockQuote}>
        {block.text}
        {refs}
      </blockquote>
    );

  if (block.type === "p")
    return (
      <p className={styles.answerP}>
        {block.text}
        {refs}
      </p>
    );

  return null;
}

const STATUS_TONE: Record<AnswerStatus, Tone> = {
  found: "teal",
  partial: "amber",
  not_found: "amber",
  contradiction: "rose",
};

/** Formats a source's publication date ("2024-03-12") for the interface language. */
function usePublished() {
  const { t, locale } = useI18n();
  const intl = locale === "en" ? "en-GB" : locale;
  return (published: string | null | undefined) => {
    const date = published ? new Date(`${published.slice(0, 10)}T12:00:00Z`) : null;
    if (!date || Number.isNaN(date.getTime())) return t.chat.answer.publishedUnknown;
    const text = new Intl.DateTimeFormat(intl, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(date);
    return t.chat.answer.published.replace("{date}", text);
  };
}

/** The answer's state, in the legend's colours: found, something missing, or a contradiction. */
function StatusCard({
  block,
  citations,
  onOpen,
  active,
}: MarkerProps & { block: Extract<AnswerBlock, { type: "status" }> }) {
  const { t } = useI18n();
  const s = t.chat.answer.state;
  const published = usePublished();
  const tone = STATUS_TONE[block.status];
  const copy = s[block.status];
  const missing = block.missing ?? [];
  const contradictions = block.contradictions ?? [];
  // "Found" without any source would be a claim we can't back; say nothing then.
  if (block.status === "found" && !citations.length) return null;

  return (
    <div className={styles.flag} data-tone={tone} data-status={block.status}>
      <span className={styles.flagIcon}>
        <StateIcon tone={tone} />
      </span>
      <div className={styles.statusBody}>
        <strong>{copy.title}</strong>
        <p>{copy.text}</p>
        {contradictions.map((c, i) => (
          <div key={i} className={styles.conflict}>
            <p className={styles.conflictTopic}>{c.topic}</p>
            <ul>
              {c.claims.map((claim, j) => {
                const citation = citations.find((x) => x.n === claim.ref);
                const doc = resolveCitationDoc(citation);
                return (
                  <li key={j}>
                    <span>{claim.text}</span>
                    <Refs refs={[claim.ref]} citations={citations} onOpen={onOpen} active={active} />
                    {doc && (
                      <span className={styles.conflictMeta}>
                        {doc.issuer} · {published(doc.published)}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        {missing.length > 0 && (
          <>
            <p className={styles.missingTitle}>{s.missingTitle}</p>
            <ul className={styles.missingList}>
              {missing.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

/** The documents to prepare, set apart so they are hard to miss. */
function DocumentsList({
  block,
  citations,
  onOpen,
  active,
}: MarkerProps & { block: Extract<AnswerBlock, { type: "documents" }> }) {
  const { t } = useI18n();
  const s = t.chat.answer.documents;
  const titleId = useId();

  return (
    <section className={styles.documents} aria-labelledby={titleId}>
      <div className={styles.documentsHead}>
        <span className={styles.documentsIcon}>
          <DocIcon />
        </span>
        <div>
          <h3 id={titleId} className={styles.documentsTitle}>
            {s.title}
          </h3>
          <p className={styles.documentsHint}>{s.hint}</p>
        </div>
      </div>
      <ul className={styles.documentsList}>
        {block.items.map((item, i) => (
          <li key={i}>
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <rect x="3.5" y="3.5" width="13" height="13" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <span>
              {item}
              <Refs refs={block.itemRefs?.[i]} citations={citations} onOpen={onOpen} active={active} />
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;
const webHref = (site: string) => (/^https?:\/\//i.test(site) ? site : `https://${site}`);

/** Where to go: the institution's contacts as the documents give them. */
function InstitutionCard({
  block,
  citations,
  onOpen,
  active,
}: MarkerProps & { block: Extract<AnswerBlock, { type: "institution" }> }) {
  const { t } = useI18n();
  const s = t.chat.answer.institution;
  const notInDocs = <span className={styles.instMissing}>{s.notFound}</span>;

  return (
    <section className={styles.institution} aria-labelledby={`inst-${block.name}`}>
      <h3 className={styles.instTitle}>{s.title}</h3>
      <p id={`inst-${block.name}`} className={styles.instName}>
        {block.name}
        <Refs refs={block.refs} citations={citations} onOpen={onOpen} active={active} />
      </p>
      <dl className={styles.instFields}>
        <dt>{s.address}</dt>
        <dd>{block.address ?? notInDocs}</dd>
        <dt>{s.phone}</dt>
        <dd>
          {block.phone ? (
            <a className={styles.instPhone} href={telHref(block.phone)}>
              <PhoneIcon />
              {block.phone}
            </a>
          ) : (
            notInDocs
          )}
        </dd>
        {block.email && (
          <>
            <dt>{s.email}</dt>
            <dd>
              <a href={`mailto:${block.email}`}>{block.email}</a>
            </dd>
          </>
        )}
        {block.website && (
          <>
            <dt>{s.website}</dt>
            <dd>
              <a href={webHref(block.website)} target="_blank" rel="noopener noreferrer">
                {block.website.replace(/^https?:\/\//i, "")}
              </a>
            </dd>
          </>
        )}
        {block.hours && (
          <>
            <dt>{s.hours}</dt>
            <dd>{block.hours}</dd>
          </>
        )}
      </dl>
    </section>
  );
}

function Sources({ citations, onOpen, active }: MarkerProps) {
  const { t } = useI18n();
  const published = usePublished();
  if (!citations.length) return null;

  return (
    <section className={styles.sources}>
      <h3 className={styles.sourcesTitle}>
        <DocIcon />
        {t.chat.answer.sources}
      </h3>
      <ul>
        {citations.map((citation) => {
          const doc = resolveCitationDoc(citation);
          if (!doc) return null;
          return (
            <li key={citation.n}>
              <button
                type="button"
                className={styles.sourceItem}
                data-active={active === citation.n}
                aria-expanded={active === citation.n}
                onClick={(ev) => onOpen(citation, ev.currentTarget)}
              >
                <span className={styles.sourceNum} aria-hidden="true">
                  {citation.n}
                </span>
                <span className={styles.sourceBody}>
                  <span className={styles.sourceTitle}>{doc.title}</span>
                  <span className={styles.sourceMeta}>
                    {doc.issuer}
                    {doc.reference ? ` · ${doc.reference}` : ""}
                  </span>
                  {"published" in doc && (
                    <span className={styles.sourceDate} data-known={Boolean(doc.published)}>
                      {published(doc.published)}
                    </span>
                  )}
                  <q className={styles.sourceQuote}>{citation.quote}</q>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Actions({ actions }: { actions: Action[] }) {
  const { t } = useI18n();
  if (!actions?.length) return null;

  return (
    <section className={styles.actions}>
      <h3 className={styles.actionsTitle}>{t.chat.answer.nextSteps}</h3>
      <ul>
        {actions.map((action) => {
          const external = action.href.startsWith("http");
          const file = /\.(docx|pdf)$/i.test(action.href);
          return (
            <li key={action.href}>
              <a
                href={action.href}
                className={styles.actionLink}
                {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                {...(file ? { download: "" } : {})}
              >
                <span>
                  {action.label}
                  <em>{action.platform}</em>
                </span>
                {file ? <DocIcon /> : external ? <ExternalIcon /> : <PhoneIcon />}
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Rotating status phrases, restarted (via key) whenever the phase changes. */
function StatusLine({ phase }: { phase: StatusPhase }) {
  const { t } = useI18n();
  const list = t.chat.composer.status[phase];
  const [i, setI] = useState(0);

  useEffect(() => {
    if (list.length < 2) return undefined;
    const id = setInterval(() => setI((n) => (n + 1) % list.length), 2200);
    return () => clearInterval(id);
  }, [list.length]);

  return (
    <p className={styles.typing} aria-live="polite">
      <span className={styles.statusDots} aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <span className={styles.statusText} key={i}>
        {list[i % list.length]}
      </span>
    </p>
  );
}

type ConversationProps = {
  conversation: ConversationData;
  pending: boolean;
  statusPhase: StatusPhase | null;
  onOpenCitation: (citation: Citation, citations: Citation[], messageId: string, trigger: HTMLElement) => void;
  activeCitation: ActiveCitation;
};

export default function Conversation({
  conversation,
  pending,
  statusPhase,
  onOpenCitation,
  activeCitation,
}: ConversationProps) {
  const { t } = useI18n();

  if (conversation.stub)
    return (
      <div className={styles.thread}>
        <h1 className={styles.threadTitle}>{conversation.title}</h1>
        <div className={styles.flag} data-tone="amber">
          <span className={styles.flagIcon}>
            <StateIcon tone="amber" />
          </span>
          <div>
            <strong>{t.chat.answer.stubTitle}</strong>
            <p>{t.chat.answer.stubText}</p>
          </div>
        </div>
      </div>
    );

  return (
    <div className={styles.thread}>
      {conversation.messages.map((message) => {
        if (message.role === "user")
          return (
            <article key={message.id} className={styles.userMsg}>
              <h2 className={styles.msgWho}>{t.chat.answer.you}</h2>
              <p>{message.text}</p>
              {message.attachments && message.attachments.length > 0 && (
                <ul className={styles.msgFiles}>
                  {message.attachments.map((file) => (
                    <li key={file.name}>
                      {file.name} <span>{formatBytes(file.size)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          );

        const citations = message.citations ?? [];
        const active = activeCitation?.messageId === message.id ? activeCitation.n : null;
        const open: OpenCitation = (citation, el) => onOpenCitation(citation, citations, message.id, el);
        // Live answers are Markdown in `text`; their "p" blocks only repeat it
        // for older readers. Order: state first, then the answer, then steps,
        // the institution and its map.
        const markdown = message.text?.trim() ?? "";
        const blocks = markdown ? message.blocks.filter((b) => b.type !== "p") : message.blocks;
        const isTop = (b: AnswerBlock) => b.type === "flag" || b.type === "status";
        if (message.streaming && !markdown && !blocks.length) return null;

        return (
          <article key={message.id} className={styles.answer}>
            <h2 className={styles.msgWho}>{t.chat.answer.assistant}</h2>
            {blocks
              .filter(isTop)
              .map((block, i) => (
                <Block key={`flag-${i}`} block={block} citations={citations} active={active} onOpen={open} />
              ))}
            {markdown && (
              <MarkdownAnswer text={markdown} citations={citations} active={active} onOpenCitation={open} />
            )}
            {blocks
              .filter((b) => !isTop(b))
              .map((block, i) => (
                <Block key={i} block={block} citations={citations} active={active} onOpen={open} />
              ))}
            {!message.streaming && <Sources citations={citations} active={active} onOpen={open} />}
            <Actions actions={message.actions} />
          </article>
        );
      })}

      {/* Only the working state is announced — a live region around the whole
          thread would re-read every message on each conversation switch. */}
      {pending && statusPhase && <StatusLine key={statusPhase} phase={statusPhase} />}
    </div>
  );
}
