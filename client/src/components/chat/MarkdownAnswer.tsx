import type { ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { useI18n } from "@/lib/i18n";
import { resolveCitationDoc } from "@/lib/corpus";
import type { Citation, OpenCitation } from "@/types/chat";
import styles from "./Chat.module.css";

type CitationProps = { citations: Citation[]; onOpen: OpenCitation; active: number | null | undefined };

function CitationMarker({ n, citations, onOpen, active }: CitationProps & { n: number }) {
  const { t } = useI18n();
  const citation = citations.find((c) => c.n === n);
  if (!citation) return <sup className={styles.markerFallback}>[{n}]</sup>;
  const doc = resolveCitationDoc(citation);
  return (
    <button
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
}

/**
 * Turns `[n]` in an element's own text into citation buttons. Every
 * text-bearing element below runs this on its children, so nested text
 * (bold inside a list item) is covered by that element's own pass.
 */
function withCitations(children: ReactNode, props: CitationProps): ReactNode {
  const one = (child: ReactNode, key: number): ReactNode => {
    if (typeof child !== "string") return child;
    const parts = child.split(/(\[\d+\])/g);
    if (parts.length === 1) return child;
    return parts.map((part, i) => {
      const m = part.match(/^\[(\d+)\]$/);
      return m ? <CitationMarker key={`${key}-${i}`} n={Number(m[1])} {...props} /> : part;
    });
  };
  return Array.isArray(children) ? children.map(one) : one(children, 0);
}

type MarkdownAnswerProps = {
  text: string;
  citations: Citation[];
  active: number | null | undefined;
  onOpenCitation: OpenCitation;
};

/** An assistant answer as GitHub-flavoured Markdown, with [n] as source buttons. */
export default function MarkdownAnswer({ text, citations, active, onOpenCitation }: MarkdownAnswerProps) {
  if (!text.trim()) return null;
  const cite: CitationProps = { citations, onOpen: onOpenCitation, active };
  const inject = (children: ReactNode) => withCitations(children, cite);

  // `node` is react-markdown's syntax tree node; it must not reach the DOM.
  const components: Components = {
    p: ({ children }) => <p className={styles.answerP}>{inject(children)}</p>,
    li: ({ children }) => <li className={styles.mdLi}>{inject(children)}</li>,
    strong: ({ children }) => <strong className={styles.mdStrong}>{inject(children)}</strong>,
    em: ({ children }) => <em>{inject(children)}</em>,
    a: ({ href, children }) => (
      <a href={href} className={styles.mdLink} target="_blank" rel="noopener noreferrer">
        {inject(children)}
      </a>
    ),
    // The answer sits under the page's h2, so its headings start at h3.
    h1: ({ children }) => <h3 className={styles.mdH}>{inject(children)}</h3>,
    h2: ({ children }) => <h3 className={styles.mdH}>{inject(children)}</h3>,
    h3: ({ children }) => <h3 className={styles.mdH}>{inject(children)}</h3>,
    h4: ({ children }) => <h4 className={styles.mdH}>{inject(children)}</h4>,
    ul: ({ children }) => <ul className={styles.mdList}>{children}</ul>,
    ol: ({ children, start }) => (
      <ol className={styles.mdList} start={start}>
        {children}
      </ol>
    ),
    blockquote: ({ children }) => <blockquote className={styles.blockQuote}>{children}</blockquote>,
    code: ({ className, children }) =>
      className ? <code className={className}>{children}</code> : <code className={styles.mdCodeInline}>{children}</code>,
    pre: ({ children }) => <pre className={styles.mdPre}>{children}</pre>,
    hr: () => <hr className={styles.mdHr} />,
    table: ({ children }) => (
      <div className={styles.mdTableWrap}>
        <table className={styles.mdTable}>{children}</table>
      </div>
    ),
    td: ({ children }) => <td>{inject(children)}</td>,
    th: ({ children }) => <th>{inject(children)}</th>,
  };

  return (
    <div className={styles.markdown}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {text}
      </ReactMarkdown>
    </div>
  );
}
