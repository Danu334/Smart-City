import type { ChatEvent } from "@/pages/api/chat";
import type { Conversation } from "@/types/chat";

// Browser side of /api/chat and /api/conversations. History is kept per
// account; visitors get a 401 from /api/chat and are asked to sign in.

/** A failed request, with the HTTP status (401 = sign in first). */
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

/** POST a question and feed each server-sent event to `onEvent`. */
export async function streamChat({
  conversationId,
  message,
  locale,
  onEvent,
  signal,
}: {
  conversationId: string | null;
  message: string;
  locale: string;
  onEvent: (event: ChatEvent) => void;
  signal?: AbortSignal;
}): Promise<void> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conversationId, message, locale }),
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
