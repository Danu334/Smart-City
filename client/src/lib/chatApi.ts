import type { ChatEvent } from "@/pages/api/chat";
import type { Conversation } from "@/types/chat";

// Browser side of /api/chat and /api/conversations. History is saved per
// account; visitors are answered too, but their chat stays on the page.

/** A failed request, with its HTTP status. */
export class ChatApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function errorFrom(res: Response): Promise<ChatApiError> {
  let message = `HTTP ${res.status}`;
  try {
    const body = await res.json();
    if (typeof body?.error === "string") message = body.error;
  } catch {}
  return new ChatApiError(message, res.status);
}

/**
 * POST a question and feed each server-sent event to `onEvent`. Visitors send
 * their earlier turns as `history`, since the server keeps nothing for them.
 */
export async function streamChat({
  conversationId,
  message,
  locale,
  history,
  onEvent,
  signal,
}: {
  conversationId: string | null;
  message: string;
  locale: string;
  history?: { role: "user" | "assistant"; text: string }[];
  onEvent: (event: ChatEvent) => void;
  signal?: AbortSignal;
}): Promise<void> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conversationId, message, locale, history }),
    signal,
  });
  if (!res.ok) throw await errorFrom(res);

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response stream");

  const decoder = new TextDecoder();
  let buffer = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";

    for (const part of parts) {
      const line = part
        .split("\n")
        .map((l) => l.trim())
        .find((l) => l.startsWith("data:"));
      const raw = line?.slice(5).trim();
      if (!raw) continue;
      try {
        onEvent(JSON.parse(raw) as ChatEvent);
      } catch {
        // ignore malformed chunks
      }
    }
  }
}

export async function fetchConversations(): Promise<Conversation[]> {
  const res = await fetch("/api/conversations");
  if (!res.ok) throw await errorFrom(res);
  const data = (await res.json()) as { conversations?: Conversation[] };
  return data.conversations ?? [];
}

export async function fetchConversation(id: string): Promise<Conversation> {
  const res = await fetch(`/api/conversations/${encodeURIComponent(id)}`);
  if (!res.ok) throw await errorFrom(res);
  const data = (await res.json()) as { conversation: Conversation };
  return data.conversation;
}

/** Deletes a saved conversation; one that is already gone counts as deleted. */
export async function deleteConversation(id: string): Promise<void> {
  const res = await fetch(`/api/conversations/${encodeURIComponent(id)}`, { method: "DELETE" });
  if (!res.ok && res.status !== 404) throw await errorFrom(res);
}

/** Saves a visitor's conversations to the account they just signed in to. */
export async function importConversations(conversations: Conversation[], locale: string): Promise<number> {
  const res = await fetch("/api/conversations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conversations, locale }),
  });
  if (!res.ok) throw await errorFrom(res);
  const data = (await res.json()) as { saved?: number };
  return data.saved ?? 0;
}
