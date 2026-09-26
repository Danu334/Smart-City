import { SEED_CONVERSATION_ID, normalize, seedConversations } from "@/lib/corpus";
import type { Dictionary } from "@/lib/i18n";
import type { AssistantMessage } from "@/types/chat";

// The only place that knows how an answer is produced. Swap the body for a
// fetch() against the real backend when one exists; nothing else changes.

let seq = 0;
export function makeId(prefix = "m") {
  seq += 1;
  return `${prefix}-${Date.now().toString(36)}-${seq}`;
}

const seeded = seedConversations.find((c) => c.id === SEED_CONVERSATION_ID);
const seededAnswer =
  seeded?.messages.find((m): m is AssistantMessage => m.role === "assistant") ?? null;

/** The grounded demo path: anything clearly about the family doctor question. */
function matchesSeed(text: string): boolean {
  const q = normalize(text);
  return q.includes("medic de familie") || q.includes("medicul meu") || q.includes("kiev");
}

export function replyTo(text: string, t: Dictionary): AssistantMessage {
  if (seededAnswer && matchesSeed(text)) {
    return { ...seededAnswer, id: makeId() };
  }

  return {
    id: makeId(),
    role: "assistant",
    blocks: [
      {
        type: "flag",
        tone: "amber",
        title: t.chat.answer.offlineTitle,
        text: t.chat.answer.offlineText,
      },
    ],
    citations: [],
    actions: [],
  };
}
