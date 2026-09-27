import { useState } from "react";
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { fromNodeHeaders } from "better-auth/node";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import MarkdownAnswer from "@/components/chat/MarkdownAnswer";
import { FACES } from "@/components/chat/Feedback";
import { auth } from "@/lib/auth";
import { isFeedbackAdmin, listFeedback, type FeedbackEntry, type FeedbackTurn } from "@/lib/chat/feedback";
import { useI18n } from "@/lib/i18n";
import styles from "@/styles/FeedbackPage.module.css";

type Props = { allowed: boolean; entries: FeedbackEntry[] };

export const getServerSideProps: GetServerSideProps<Props> = async ({ req, res }) => {
  res.setHeader("Cache-Control", "private, no-store");
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!isFeedbackAdmin(session?.user.email)) return { props: { allowed: false, entries: [] } };
  return { props: { allowed: true, entries: await listFeedback() } };
};

type Filter = "all" | "reason" | number;

const noop = () => {};

export default function FeedbackPage({ allowed, entries }: Props) {
  const { t, locale } = useI18n();
  const p = t.feedbackPage;
  const ratings = t.chat.answer.feedback.ratings;
  const [filter, setFilter] = useState<Filter>("all");
  const intl = locale === "en" ? "en-GB" : locale;
  const when = (iso: string) =>
    new Intl.DateTimeFormat(intl, { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));

  const shown = entries.filter((e) => (filter === "all" ? true : filter === "reason" ? !!e.reason : e.rating === filter));
  const count = (rating: number) => entries.filter((e) => e.rating === rating).length;
  const average = entries.length ? entries.reduce((sum, e) => sum + e.rating, 0) / entries.length : 0;

  return (
    <>
      <Head>
        <title>{`${p.title} · Smart City`}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Nav />
      <main id="main" className={styles.page}>
        <header className={styles.head}>
          <h1 className={styles.title}>{allowed ? p.title : p.noAccessTitle}</h1>
          <p className={styles.intro}>{allowed ? p.intro : p.noAccessText}</p>
          {!allowed && (
            <Link href="/sign-in" className={styles.signIn}>
              {p.signIn}
            </Link>
          )}
        </header>

        {allowed && (
          <>
            <section className={styles.stats}>
              <div className={styles.stat}>
                <span className={styles.statValue}>{entries.length}</span>
                <span className={styles.statLabel}>{p.total}</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>
                  {entries.length ? `${FACES[Math.round(average) - 1]} ${average.toFixed(1)}` : "–"}
                </span>
                <span className={styles.statLabel}>{p.average}</span>
              </div>
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className={styles.stat} data-rating={rating}>
                  <span className={styles.statValue}>
                    {FACES[rating - 1]} {count(rating)}
                  </span>
                  <span className={styles.statLabel}>{ratings[rating - 1]}</span>
                </div>
              ))}
            </section>

            <div className={styles.filters} role="group">
              {(["all", 5, 4, 3, 2, 1, "reason"] as Filter[]).map((f) => (
                <button
                  key={String(f)}
                  type="button"
                  className={styles.filter}
                  aria-pressed={filter === f}
                  onClick={() => setFilter(f)}
                >
                  {f === "all" ? p.all : f === "reason" ? p.withReason : `${FACES[f - 1]} ${ratings[f - 1]}`}
                </button>
              ))}
            </div>

            {shown.length === 0 && <p className={styles.empty}>{p.empty}</p>}
            <ol className={styles.list}>
              {shown.map((entry) => (
                <li key={entry.id} className={styles.card} data-rating={entry.rating}>
                  <div className={styles.cardHead}>
                    <span className={styles.face} aria-hidden="true">
                      {FACES[entry.rating - 1]}
                    </span>
                    <div>
                      <strong>{ratings[entry.rating - 1]}</strong>
                      <p className={styles.meta}>
                        {when(entry.createdAt)} · {entry.user ? `${entry.user.name} (${entry.user.email})` : p.visitor}
                        {entry.locale ? ` · ${entry.locale.toUpperCase()}` : ""}
                      </p>
                    </div>
                  </div>

                  {entry.reason && (
                    <blockquote className={styles.reason}>
                      <span>{p.reason}</span>
                      {entry.reason}
                    </blockquote>
                  )}

                  {entry.question && <p className={styles.question}>{entry.question}</p>}

                  <details className={styles.details}>
                    <summary>
                      {p.showChat}
                      {entry.conversation?.title ? `: ${entry.conversation.title}` : ""}
                    </summary>
                    <Chat entry={entry} />
                  </details>
                </li>
              ))}
            </ol>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}

/** The whole saved conversation, or just the rated pair for a visitor. */
function Chat({ entry }: { entry: FeedbackEntry }) {
  const { t } = useI18n();
  const p = t.feedbackPage;
  const turns: FeedbackTurn[] = entry.conversation?.turns.length
    ? entry.conversation.turns
    : [
        { id: "q", role: "user", text: entry.question ?? "" },
        { id: entry.messageId, role: "assistant", text: entry.answer ?? "" },
      ];

  return (
    <div className={styles.chat}>
      {!entry.conversation && <p className={styles.note}>{p.onlyRated}</p>}
      {turns
        .filter((turn) => turn.text.trim())
        .map((turn) => {
          const rated = turn.id === entry.messageId;
          return (
            <div key={turn.id} className={styles.turn} data-role={turn.role} data-rated={rated}>
              <p className={styles.who}>
                {turn.role === "user" ? p.you : p.assistant}
                {rated && (
                  <span className={styles.ratedTag}>
                    {FACES[entry.rating - 1]} {p.rated}
                  </span>
                )}
              </p>
              {turn.role === "user" ? (
                <p>{turn.text}</p>
              ) : (
                <MarkdownAnswer text={turn.text} citations={[]} active={null} onOpenCitation={noop} />
              )}
            </div>
          );
        })}
    </div>
  );
}
