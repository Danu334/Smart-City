import { QdrantClient } from "@qdrant/js-client-rest";

let client: QdrantClient | undefined;

function qdrant(): QdrantClient {
  client ??= new QdrantClient({
    url: process.env.QDRANT_API_URL,
    apiKey: process.env.QDRANT_API_KEY,
    checkCompatibility: false,
  });
  return client;
}

function collectionName(): string {
  return process.env.QDRANT_COLLECTION || "smart_city_chunks";
}

/** A passage from the municipal corpus; `n` is its citation number. */
export type Hit = {
  n: number;
  score: number;
  id: string;
  docId: string;
  site: string;
  url: string;
  citeUrl: string;
  title: string;
  type: string;
  date: string | null;
  text: string;
};

type Payload = Partial<{
  id: string;
  doc_id: string;
  site: string;
  url: string;
  cite_url: string;
  title: string;
  type: string;
  date: string;
  text: string;
}>;

/**
 * The passage's publication date, or null when it is not trustworthy. Many
 * pages were indexed with January 1st of a year (often the crawl year, from a
 * "© 2026" footer), which is a placeholder, not a publication date.
 */
function publicationDate(raw: unknown): string | null {
  if (typeof raw !== "string" || !/^\d{4}-\d{2}-\d{2}/.test(raw)) return null;
  const day = raw.slice(0, 10);
  if (day.endsWith("-01-01")) return null;
  if (day > new Date().toISOString().slice(0, 10)) return null;
  return day;
}

/** Semantic search over municipal chunks. */
export async function searchChunks(vector: number[], limit = 6): Promise<Hit[]> {
  // Over-fetch: the same page is often indexed under several URLs, and those
  // identical chunks would otherwise crowd out distinct passages.
  const result = await qdrant().query(collectionName(), {
    query: vector,
    limit: Math.min(limit * 3, 30),
    with_payload: true,
  });

  const seen = new Set<string>();
  const points = (result.points ?? []).filter((point) => {
    const payload = (point.payload ?? {}) as Payload;
    const key = String(payload.text ?? point.id).replace(/\s+/g, " ").trim().slice(0, 300);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return points.slice(0, limit).map((point, i) => {
    const p = (point.payload ?? {}) as Payload;
    return {
      n: i + 1,
      score: point.score,
      id: p.id ?? String(point.id),
      docId: p.doc_id ?? p.id ?? String(point.id),
      site: p.site ?? "",
      url: p.url ?? p.cite_url ?? "",
      citeUrl: p.cite_url ?? p.url ?? "",
      title: p.title || p.site || "Municipal document",
      type: p.type ?? "html",
      date: publicationDate(p.date),
      text: p.text ?? "",
    };
  });
}
