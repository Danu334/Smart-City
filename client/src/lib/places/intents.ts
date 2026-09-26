import type { Dictionary } from "@/lib/i18n";
import { normalize } from "@/lib/corpus";
import type { Block } from "@/types/chat";

// Hardcoded for now: which facility a question is about. Later the chat
// backend returns the facility (its name or website) itself and builds the
// same { type: "places", query } block.

type Intent = { match: RegExp; query: string; title: (t: Dictionary) => string };

export const PLACE_INTENTS: Intent[] = [
  { match: /notar|нотари|notary/, query: "birou notarial", title: (t) => t.places.chat.notary },
  { match: /tradu|перевод|translat/, query: "birou de traduceri", title: (t) => t.places.chat.translator },
  {
    match: /guvern|правительств|government/,
    query: "Guvernul",
    title: (t) => `${t.places.chat.government}: Guvernul Republicii Moldova`,
  },
  {
    match: /primari|примэри|мэри|city hall/,
    query: "Primăria Municipiului Chișinău",
    title: (t) => `${t.places.chat.government}: Primăria Municipiului Chișinău`,
  },
];

/** A website mentioned in the question, e.g. "https://gov.md" or "tst.md". */
const WEBSITE = /\bhttps?:\/\/[^\s)]+|\b[\w-]+(?:\.[\w-]+)*\.(?:md|ro|com|org|net)\b(?:\/[^\s)]*)?/i;

/** Places blocks for a question, or [] when it is not about a facility. */
export function placeBlocksFor(text: string, t: Dictionary): Block[] {
  const site = text.match(WEBSITE)?.[0];
  if (site) return [{ type: "places", query: site, title: t.places.chat.government }];
  const q = normalize(text);
  return PLACE_INTENTS.filter((intent) => intent.match.test(q))
    .slice(0, 2)
    .map((intent) => ({ type: "places", query: intent.query, title: intent.title(t) }));
}
