import OpenAI from "openai";
import type {
  ChatCompletionFunctionTool,
  ChatCompletionMessageParam,
} from "openai/resources/chat/completions";
import { searchChunks, type Hit } from "@/lib/chat/qdrant";
import { hitsToCitations } from "@/lib/chat/format";
import { findDemoScript, type DemoScript } from "@/lib/chat/demo";
import { messagePlainText } from "@/lib/chat/plain";
import type { AssistantContent } from "@/lib/chat/store";
import type { AnswerStatus, Block, Citation, Contradiction, Institution, Message } from "@/types/chat";

const EMBED_MODEL = "text-embedding-3-large";
const CHAT_MODEL = "gpt-4o-mini";
const TIMEZONE = "Europe/Chisinau";
const MAX_TOOL_ROUNDS = 6;

let openai: OpenAI | undefined;

function client(): OpenAI {
  openai ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openai;
}

/** Streamed to the browser as server-sent events. */
export type AgentEvent =
  | { type: "status"; phase: "think" | "search" | "tools" | "clock" | "draft"; detail?: string }
  | { type: "token"; text: string }
  | { type: "citations"; citations: Citation[] };

type Emit = (event: AgentEvent) => void | Promise<void>;

const TOOLS: ChatCompletionFunctionTool[] = [
  {
    type: "function",
    function: {
      name: "semantic_search",
      description:
        "Search Chișinău municipal documents by meaning. Call with a focused query; retrieve a handful of passages (default 6).",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search query in the user's language or Romanian.",
          },
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 10,
            description: "How many passages to retrieve (default 6).",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_current_datetime",
      description:
        "Get the current date and time in Chișinău (Europe/Chisinau). Use whenever the question is time-aware: today/tomorrow/this week, schedules, planned outages, opening hours, deadlines, 'until when', 'is it open now', relative dates, or anything that depends on knowing what day/time it is.",
      parameters: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
    },
  },
];

const SYSTEM_PROMPT = `You are Smart City, the Chișinău municipal assistant. You help residents get things done: for every question, find (1) the direct answer, (2) the steps to achieve what they want, and (3) the institution they must go to, with its address and phone number.
Use ONLY facts from passages returned by semantic_search (plus get_current_datetime for time reasoning). Never invent a phone number, address, fee, deadline, law or step.
Always write in the same language as the user's latest message (Romanian, Russian, or English), even when the passages are in another language.

Searching:
- The documents are mostly in Romanian (some Russian). Write semantic_search queries in Romanian, as natural full questions (e.g. "Cum pot contacta DGAURF, care este numărul de telefon?"), not keyword lists.
- Include the full institution name next to any acronym (e.g. DGAURF — Direcția Generală Arhitectură, Urbanism și Relații Funciare).
- First search for the answer and the procedure. Then ALWAYS run a separate search for the responsible institution's contacts, e.g. "Care este adresa și numărul de telefon al <institution full name>?".
- If the user wants to obtain, apply for, register or request something (a permit, authorisation, certificate, contract, benefit, service), ALWAYS run a separate search for the documents it requires, e.g. "Ce acte sunt necesare pentru <procedure>?".
- If a search does not contain what you need, search again with other wording before concluding it is missing. Try at least two different queries per missing fact.

Time: you do not know the date unless you call get_current_datetime. Call it whenever the question depends on today, schedules, planned works, outages, office hours or deadlines.

Each passage shows its publication date ("Published: YYYY-MM-DD" or "Published: unknown"). Prefer the most recent passage when they differ, and mention dates when you report a contradiction.

When you have enough evidence, reply with the JSON answer (no more tool calls):
- status:
  - "found": the passages answer the question, and the institution's address and phone were found (or no institution is involved).
  - "partial": the main answer was found, but something the user needs is missing (phone, address, a step, a fee, a deadline). List each missing item in "missing".
  - "not_found": the passages do not answer the question. Say so plainly in "answer"; do not guess.
  - "contradiction": two passages disagree on a fact that matters for the answer (e.g. different phone numbers, addresses, fees, deadlines, hours). List every such case in "contradictions" with both claims and their [n]; do not silently pick one. Still fill the rest.
- answer: 1–3 sentences answering directly, with [n] markers inline. Do not repeat the documents, the steps or the contact details here; they are shown separately.
- needs_documents: true if doing what the user asks requires submitting or presenting documents (an application, a permit, a certificate, a contract, a benefit, registering something), even when no passage lists them; false otherwise.
- documents: every document the user must prepare or bring for the procedure (application form, copies of ID or deeds, certificates, plans, receipts), one per item. "text" names it in the user's language; "quote" copies its name exactly as written in the passage, in the passage's language (it is checked against the passage, and the item is dropped if it is not there); "refs" holds the [n] of that passage. Only documents for the exact procedure asked: a passage about a similar but different procedure (e.g. a permit to operate a paid car park vs. a building permit for one) does not count. Empty if the question is not about a procedure. If the user needs documents but no passage lists them, leave it empty and add "the list of required documents" to "missing".
- steps: the ordered, practical steps to achieve the user's goal (where to go, fees, deadlines), each with the [n] of its source in "refs". Do not repeat the documents list here; refer to it ("depuneți actele de mai sus"). Empty if the question is not about doing something.
- institution: the institution the user should contact, with every field taken verbatim from a passage (null for a field that is not in any passage) and the passages used in "refs". null if no institution is involved.
  Contact details must belong to THAT institution in the passage. Pages often list the contacts of a subdivision, directorate or another office (e.g. a transport directorate on a City Hall topic): never transfer them to a different institution. If the institution's own contacts are not in any passage, set those fields to null and list them in "missing".
- missing: what the user needs but no passage gives, in the user's language (e.g. "numărul de telefon al DGAURF"). Empty if nothing is missing.
- Cite only passages you actually used. Prefer 1–3 strong sources.`;

/** Cheap language guess for the reply; gpt-4o-mini drifts to the passages' language otherwise. */
function replyLanguage(text: string): string {
  if (/[а-яё]/i.test(text)) return "Russian";
  if (/[ăâîșşțţ]/i.test(text)) return "Romanian";
  if (/\b(the|what|where|how|who|when|which|is|can|do|does|i|my|and|or|of|to)\b/i.test(text)) return "English";
  return "the same language as the user's latest message";
}

function getCurrentDateTime(): string {
  const now = new Date();
  const fmt = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("en-GB", { timeZone: TIMEZONE, ...options }).format(now);

  const isoLocal = new Intl.DateTimeFormat("sv-SE", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(now);

  return [
    `timezone: ${TIMEZONE}`,
    `local_datetime: ${isoLocal.replace(" ", "T")}`,
    `weekday: ${fmt({ weekday: "long" })}`,
    `date: ${fmt({ year: "numeric", month: "long", day: "numeric" })}`,
    `time: ${fmt({ hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}`,
    `unix_ms: ${now.getTime()}`,
  ].join("\n");
}

function formatHitsForModel(hits: Hit[]): string {
  if (!hits.length) return "No passages found.";
  return hits
    .map((h) => `[${h.n}] ${h.title} (${h.site})\nURL: ${h.citeUrl || h.url}\nPublished: ${h.date ?? "unknown"}\n${h.text}`)
    .join("\n\n---\n\n");
}

async function runSemanticSearch(args: { query?: unknown; limit?: unknown }): Promise<Hit[]> {
  const query = String(args.query ?? "").trim();
  const limit = Math.min(10, Math.max(1, Number(args.limit) || 6));
  if (!query) return [];
  const res = await client().embeddings.create({ model: EMBED_MODEL, input: query });
  return searchChunks(res.data[0].embedding, limit);
}

// ---------- structured answer ----------

/** What the model returns once it has enough evidence (see SYSTEM_PROMPT). */
type StructuredAnswer = {
  status: AnswerStatus;
  answer: string;
  needs_documents: boolean;
  documents: { text: string; quote: string; refs: number[] }[];
  steps: { text: string; refs: number[] }[];
  institution: (Institution & { refs: number[] }) | null;
  missing: string[];
  contradictions: Contradiction[];
};

const nullableString = { type: ["string", "null"] };
const refs = { type: "array", items: { type: "integer" } };

const ANSWER_FORMAT = {
  type: "json_schema",
  json_schema: {
    name: "municipal_answer",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["status", "answer", "needs_documents", "documents", "steps", "institution", "missing", "contradictions"],
      properties: {
        status: { type: "string", enum: ["found", "partial", "not_found", "contradiction"] },
        answer: { type: "string" },
        needs_documents: { type: "boolean" },
        documents: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["text", "quote", "refs"],
            properties: { text: { type: "string" }, quote: { type: "string" }, refs },
          },
        },
        steps: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["text", "refs"],
            properties: { text: { type: "string" }, refs },
          },
        },
        institution: {
          anyOf: [
            {
              type: "object",
              additionalProperties: false,
              required: ["name", "address", "phone", "email", "website", "hours", "refs"],
              properties: {
                name: { type: "string" },
                address: nullableString,
                phone: nullableString,
                email: nullableString,
                website: nullableString,
                hours: nullableString,
                refs,
              },
            },
            { type: "null" },
          ],
        },
        missing: { type: "array", items: { type: "string" } },
        contradictions: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["topic", "claims"],
            properties: {
              topic: { type: "string" },
              claims: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["text", "ref"],
                  properties: { text: { type: "string" }, ref: { type: "integer" } },
                },
              },
            },
          },
        },
      },
    },
  },
} as const;

function parseAnswer(content: string | null | undefined): StructuredAnswer | null {
  try {
    const parsed = JSON.parse(content ?? "") as StructuredAnswer;
    if (typeof parsed?.answer !== "string" || typeof parsed?.status !== "string") return null;
    const documents = Array.isArray(parsed.documents) ? parsed.documents : [];
    return { ...parsed, documents, needs_documents: Boolean(parsed.needs_documents) || documents.length > 0 };
  } catch {
    return null;
  }
}

const digits = (s: string) => s.replace(/\D/g, "");
/** A phone number's digits without the country prefix or leading 0, as passages vary. */
const phoneKey = (s: string) => digits(s).replace(/^(00)?373/, "").replace(/^0/, "");

// Moldovan phone numbers as written in text: +373 22 228 110, (022) 20-46-90,
// 069 123 456. Only spaces and dashes as separators, so dates (02.04.2021) never match.
const PHONE_IN_TEXT = /(?<!\d)(?<!\d\.)(?:\+?373[\s-]?|\(?0)\(?\d{2}\)?[\s-]?\d{2,3}[\s-]?\d{2,3}(?:[\s-]?\d{2})?(?!\d)(?!\.\d)/g;
const EMAIL_IN_TEXT = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;

const NOT_IN_DOCS: Record<string, string> = {
  Romanian: "[nu apare în documente]",
  Russian: "[нет в документах]",
  English: "[not in the documents]",
};

/**
 * Replaces phone numbers and emails the passages don't contain, so a number
 * the model made up never reaches the resident. Returns how many were replaced.
 */
function groundText(text: string, hits: Hit[], lang: string): { text: string; replaced: number } {
  const corpus = hits.map((h) => h.text).join("\n");
  const corpusDigits = digits(corpus);
  const corpusLower = corpus.toLowerCase();
  const mark = NOT_IN_DOCS[lang] ?? NOT_IN_DOCS.Romanian;
  let replaced = 0;
  const out = text
    .replace(PHONE_IN_TEXT, (m) => (corpusDigits.includes(phoneKey(m)) ? m : (replaced++, mark)))
    .replace(EMAIL_IN_TEXT, (m) => (corpusLower.includes(m.toLowerCase()) ? m : (replaced++, mark)));
  return { text: out, replaced };
}

/** Contact values that were rejected, so the text can't repeat them either. */
type Rejected = { phones: string[]; emails: string[]; streets: string[] };

/** The street part of an address ("Str. Serghei Lazo, 18, MD-2004" -> "serghei lazo"). */
function streetOf(address: string): string | null {
  const words = fold(address)
    .replace(/md-?\d{4}/g, " ")
    .split(/[^a-z]+/)
    .filter((w) => w.length >= 3 && !/^(str|strada|bd|bulevardul|bdul|mun|municipiul|chisinau|republica|moldova|nr|sect|sectorul|or|orasul)$/.test(w));
  return words.length ? words.slice(0, 3).join(" ") : null;
}

/**
 * Checks the institution card against the passages. Its contacts must come
 * from passages that name this institution (not a subdivision's contact
 * block), and a phone or email must literally appear in them. Anything else
 * is removed and returned as rejected.
 */
function groundInstitution(
  inst: StructuredAnswer["institution"],
  hits: Hit[],
): { institution: StructuredAnswer["institution"]; rejected: Rejected } {
  const rejected: Rejected = { phones: [], emails: [], streets: [] };
  if (!inst) return { institution: null, rejected };

  const cited = hits.filter((h) => inst.refs.includes(h.n));
  if (!cited.length || !namedIn(inst.name, cited.map((h) => `${h.title}\n${h.text}`).join("\n"))) {
    if (inst.phone) rejected.phones.push(inst.phone);
    if (inst.email) rejected.emails.push(inst.email);
    const street = inst.address && streetOf(inst.address);
    if (street) rejected.streets.push(street);
    return {
      institution: { ...inst, address: null, phone: null, email: null, hours: null, website: null, refs: [] },
      rejected,
    };
  }

  const corpus = hits.map((h) => h.text).join("\n");
  const corpusDigits = digits(corpus);
  const corpusLower = corpus.toLowerCase();
  let { phone, email, address } = inst;

  // An address needs its street (and house number) in a passage; a bare city name is no address.
  if (address) {
    const street = streetOf(address);
    if (!street || !addressIn(address, street, fold(corpus))) {
      if (street) rejected.streets.push(street);
      address = null;
    }
  }

  if (phone) {
    // Compare without the country prefix, which passages write in many ways.
    const d = phoneKey(phone);
    if (d.length < 6 || !corpusDigits.includes(d)) {
      rejected.phones.push(phone);
      phone = null;
    }
  }
  if (email && !corpusLower.includes(email.toLowerCase())) {
    rejected.emails.push(email);
    email = null;
  }
  let { website } = inst;
  const host = website?.match(/(?:https?:\/\/)?(?:www\.)?([^/\s]+)/i)?.[1]?.toLowerCase();
  if (website && (!host || !corpusLower.includes(host))) website = null;
  return { institution: { ...inst, phone, email, address, website }, rejected };
}

/** Whether the passages contain this street, with the house number right after it. */
function addressIn(address: string, street: string, foldedCorpus: string): boolean {
  const first = street.split(" ")[0];
  const number = fold(address)
    .replace(/md-?\d{4}/g, " ")
    .match(/\b\d+[a-z]?\b/)?.[0];
  let at = foldedCorpus.indexOf(first);
  while (at >= 0) {
    // Start a little early: street names can open with a number ("27 Martie 1918").
    const around = foldedCorpus.slice(Math.max(0, at - 12), at + street.length + 40);
    if (around.includes(street) && (!number || new RegExp(`\\b${number}\\b`).test(around))) return true;
    at = foldedCorpus.indexOf(first, at + 1);
  }
  return false;
}

/** Whether a sentence repeats a rejected contact. */
function repeatsRejected(sentence: string, rejected: Rejected): boolean {
  const d = digits(sentence);
  const folded = fold(sentence);
  return (
    rejected.phones.some((p) => phoneKey(p).length >= 6 && d.includes(phoneKey(p))) ||
    rejected.emails.some((e) => sentence.toLowerCase().includes(e.toLowerCase())) ||
    rejected.streets.some((st) => folded.includes(st))
  );
}

// Abbreviations that end with a dot inside a sentence (addresses, phone lines).
const ABBREVIATION = /(?:^|\s)(?:str|bd|bdul|nr|mun|or|sect|tel|ș|s|d|dl|dna|ex|etc|al|ap|of|ул|д|тел|пр|г)\.$/i;

/** Splits text into sentences, without breaking after "str.", "nr.", "tel." and the like. */
function sentences(text: string): string[] {
  const parts = text.split(/(?<=[.!?])\s+/);
  const out: string[] = [];
  for (const part of parts) {
    if (out.length && ABBREVIATION.test(out[out.length - 1])) out[out.length - 1] += ` ${part}`;
    else out.push(part);
  }
  return out;
}

/** Removes the sentences that repeat a rejected contact. */
function withoutRejected(text: string, rejected: Rejected): string {
  return sentences(text)
    .filter((sentence) => !repeatsRejected(sentence, rejected))
    .join(" ")
    .trim();
}

const NO_CONTACTS: Record<string, (name: string) => string> = {
  Romanian: (name) => `Documentele disponibile nu conțin toate datele de contact pentru ${name}. Mai jos este ce am găsit.`,
  Russian: (name) => `В доступных документах есть не все контактные данные: ${name}. Ниже — то, что удалось найти.`,
  English: (name) => `The available documents don't give all the contact details for ${name}. What they do give is below.`,
};

const fold = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ş/g, "s")
    .replace(/ţ/g, "t");

const plainWords = (s: string) =>
  fold(s)
    .replace(/[^a-z0-9а-яё]+/g, " ")
    .trim();

/**
 * Keeps only the documents whose quoted name is in a passage they cite. The
 * model tends to borrow a list from a neighbouring procedure (buying the land
 * instead of the building permit); a document the passage doesn't name is
 * dropped. Returns how many were dropped.
 */
function groundDocuments(docs: StructuredAnswer["documents"], hits: Hit[]) {
  const kept = docs.filter((d) => {
    const quote = plainWords(d.quote || "");
    if (quote.length < 4) return false;
    const cited = hits.filter((h) => d.refs.includes(h.n));
    return cited.some((h) => plainWords(h.text).includes(quote));
  });
  return { documents: kept, dropped: docs.length - kept.length };
}

/** Words too common to identify an institution on their own. */
const GENERIC = new Set(
  "directia generala municipal municipiul municipiului chisinau chisinaului pentru si din de la al a ale institutia publica publice serviciul sectia departamentul oficiul centrul centru agentia intreprinderea municipala m dir gen".split(" "),
);

/**
 * Whether a passage names this institution: its acronym (e.g. DGAURF), or
 * most of its distinctive words. "Primăria Chișinău" is not named by a
 * transport directorate's contact block, even though "Chișinău" appears.
 */
function namedIn(name: string, text: string): boolean {
  const hay = fold(text);
  const acronyms = name.match(/\b[A-ZĂÂÎȘȚ]{3,}\b/g) ?? [];
  if (acronyms.some((a) => hay.includes(fold(a)))) return true;
  const words = fold(name)
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 4);
  const distinctive = words.filter((w) => !GENERIC.has(w) && !/^primari/.test(w));
  // Only generic words ("Primăria Chișinău"): the passage must say "primări..." itself.
  if (!distinctive.length) return words.every((w) => hay.includes(w.slice(0, 6)));
  const found = distinctive.filter((w) => hay.includes(w.slice(0, 6))).length;
  return found >= Math.ceil(distinctive.length / 2);
}

/** The best text to find the institution on the map: website, then address, then name. */
function mapQuery(inst: Institution): string | null {
  const host = inst.website?.match(/(?:https?:\/\/)?(?:www\.)?([a-z0-9.-]+\.[a-z]{2,})/i)?.[1];
  if (host) return host;
  if (inst.address) return /chi[sș]in[aă]u|кишин/i.test(inst.address) ? inst.address : `${inst.address}, Chișinău`;
  return inst.name || null;
}

type Field = "address" | "phone";
/** Missing-item labels in the reply's language (the model writes the others). */
const FIELD_LABEL: Record<string, Record<Field | "documents", string>> = {
  Romanian: { address: "adresa", phone: "numărul de telefon", documents: "lista actelor necesare" },
  Russian: { address: "адрес", phone: "номер телефона", documents: "список необходимых документов" },
  English: { address: "address", phone: "phone number", documents: "the list of required documents" },
};
const DOCS_WORD = /acte|document|документ/i;
/** Whether a missing item already talks about this field, in any language. */
const FIELD_WORD: Record<Field, RegExp> = { address: /adres|address|адрес/i, phone: /tel|phone|телефон/i };

/** Turns the model's structured answer into saved blocks and citations. */
function toContent(answer: StructuredAnswer, hits: Hit[], lang: string): AssistantContent {
  const labels = FIELD_LABEL[lang] ?? FIELD_LABEL.Romanian;
  const known = new Set(hits.map((h) => h.n));
  const clean = (list: number[] | undefined) => [...new Set((list ?? []).filter((n) => known.has(n)))];

  const { institution, rejected } = groundInstitution(answer.institution, hits);
  const anyRejected = rejected.phones.length + rejected.emails.length + rejected.streets.length > 0;
  // Contacts rejected from the card must not survive in the text either.
  if (anyRejected) {
    const text = withoutRejected(answer.answer, rejected);
    answer = {
      ...answer,
      answer: text || (NO_CONTACTS[lang] ?? NO_CONTACTS.Romanian)(institution?.name ?? ""),
      documents: answer.documents.filter((d) => !repeatsRejected(d.text, rejected)),
      steps: answer.steps.filter((st) => !repeatsRejected(st.text, rejected)),
    };
  }
  // Contacts written in the text get the same check as the contact card.
  let unbacked = 0;
  const grounded = (t: string) => {
    const g = groundText(t, hits, lang);
    unbacked += g.replaced;
    return g.text;
  };
  answer = {
    ...answer,
    answer: grounded(answer.answer),
    documents: answer.documents.map((d) => ({ ...d, text: grounded(d.text) })),
    steps: answer.steps.map((st) => ({ ...st, text: grounded(st.text) })),
    contradictions: answer.contradictions.map((c) => ({
      ...c,
      claims: c.claims.map((cl) => ({ ...cl, text: grounded(cl.text) })),
    })),
  };
  const { documents: groundedDocs, dropped: droppedDocs } = groundDocuments(answer.documents, hits);
  answer = { ...answer, documents: groundedDocs };
  const missing = [...answer.missing];
  // The model gave a list, but none of it is in the passages: say the list is missing.
  if ((droppedDocs || answer.needs_documents) && !groundedDocs.length && !missing.some((m) => DOCS_WORD.test(m)))
    missing.push(labels.documents);
  // The resident always needs the address and phone of where to go; any the
  // passages don't back (or that the model dropped) is listed as missing.
  if (institution?.name) {
    for (const field of ["address", "phone"] as const) {
      if (!institution[field] && !missing.some((m) => FIELD_WORD[field].test(m)))
        missing.push(`${institution.name}: ${labels[field]}`);
    }
    if (rejected.emails.length) missing.push(`${institution.name}: e-mail`);
  }

  const contradictions = answer.contradictions
    .map((c) => ({ topic: c.topic, claims: c.claims.filter((cl) => known.has(cl.ref)) }))
    .filter((c) => c.claims.length >= 2);

  let status: AnswerStatus = answer.status;
  if (status === "contradiction" && !contradictions.length) status = missing.length ? "partial" : "found";
  if (status === "found" && (missing.length || unbacked || droppedDocs)) status = "partial";

  const blocks: Block[] = [{ type: "status", status, missing, contradictions }];
  // The documents to prepare come first and stand out: they are what people most often get wrong.
  // Shown whenever the procedure needs documents, even with an empty list, so
  // the resident always knows to ask for it before going.
  const documents = answer.documents.filter((d) => d.text.trim());
  if (documents.length || answer.needs_documents || droppedDocs)
    blocks.push({ type: "documents", items: documents.map((d) => d.text), itemRefs: documents.map((d) => clean(d.refs)) });
  const steps = answer.steps.filter((st) => st.text.trim());
  if (steps.length)
    blocks.push({ type: "steps", items: steps.map((st) => st.text), itemRefs: steps.map((st) => clean(st.refs)) });
  if (institution?.name) {
    const { refs: instRefs, ...fields } = institution;
    blocks.push({ type: "institution", ...fields, refs: clean(instRefs) });
    const query = mapQuery(institution);
    if (query) blocks.push({ type: "places", query, title: institution.name });
  }

  // Every source the answer leans on, wherever it is cited.
  const used = new Set<number>([
    ...[...answer.answer.matchAll(/\[(\d+)\]/g)].map((m) => Number(m[1])),
    ...documents.flatMap((d) => d.refs),
    ...steps.flatMap((st) => st.refs),
    ...(institution?.refs ?? []),
    ...contradictions.flatMap((c) => c.claims.map((cl) => cl.ref)),
  ]);
  const citations = hitsToCitations(hits.filter((h) => used.has(h.n)));
  // Nothing backed by a source: the documents don't answer this.
  const head = blocks[0];
  if (!citations.length && head.type === "status" && head.status !== "not_found") head.status = "not_found";
  return { text: answer.answer.trim(), blocks, citations, actions: [] };
}

/** Plays an already complete answer as a token stream, so the UI types it out. */
async function emitAnswerTokens(text: string, emit: Emit) {
  await emit({ type: "status", phase: "draft" });
  const step = 16;
  for (let i = 0; i < text.length; i += step) {
    await emit({ type: "token", text: text.slice(i, i + step) });
    await new Promise((r) => setTimeout(r, 12));
  }
}

/** One last structured answer with tools off, when the loop ends without one. */
async function forceAnswer(messages: ChatCompletionMessageParam[]): Promise<StructuredAnswer | null> {
  const completion = await client().chat.completions.create({
    model: CHAT_MODEL,
    messages,
    tools: TOOLS,
    tool_choice: "none",
    response_format: ANSWER_FORMAT,
  });
  return parseAnswer(completion.choices[0].message.content);
}

function historyToMessages(history: Message[]): ChatCompletionMessageParam[] {
  return history.map((m): ChatCompletionMessageParam =>
    m.role === "user" ? { role: "user", content: m.text || "" } : { role: "assistant", content: messagePlainText(m) },
  );
}

/** Replays a scripted demo answer through the same events and checks as a live one. */
async function runDemoScript(script: DemoScript, lang: string, emit: Emit): Promise<AssistantContent> {
  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
  await emit({ type: "status", phase: "think", detail: "round 1" });
  await wait(1400);
  if (script.clock) {
    await emit({ type: "status", phase: "clock" });
    await wait(900);
  }
  for (const query of script.queries) {
    await emit({ type: "status", phase: "search", detail: query });
    await wait(1500);
  }
  await emit({ type: "status", phase: "tools", detail: "round 3" });
  await wait(900);

  const variant = lang === "Russian" && script.ru ? script.ru : script;
  const content = toContent(variant.answer, script.hits, lang);
  if (variant.actions) content.actions = variant.actions;
  const [status, ...rest] = content.blocks;
  content.blocks = [
    status,
    ...script.flags,
    ...rest.map((b) => (b.type === "places" && script.placesQuery ? { ...b, query: script.placesQuery } : b)),
  ];

  await emit({ type: "status", phase: "draft" });
  for (let i = 0; i < content.text.length; i += 6) {
    await emit({ type: "token", text: content.text.slice(i, i + 6) });
    await wait(18);
  }
  await emit({ type: "citations", citations: content.citations });
  return content;
}

/**
 * Agent loop: the model searches until it returns a structured answer (or the
 * round cap is hit). Emits status, token and citations events on the way.
 */
export async function runChatAgent({
  history,
  userText,
  emit,
}: {
  history: Message[];
  userText: string;
  emit: Emit;
}): Promise<AssistantContent> {
  const demo = findDemoScript(userText);
  if (demo) return runDemoScript(demo, replyLanguage(userText), emit);

  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...historyToMessages(history),
    { role: "user", content: userText },
    { role: "system", content: `Reply in ${replyLanguage(userText)}.` },
  ];

  const gatheredHits: Hit[] = [];
  let answer: StructuredAnswer | null = null;

  for (let round = 1; round <= MAX_TOOL_ROUNDS && !answer; round += 1) {
    await emit({ type: "status", phase: round > 1 && gatheredHits.length ? "tools" : "think", detail: `round ${round}` });

    const completion = await client().chat.completions.create({
      model: CHAT_MODEL,
      messages,
      tools: TOOLS,
      tool_choice: "auto",
      response_format: ANSWER_FORMAT,
    });

    const msg = completion.choices[0].message;
    const toolCalls = (msg.tool_calls ?? []).filter((call) => call.type === "function");
    messages.push({
      role: "assistant",
      content: msg.content ?? null,
      ...(toolCalls.length ? { tool_calls: toolCalls } : {}),
    });

    // No tool calls: the model has its final answer.
    if (!toolCalls.length) {
      answer = parseAnswer(msg.content) ?? (await forceAnswer(messages));
      break;
    }

    // Fulfil every tool call, then loop so the model can search again or answer.
    const needsSearch = toolCalls.some((c) => c.function.name === "semantic_search");
    await emit({ type: "status", phase: needsSearch ? "search" : "clock" });

    for (const call of toolCalls) {
      let args: { query?: unknown; limit?: unknown } = {};
      try {
        args = JSON.parse(call.function.arguments || "{}");
      } catch {}

      let toolText: string;
      if (call.function.name === "semantic_search") {
        await emit({ type: "status", phase: "search", detail: String(args.query ?? "") });
        const hits = await runSemanticSearch(args);
        // Number hits across all searches, so [n] stays stable for the whole answer.
        for (const hit of hits) {
          if (!gatheredHits.some((h) => h.id === hit.id)) gatheredHits.push({ ...hit, n: gatheredHits.length + 1 });
        }
        toolText = formatHitsForModel(
          hits.map((h) => ({ ...h, n: gatheredHits.find((g) => g.id === h.id)?.n ?? h.n })),
        );
      } else if (call.function.name === "get_current_datetime") {
        await emit({ type: "status", phase: "clock" });
        toolText = getCurrentDateTime();
      } else {
        toolText = `Unknown tool: ${call.function.name}`;
      }

      messages.push({ role: "tool", tool_call_id: call.id, content: toolText });
    }
  }

  // Round cap reached while still searching: answer from what was found.
  answer ??= await forceAnswer(messages);

  if (!answer) {
    const lang = replyLanguage(userText);
    const text =
      lang === "Russian"
        ? "Не удалось завершить поиск. Попробуйте переформулировать вопрос."
        : lang === "English"
          ? "I could not finish the search. Try rephrasing your question."
          : "Nu am putut finaliza căutarea. Reformulați întrebarea.";
    answer = {
      status: "not_found",
      answer: text,
      needs_documents: false,
      documents: [],
      steps: [],
      institution: null,
      missing: [],
      contradictions: [],
    };
  }

  const content = toContent(answer, gatheredHits, replyLanguage(userText));
  await emitAnswerTokens(content.text, emit);
  await emit({ type: "citations", citations: content.citations });
  return content;
}
