import type { NextApiRequest, NextApiResponse } from "next";
import { currentUserId } from "@/lib/chat/user";
import { getConversation } from "@/lib/chat/store";

/** One conversation with its messages, if it belongs to the signed-in user. */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id } = req.query;
  if (typeof id !== "string" || !id) return res.status(400).json({ error: "id required" });

  try {
    const userId = await currentUserId(req);
    const conversation = userId ? await getConversation(userId, id) : null;
    if (!conversation) return res.status(404).json({ error: "Not found" });
    res.setHeader("Cache-Control", "private, no-store");
    res.status(200).json({ conversation });
  } catch (err) {
    console.error("[api/conversations/[id]]", err);
    res.status(500).json({ error: "Failed to load conversation" });
  }
}
