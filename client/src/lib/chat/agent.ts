import OpenAI from "openai";
import type {
  ChatCompletionFunctionTool,
  ChatCompletionMessageParam,
} from "openai/resources/chat/completions";
import { searchChunks, type Hit } from "@/lib/chat/qdrant";
import { hitsToCitations, textToBlocks } from "@/lib/chat/format";
import type { AssistantContent } from "@/lib/chat/store";
import type { Citation, Message } from "@/types/chat";

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

const SYSTEM_PROMPT = `You are Smart City, the Chișinău municipal assistant.
Answer ONLY from passages returned by the semantic_search tool (plus get_current_datetime when needed for time reasoning). If the tool finds nothing useful, say so plainly and suggest who to contact at City Hall.
Always reply in the same language as the user's latest message (Romanian, Russian, or English). Do not switch languages, even when the passages are in another language.

Searching:
- The documents are mostly in Romanian (some Russian). Write semantic_search queries in Romanian, whatever language the user writes in; translate the user's question first. Phrase queries as natural full questions (e.g. "Cum pot contacta DGAURF, care este numărul de telefon?"), not keyword lists.
- Include the full institution name next to any acronym (e.g. DGAURF — Direcția Generală Arhitectură, Urbanism și Relații Funciare).
- If the first search does not contain the answer, search again with different wording (synonyms, broader or narrower terms) before concluding the information is missing. Try at least two different queries.

Time awareness:
- You do NOT know the current date/time unless you call get_current_datetime.
- Call get_current_datetime whenever the user's question depends on "now", today, tomorrow, this week/month, schedules, planned works, outages, office hours, deadlines, or relative dates.
- Use that clock reading to interpret search results (e.g. which planned disconnection applies today).
- Do not invent or guess the current date or time.

Citations — be selective:
- Prefer 1–3 sources that directly answer the question. Never dump every search hit.
- Cite a passage with [n] only if you actually used a concrete fact from it.
- Ignore weak, tangentially related, or duplicate passages (same page / same phone number repeated).
- If one strong passage is enough, cite only that one.
- Do not list sources at the end; put [n] markers inline next to the claim they support.

Be concise and practical. Do not invent laws, fees, or contacts.
You may call tools more than once (refine searches, or check the clock then search). When you have enough evidence, answer in plain text with no further tool calls.`;

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
    .map((h) => `[${h.n}] ${h.title} (${h.site})\nURL: ${h.citeUrl || h.url}\n${h.text}`)
    .join("\n\n---\n\n");
}

async function runSemanticSearch(args: { query?: unknown; limit?: unknown }): Promise<Hit[]> {
  const query = String(args.query ?? "").trim();
  const limit = Math.min(10, Math.max(1, Number(args.limit) || 6));
  if (!query) return [];
  const res = await client().embeddings.create({ model: EMBED_MODEL, input: query });
  return searchChunks(res.data[0].embedding, limit);
}

/** Keep only citations whose [n] markers appear in the answer text. */
function citationsUsedInAnswer(answer: string, hits: Hit[]): Citation[] {
  const used = new Set([...String(answer || "").matchAll(/\[(\d+)\]/g)].map((m) => Number(m[1])));
  // Model forgot markers: keep at most the top hit so the UI isn't empty or spammy.
  if (!used.size) return hitsToCitations(hits.slice(0, 1));
  return hitsToCitations(hits.filter((h) => used.has(h.n)));
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

/** Last-resort streamed completion with tools disabled. */
async function streamFinalAnswer(messages: ChatCompletionMessageParam[], emit: Emit): Promise<string> {
  await emit({ type: "status", phase: "draft" });
  const stream = await client().chat.completions.create({
    model: CHAT_MODEL,
    messages,
    tools: TOOLS,
    tool_choice: "none",
    stream: true,
  });

  let full = "";
  for await (const part of stream) {
    const delta = part.choices[0]?.delta?.content || "";
    if (!delta) continue;
    full += delta;
    await emit({ type: "token", text: delta });
  }
  return full;
}

function historyToMessages(history: Message[]): ChatCompletionMessageParam[] {
  return history.map((m): ChatCompletionMessageParam => {
    if (m.role === "user") return { role: "user", content: m.text || "" };
    const text = m.text || m.blocks.map((b) => ("text" in b ? b.text : "")).filter(Boolean).join("\n\n");
    return { role: "assistant", content: text };
  });
}

/**
 * Agent loop: the model calls tools until it answers in plain text (or the
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
  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...historyToMessages(history),
    { role: "user", content: userText },
    { role: "system", content: `Reply in ${replyLanguage(userText)}.` },
  ];

  const gatheredHits: Hit[] = [];

  for (let round = 1; round <= MAX_TOOL_ROUNDS; round += 1) {
    await emit({ type: "status", phase: round > 1 && gatheredHits.length ? "tools" : "think", detail: `round ${round}` });

    const completion = await client().chat.completions.create({
      model: CHAT_MODEL,
      messages,
      tools: TOOLS,
      tool_choice: "auto",
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
      let full = (msg.content || "").trim();
      if (full) await emitAnswerTokens(full, emit);
      else full = await streamFinalAnswer(messages, emit);

      const citations = citationsUsedInAnswer(full, gatheredHits);
      await emit({ type: "citations", citations });
      return { text: full, blocks: textToBlocks(full), citations, actions: [] };
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

  const lang = replyLanguage(userText);
  const fallback =
    lang === "Russian"
      ? "Не удалось завершить поиск. Попробуйте переформулировать вопрос."
      : lang === "English"
        ? "I could not finish the search. Try rephrasing your question."
        : "Nu am putut finaliza căutarea. Reformulați întrebarea.";

  await emit({ type: "token", text: fallback });
  const citations = citationsUsedInAnswer(fallback, gatheredHits);
  await emit({ type: "citations", citations });
  return { text: fallback, blocks: textToBlocks(fallback), citations, actions: [] };
}
