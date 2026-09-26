import type { Citation } from "@/types/chat";
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
      published: hit.date,
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
