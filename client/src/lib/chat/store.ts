import { randomUUID } from "node:crypto";
import { pool } from "@/lib/db";
import type { Action, Block, Citation, Conversation, Message } from "@/types/chat";

// Chat history on Neon (tables in db/chat.sql). Every query is scoped to the
// user, so one user can never read or write another's conversations.

export type AssistantContent = {
  text: string;
  blocks: Block[];
  citations: Citation[];
  actions: Action[];
};

type ConversationRow = { id: string; title: string; locale: string; updated_at: Date };
type MessageRow = { id: string; role: "user" | "assistant"; text: string | null; content: AssistantContent | null };

function toConversation(row: ConversationRow, messages: Message[] = []): Conversation {
  return {
    id: row.id,
    title: row.title,
    locale: row.locale,
    updatedAt: row.updated_at.toISOString(),
    messages,
  };
}

function toMessage(row: MessageRow): Message {
  if (row.role === "user") return { id: row.id, role: "user", text: row.text ?? "", attachments: [] };
  const content = row.content;
  return {
    id: row.id,
    role: "assistant",
    text: content?.text ?? "",
    blocks: content?.blocks ?? [],
    citations: content?.citations ?? [],
    actions: content?.actions ?? [],
  };
}

/** Newest first, without messages (the sidebar only needs titles). */
export async function listConversations(userId: string): Promise<Conversation[]> {
  const { rows } = await pool.query<ConversationRow>(
    `select id, title, locale, updated_at from chat_conversation where user_id = $1 order by updated_at desc limit 200`,
    [userId],
  );
  return rows.map((row) => toConversation(row));
}

export async function getConversation(userId: string, id: string): Promise<Conversation | null> {
  const { rows } = await pool.query<ConversationRow>(
    `select id, title, locale, updated_at from chat_conversation where id = $1 and user_id = $2`,
    [id, userId],
  );
  if (!rows[0]) return null;
  const messages = await pool.query<MessageRow>(
    `select id, role, text, content from chat_message where conversation_id = $1 order by created_at, id`,
    [id],
  );
  return toConversation(rows[0], messages.rows.map(toMessage));
}

export async function createConversation(userId: string, title: string, locale: string): Promise<Conversation> {
  const { rows } = await pool.query<ConversationRow>(
    `insert into chat_conversation (id, user_id, title, locale)
     values ($1, $2, $3, $4)
     returning id, title, locale, updated_at`,
    [randomUUID(), userId, title, locale],
  );
  return toConversation(rows[0]);
}

/** Appends a message and bumps the conversation to the top of the list. */
export async function addMessage(
  conversationId: string,
  message: { role: "user"; text: string } | { role: "assistant"; content: AssistantContent },
): Promise<string> {
  const id = randomUUID();
  await pool.query(
    `with m as (insert into chat_message (id, conversation_id, role, text, content) values ($1, $2, $3, $4, $5))
     update chat_conversation set updated_at = now() where id = $2`,
    [
      id,
      conversationId,
      message.role,
      message.role === "user" ? message.text : null,
      message.role === "assistant" ? JSON.stringify(message.content) : null,
    ],
  );
  return id;
}

const IMPORT_MAX_CONVERSATIONS = 20;
const IMPORT_MAX_MESSAGES = 60;
const IMPORT_MAX_TEXT = 8000;
const IMPORT_BLOCK_TYPES = new Set(["p", "quote", "steps", "flag", "places", "status", "institution"]);

/** Keeps only well-formed messages from a browser-sent conversation. */
function cleanImported(raw: unknown): { role: "user"; text: string } | { role: "assistant"; content: AssistantContent } | null {
  if (!raw || typeof raw !== "object") return null;
  const m = raw as Partial<Record<"role" | "text" | "blocks" | "citations" | "actions", unknown>>;
  const text = typeof m.text === "string" ? m.text.slice(0, IMPORT_MAX_TEXT) : "";
  if (m.role === "user") return text.trim() ? { role: "user", text } : null;
  if (m.role !== "assistant") return null;
  const list = (v: unknown) => (Array.isArray(v) ? v.filter((x) => x && typeof x === "object") : []);
  const blocks = list(m.blocks).filter((b) => IMPORT_BLOCK_TYPES.has((b as Block).type)) as Block[];
  const citations = list(m.citations).filter(
    (c) => typeof (c as Citation).n === "number" && typeof (c as Citation).docId === "string",
  ) as Citation[];
  const actions = list(m.actions).filter(
    (a) => typeof (a as Action).label === "string" && typeof (a as Action).href === "string" && /^(https?:|tel:|\/)/.test((a as Action).href),
  ) as Action[];
  if (!text.trim() && !blocks.length) return null;
  return { role: "assistant", content: { text, blocks, citations, actions } };
}

/**
 * Saves conversations a visitor had before signing in (sent by their browser)
 * into their account. Returns how many were saved.
 */
export async function importConversations(userId: string, raw: unknown, locale: string): Promise<number> {
  if (!Array.isArray(raw)) return 0;
  let saved = 0;
  for (const item of raw.slice(0, IMPORT_MAX_CONVERSATIONS)) {
    const c = (item ?? {}) as { title?: unknown; messages?: unknown };
    const messages = (Array.isArray(c.messages) ? c.messages : [])
      .slice(0, IMPORT_MAX_MESSAGES)
      .map(cleanImported)
      .filter((m) => m !== null);
    const firstQuestion = messages.find((m) => m.role === "user");
    if (!firstQuestion) continue;
    const title = (typeof c.title === "string" && c.title.trim() ? c.title : firstQuestion.text).slice(0, 80);
    const conversation = await createConversation(userId, title, locale);
    for (const m of messages) await addMessage(conversation.id, m);
    saved += 1;
  }
  return saved;
}
