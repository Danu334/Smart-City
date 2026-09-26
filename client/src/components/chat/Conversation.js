import StateIcon from "@/components/StateIcon";
import { useI18n } from "@/lib/i18n";
import { formatBytes, getDoc } from "@/lib/corpus";
import styles from "./Chat.module.css";

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
function Refs({ refs, citations, onOpen, active }) {
  const { t } = useI18n();
  if (!refs?.length) return null;

  return (
    <>
      {refs.map((n) => {
        const citation = citations.find((c) => c.n === n);
        if (!citation) return null;
        const doc = getDoc(citation.docId);
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

function Block({ block, citations, onOpen, active }) {
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
            <li key={i}>{item}</li>
          ))}
        </ol>
      </div>
    );

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

  if (block.type === "quote")
    return (
      <blockquote className={styles.blockQuote}>
        {block.text}
        {refs}
      </blockquote>
    );

  return (
    <p className={styles.answerP}>
      {block.text}
      {refs}
    </p>
  );
}

function Sources({ citations, onOpen, active }) {
  const { t } = useI18n();
  if (!citations.length) return null;

  return (
    <section className={styles.sources}>
      <h3 className={styles.sourcesTitle}>
        <DocIcon />
        {t.chat.answer.sources}
      </h3>
      <ul>
        {citations.map((citation) => {
          const doc = getDoc(citation.docId);
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
                    {doc.issuer} · {doc.reference}
                  </span>
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

function Actions({ actions }) {
  const { t } = useI18n();
  if (!actions?.length) return null;

  return (
    <section className={styles.actions}>
      <h3 className={styles.actionsTitle}>{t.chat.answer.nextSteps}</h3>
      <ul>
        {actions.map((action) => {
          const external = action.href.startsWith("http");
          return (
            <li key={action.href}>
              <a
                href={action.href}
                className={styles.actionLink}
                {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              >
                <span>
                  {action.label}
                  <em>{action.platform}</em>
                </span>
                {external ? <ExternalIcon /> : <PhoneIcon />}
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default function Conversation({ conversation, pending, onOpenCitation, activeCitation }) {
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
              {message.attachments?.length > 0 && (
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

        return (
          <article key={message.id} className={styles.answer}>
            <h2 className={styles.msgWho}>{t.chat.answer.assistant}</h2>
            {message.blocks.map((block, i) => (
              <Block
                key={i}
                block={block}
                citations={citations}
                active={active}
                onOpen={(citation, el) => onOpenCitation(citation, citations, message.id, el)}
              />
            ))}
            <Sources
              citations={citations}
              active={active}
              onOpen={(citation, el) => onOpenCitation(citation, citations, message.id, el)}
            />
            <Actions actions={message.actions} />
          </article>
        );
      })}

      {/* Only the working state is announced — a live region around the whole
          thread would re-read every message on each conversation switch. */}
      <p className={styles.typing} aria-live="polite" hidden={!pending}>
        {pending && (
          <>
            <span />
            <span />
            <span />
            {t.chat.composer.thinking}
          </>
        )}
      </p>
    </div>
  );
}
