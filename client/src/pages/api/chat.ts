import type { NextApiRequest, NextApiResponse } from "next";
import { runChatAgent, type AgentEvent } from "@/lib/chat/agent";
import { resolveOwner } from "@/lib/chat/owner";
import { addMessage, createConversation, getConversation, type AssistantContent } from "@/lib/chat/store";
import { dictionaryFor } from "@/lib/i18n";
import { placeBlocksFor } from "@/lib/places/intents";

export const config = {
  api: { responseLimit: false },
  maxDuration: 120,
};

const MAX_MESSAGE = 4000;

/** Events on the wire, in order: meta, (status | token | citations)*, done or error. */
export type ChatEvent =
  | AgentEvent
  | { type: "meta"; conversationId: string; userMessageId: string; title: string }
  | ({ type: "done"; messageId: string } & AssistantContent)
  | { type: "error"; message: string };

function send(res: NextApiResponse, event: ChatEvent) {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { conversationId, message, locale } = (req.body ?? {}) as {
    conversationId?: unknown;
    message?: unknown;
    locale?: unknown;
  };
  const text = typeof message === "string" ? message.trim() : "";
  if (!text) return res.status(400).json({ error: "message required" });
  if (text.length > MAX_MESSAGE) return res.status(413).json({ error: "message too long" });
  const t = dictionaryFor(typeof locale === "string" ? locale : null);

  try {
    const owner = await resolveOwner(req, res, { create: true });
    if (!owner) throw new Error("no owner");

    const conversation =
      typeof conversationId === "string" && conversationId
        ? await getConversation(owner, conversationId)
        : await createConversation(owner, text.slice(0, 80), typeof locale === "string" ? locale : "ro");
    if (!conversation) return res.status(404).json({ error: "Conversation not found" });

    const userMessageId = await addMessage(conversation.id, { role: "user", text });

    res.writeHead(200, {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
    send(res, { type: "meta", conversationId: conversation.id, userMessageId, title: conversation.title });

    const result = await runChatAgent({
      history: conversation.messages,
      userText: text,
      emit: (event) => send(res, event),
    });

    // Questions about a facility ("unde e un notar?", "gov.md") also get the map.
    const content: AssistantContent = { ...result, blocks: [...result.blocks, ...placeBlocksFor(text, t)] };
    const messageId = await addMessage(conversation.id, { role: "assistant", content });

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
