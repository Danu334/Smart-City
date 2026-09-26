import { randomUUID } from "node:crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import { runChatAgent, type AgentEvent } from "@/lib/chat/agent";
import { currentUserId } from "@/lib/chat/user";
import { addMessage, createConversation, getConversation, type AssistantContent } from "@/lib/chat/store";
import { dictionaryFor } from "@/lib/i18n";
import { placeBlocksFor } from "@/lib/places/intents";
import type { Message } from "@/types/chat";

export const config = {
  api: { responseLimit: false },
  maxDuration: 120,
};

const MAX_MESSAGE = 4000;
/** Earlier turns a visitor's page may send along (visitors have no saved history). */
const MAX_GUEST_HISTORY = 12;

/** Events on the wire, in order: meta (signed in only), (status | token | citations)*, done or error. */
export type ChatEvent =
  | AgentEvent
  | { type: "meta"; conversationId: string; userMessageId: string; title: string }
  | ({ type: "done"; messageId: string } & AssistantContent)
  | { type: "error"; message: string };

function send(res: NextApiResponse, event: ChatEvent) {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

function startStream(res: NextApiResponse) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
}

/** A visitor's earlier turns, as plain text only; anything malformed is dropped. */
function guestHistory(raw: unknown): Message[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .slice(-MAX_GUEST_HISTORY)
    .filter(
      (m): m is { role: "user" | "assistant"; text: string } =>
        !!m && (m.role === "user" || m.role === "assistant") && typeof m.text === "string",
    )
    .map((m): Message => {
      const text = m.text.slice(0, MAX_MESSAGE);
      return m.role === "user"
        ? { id: "", role: "user", text }
        : { id: "", role: "assistant", text, blocks: [], citations: [], actions: [] };
    });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { conversationId, message, locale, history } = (req.body ?? {}) as {
    conversationId?: unknown;
    message?: unknown;
    locale?: unknown;
    history?: unknown;
  };
  const text = typeof message === "string" ? message.trim() : "";
  if (!text) return res.status(400).json({ error: "message required" });
  if (text.length > MAX_MESSAGE) return res.status(413).json({ error: "message too long" });
  const t = dictionaryFor(typeof locale === "string" ? locale : null);

  try {
    // Signed in: the conversation is saved. Visitor: answered, nothing stored.
    const userId = await currentUserId(req);

    let savedId: string | null = null;
    let earlier: Message[];
    if (userId) {
      const conversation =
        typeof conversationId === "string" && conversationId
          ? await getConversation(userId, conversationId)
          : await createConversation(userId, text.slice(0, 80), typeof locale === "string" ? locale : "ro");
      if (!conversation) return res.status(404).json({ error: "Conversation not found" });
      savedId = conversation.id;
      earlier = conversation.messages;
      const userMessageId = await addMessage(conversation.id, { role: "user", text });
      startStream(res);
      send(res, { type: "meta", conversationId: conversation.id, userMessageId, title: conversation.title });
    } else {
      earlier = guestHistory(history);
      startStream(res);
    }

    const result = await runChatAgent({
      history: earlier,
      userText: text,
      emit: (event) => send(res, event),
    });

    // Questions about a facility ("unde e un notar?", "gov.md") also get the map.
    const content: AssistantContent = { ...result, blocks: [...result.blocks, ...placeBlocksFor(text, t)] };
    const messageId = savedId ? await addMessage(savedId, { role: "assistant", content }) : randomUUID();

    send(res, { type: "done", messageId, ...content });
    res.end();
  } catch (err) {
    console.error("[api/chat]", err);
    if (res.headersSent) {
      send(res, { type: "error", message: t.chat.answer.errorText });
      res.end();
    } else {
      res.status(500).json({ error: t.chat.answer.errorText });
    }
  }
}
