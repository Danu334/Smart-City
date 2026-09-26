import type { AssistantMessage, Message } from "@/types/chat";

// Plain-text version of a message, for the model's conversation history (so a
// follow-up like "and their email?" sees the steps and contacts given before).

export function assistantPlainText(m: Pick<AssistantMessage, "text" | "blocks">): string {
  const parts: string[] = [];
  if (m.text) parts.push(m.text);
  for (const b of m.blocks ?? []) {
    if (b.type === "steps") parts.push(b.items.map((item, i) => `${i + 1}. ${item}`).join("\n"));
    else if (b.type === "institution")
      parts.push(
        [b.name, b.address, b.phone && `tel. ${b.phone}`, b.email, b.website, b.hours].filter(Boolean).join(" · "),
      );
    else if (b.type === "status" && b.missing?.length) parts.push(`(not found: ${b.missing.join("; ")})`);
    else if (!m.text && "text" in b && b.text) parts.push(b.text);
  }
  return parts.join("\n\n");
}

export function messagePlainText(m: Message): string {
  return m.role === "user" ? m.text : assistantPlainText(m);
}
