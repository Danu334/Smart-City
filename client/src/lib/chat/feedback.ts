import { pool } from "@/lib/db";

// Reading answer feedback (table chat_feedback in db/chat.sql), for the team.

export type FeedbackTurn = { id: string; role: "user" | "assistant"; text: string };

export type FeedbackEntry = {
  id: string;
  messageId: string;
  rating: number;
  reason: string | null;
  question: string | null;
  answer: string | null;
  locale: string | null;
  createdAt: string;
  /** Null for a visitor. */
  user: { name: string; email: string } | null;
  /** The saved conversation the rated answer belongs to; null for visitors. */
  conversation: { id: string; title: string; turns: FeedbackTurn[] } | null;
};

/** Who may read feedback: the emails in ADMIN_EMAILS (comma-separated). */
export function isFeedbackAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.toLowerCase());
}

type Row = {
  id: string;
  message_id: string;
  rating: number;
  reason: string | null;
  question: string | null;
  answer: string | null;
  locale: string | null;
  created_at: Date;
  name: string | null;
  email: string | null;
  conversation_id: string | null;
  title: string | null;
};

type TurnRow = { id: string; conversation_id: string; role: "user" | "assistant"; text: string | null };

/** Newest first, each with its whole conversation when it was saved. */
export async function listFeedback(limit = 500): Promise<FeedbackEntry[]> {
  // The conversation is joined only when it belongs to whoever rated, so a
  // rating can't be attached to someone else's chat by sending its message id.
  const { rows } = await pool.query<Row>(
    `select f.id, f.message_id, f.rating, f.reason, f.question, f.answer, f.locale, f.created_at,
            u.name, u.email, c.id as conversation_id, c.title
       from chat_feedback f
       left join "user" u on u.id = f.user_id
       left join chat_message m on m.id = f.message_id and m.role = 'assistant'
       left join chat_conversation c on c.id = m.conversation_id and c.user_id = f.user_id
      order by f.created_at desc
      limit $1`,
    [limit],
  );

  const ids = [...new Set(rows.map((r) => r.conversation_id).filter((id): id is string => !!id))];
  const turns = new Map<string, FeedbackTurn[]>();
  if (ids.length) {
    const result = await pool.query<TurnRow>(
      `select id, conversation_id, role, coalesce(text, content->>'text', '') as text
         from chat_message where conversation_id = any($1) order by created_at, id`,
      [ids],
    );
    for (const t of result.rows) {
      const list = turns.get(t.conversation_id) ?? [];
      list.push({ id: t.id, role: t.role, text: t.text ?? "" });
      turns.set(t.conversation_id, list);
    }
  }

  return rows.map((r) => ({
    id: r.id,
    messageId: r.message_id,
    rating: r.rating,
    reason: r.reason,
    question: r.question,
    answer: r.answer,
    locale: r.locale,
    createdAt: r.created_at.toISOString(),
    user: r.email ? { name: r.name ?? "", email: r.email } : null,
    conversation: r.conversation_id
      ? { id: r.conversation_id, title: r.title ?? "", turns: turns.get(r.conversation_id) ?? [] }
      : null,
  }));
}
