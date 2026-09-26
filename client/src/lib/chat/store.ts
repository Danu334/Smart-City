import { randomUUID } from "node:crypto";
import { pool } from "@/lib/db";
import type { Action, Block, Citation, Conversation, Message } from "@/types/chat";

// Chat history on Neon (tables in db/chat.sql). Every query is scoped to an
// owner, so one user can never read or write another's conversations.

/** Who a conversation belongs to: a signed-in user or an anonymous guest. */
export type Owner = { userId: string } | { guestId: string };

export type AssistantContent = {
  text: string;
  blocks: Block[];
  citations: Citation[];
  actions: Action[];
};

type ConversationRow = { id: string; title: string; locale: string; updated_at: Date };
type MessageRow = { id: string; role: "user" | "assistant"; text: string | null; content: AssistantContent | null };

/** SQL condition + parameter for the owner, starting at placeholder $n. */
function ownerWhere(owner: Owner, n: number): [string, string] {
  return "userId" in owner ? [`user_id = $${n}`, owner.userId] : [`guest_id = $${n} and user_id is null`, owner.guestId];
}

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
export async function listConversations(owner: Owner): Promise<Conversation[]> {
  const [where, param] = ownerWhere(owner, 1);
  const { rows } = await pool.query<ConversationRow>(
    `select id, title, locale, updated_at from chat_conversation where ${where} order by updated_at desc limit 200`,
    [param],
  );
  return rows.map((row) => toConversation(row));
}

export async function getConversation(owner: Owner, id: string): Promise<Conversation | null> {
  const [where, param] = ownerWhere(owner, 2);
  const { rows } = await pool.query<ConversationRow>(
    `select id, title, locale, updated_at from chat_conversation where id = $1 and ${where}`,
    [id, param],
  );
  if (!rows[0]) return null;
  const messages = await pool.query<MessageRow>(
    `select id, role, text, content from chat_message where conversation_id = $1 order by created_at, id`,
    [id],
  );
  return toConversation(rows[0], messages.rows.map(toMessage));
}

export async function createConversation(owner: Owner, title: string, locale: string): Promise<Conversation> {
  const { rows } = await pool.query<ConversationRow>(
    `insert into chat_conversation (id, user_id, guest_id, title, locale)
     values ($1, $2, $3, $4, $5)
     returning id, title, locale, updated_at`,
    [
      randomUUID(),
      "userId" in owner ? owner.userId : null,
      "guestId" in owner ? owner.guestId : null,
      title,
      locale,
    ],
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

/** Moves a guest's conversations to the account they just signed in to. */
export async function claimGuestConversations(guestId: string, userId: string): Promise<void> {
  await pool.query(
    `update chat_conversation set user_id = $1, guest_id = null where guest_id = $2 and user_id is null`,
    [userId, guestId],
  );
}
