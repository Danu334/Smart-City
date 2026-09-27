import { useId, useState, type FormEvent } from "react";
import { useI18n } from "@/lib/i18n";
import styles from "./Chat.module.css";

// Rating 1 (sad) … 5 (happy); shown happiest first.
export const FACES = ["😢", "🙁", "😐", "🙂", "😄"];
const ORDER = [5, 4, 3, 2, 1];
/** Ratings at or below this must say what went wrong. */
const NEEDS_REASON = 2;

const storageKey = (messageId: string) => `chat-feedback:${messageId}`;

function savedRating(messageId: string): number | null {
  try {
    const value = Number(localStorage.getItem(storageKey(messageId)));
    return value >= 1 && value <= 5 ? value : null;
  } catch {
    return null;
  }
}

type FeedbackProps = { messageId: string; question: string; answer: string };

/** Five faces under an answer; the two sad ones ask why before sending. */
export default function Feedback({ messageId, question, answer }: FeedbackProps) {
  const { t, locale } = useI18n();
  const s = t.chat.answer.feedback;
  const reasonId = useId();
  // Already rated in this browser: show the thanks, not the faces.
  const [saved] = useState(() => savedRating(messageId));
  const [rating, setRating] = useState<number | null>(saved);
  const [reason, setReason] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">(saved ? "sent" : "idle");

  async function send(value: number, why: string) {
    setState("sending");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, rating: value, reason: why, question, answer, locale }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setState("sent");
      try {
        localStorage.setItem(storageKey(messageId), String(value));
      } catch {
        /* storage unavailable */
      }
    } catch {
      setState("error");
    }
  }

  function choose(value: number) {
    setRating(value);
    setState("idle");
    if (value > NEEDS_REASON) send(value, "");
  }

  function submit(ev: FormEvent) {
    ev.preventDefault();
    if (rating && reason.trim()) send(rating, reason.trim());
  }

  if (state === "sent")
    return (
      <p className={styles.feedbackThanks} role="status">
        <span aria-hidden="true">{rating ? FACES[rating - 1] : ""}</span> {s.thanks}
      </p>
    );

  const needsReason = rating !== null && rating <= NEEDS_REASON;

  return (
    <section className={styles.feedback}>
      <p className={styles.feedbackQuestion}>{s.question}</p>
      <div className={styles.feedbackFaces} role="radiogroup" aria-label={s.question}>
        {ORDER.map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={rating === value}
            aria-label={s.ratings[value - 1]}
            title={s.ratings[value - 1]}
            className={styles.feedbackFace}
            disabled={state === "sending"}
            onClick={() => choose(value)}
          >
            {FACES[value - 1]}
          </button>
        ))}
      </div>
      {needsReason && (
        <form className={styles.feedbackForm} onSubmit={submit}>
          <label htmlFor={reasonId}>{s.reasonLabel}</label>
          <textarea
            id={reasonId}
            value={reason}
            onChange={(ev) => setReason(ev.target.value)}
            placeholder={s.reasonPlaceholder}
            maxLength={2000}
            rows={3}
            required
            autoFocus
          />
          <button type="submit" className={styles.feedbackSubmit} disabled={!reason.trim() || state === "sending"}>
            {s.submit}
          </button>
        </form>
      )}
      {state === "error" && (
        <p className={styles.feedbackError} role="alert">
          {s.error}
        </p>
      )}
    </section>
  );
}
