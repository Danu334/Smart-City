import type { Block, Citation } from "@/types/chat";
import type { Hit } from "@/lib/chat/qdrant";

// Shared formatting helpers for chat answers and citations.

/** Citations carry their passage as a one-section doc, so the reader can open it. */
export function hitsToCitations(hits: Hit[]): Citation[] {
  return hits.map((hit) => ({
    n: hit.n,
    docId: `qdrant:${hit.id}`,
    sectionId: "passage",
    quote: (hit.text || "").slice(0, 280),
    doc: {
      id: `qdrant:${hit.id}`,
      title: hit.title,
      issuer: hit.site,
      reference: hit.url || hit.citeUrl,
      sourceUrl: hit.citeUrl || hit.url,
      kind: hit.type === "pdf" || hit.type === "docx" ? "law" : "guide",
      fidelity: "partial",
      retrieved: new Date().toISOString().slice(0, 10),
      sections: [
        {
          id: "passage",
          heading: hit.title,
          paragraphs: hit.text ? [hit.text] : ["(empty passage)"],
        },
      ],
    },
  }));
}

/**
 * Parse assistant text into UI blocks with citation refs.
 * Splits on blank lines; extracts [n] markers into `refs`.
 */
export function textToBlocks(text: string): Block[] {
  const cleaned = (text || "").trim();
  if (!cleaned) return [{ type: "p", text: "—" }];

  return cleaned.split(/\n{2,}/).map((para) => {
    const refs: number[] = [];
    const without = para
      .replace(/\[(\d+)\]/g, (_, n: string) => {
        const num = Number(n);
        if (!refs.includes(num)) refs.push(num);
        return "";
      })
      .replace(/[ \t]+\n/g, "\n")
      .replace(/[ \t]{2,}/g, " ")
      .trim();

    return {
      type: "p",
      text: without || para.trim(),
      ...(refs.length ? { refs } : {}),
    };
  });
}
