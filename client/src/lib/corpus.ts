import chats from "@/data/chats.json";
import docs from "@/data/docs.json";
import type { Conversation, Doc, DocSection } from "@/types/chat";

const DAY = 86_400_000;

// JSON imports are typed loosely (string instead of the literal unions), so
// the seed data is asserted to the app types once, here.
const allDocs = docs.docs as unknown as Doc[];
const byId = new Map(allDocs.map((doc) => [doc.id, doc]));

export function getDoc(id: string): Doc | null {
  return byId.get(id) ?? null;
}

export function getSection(doc: Doc | null, sectionId: string | null | undefined): DocSection | null {
  if (!doc) return null;
  return doc.sections.find((s) => s.id === sectionId) ?? doc.sections[0] ?? null;
}

// Stubs exist to give the history list some depth; they carry no saved messages.
export const seedConversations: Conversation[] = (chats.conversations as unknown as Conversation[]).map((c) => ({
  ...c,
  messages: c.messages ?? [],
}));

export const SEED_CONVERSATION_ID = "medic-familie-kiev-12";

/** Groups conversations into Today / This week / Earlier, newest first. */
export type RecencyGroup = { key: "today" | "week" | "older"; label: string; items: Conversation[] };

export function groupByRecency(
  conversations: Conversation[],
  labels: { today: string; week: string; older: string },
): RecencyGroup[] {
  const now = Date.now();
  const buckets: RecencyGroup[] = [
    { key: "today", label: labels.today, items: [] },
    { key: "week", label: labels.week, items: [] },
    { key: "older", label: labels.older, items: [] },
  ];

  for (const c of [...conversations].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))) {
    const age = now - new Date(c.updatedAt).getTime();
    const bucket = age < DAY ? buckets[0] : age < 7 * DAY ? buckets[1] : buckets[2];
    bucket.items.push(c);
  }

  return buckets.filter((b) => b.items.length);
}

/** Diacritic-insensitive lowercase, so "Rîșcani" and "riscani" match. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
