import type { NextApiRequest, NextApiResponse } from "next";
import { currentUserId } from "@/lib/chat/user";
import { importConversations, listConversations } from "@/lib/chat/store";

// GET: the signed-in user's conversations, newest first, without messages;
// none for visitors (their chat is not stored).
// POST: saves the conversations a visitor had just before signing in.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const userId = await currentUserId(req);
    res.setHeader("Cache-Control", "private, no-store");

    if (req.method === "GET") {
      return res.status(200).json({ conversations: userId ? await listConversations(userId) : [] });
    }

    if (!userId) return res.status(401).json({ error: "AUTH_REQUIRED" });
    const { conversations, locale } = (req.body ?? {}) as { conversations?: unknown; locale?: unknown };
    const saved = await importConversations(userId, conversations, typeof locale === "string" ? locale : "ro");
    res.status(200).json({ saved });
  } catch (err) {
    console.error("[api/conversations]", err);
    res.status(500).json({ error: "Failed to handle conversations" });
  }
}
