import type { NextApiRequest, NextApiResponse } from "next";
import { currentUserId } from "@/lib/chat/user";
import { deleteConversation, getConversation } from "@/lib/chat/store";

/** GET: one conversation with its messages; DELETE: removes it. Only the signed-in owner can do either. */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET" && req.method !== "DELETE") {
    res.setHeader("Allow", "GET, DELETE");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id } = req.query;
  if (typeof id !== "string" || !id) return res.status(400).json({ error: "id required" });

  try {
    const userId = await currentUserId(req);
    if (req.method === "DELETE") {
      if (!userId) return res.status(401).json({ error: "AUTH_REQUIRED" });
      if (!(await deleteConversation(userId, id))) return res.status(404).json({ error: "Not found" });
      return res.status(204).end();
    }
    const conversation = userId ? await getConversation(userId, id) : null;
    if (!conversation) return res.status(404).json({ error: "Not found" });
    res.setHeader("Cache-Control", "private, no-store");
    res.status(200).json({ conversation });
  } catch (err) {
    console.error("[api/conversations/[id]]", err);
    res.status(500).json({ error: "Failed to handle conversation" });
  }
}
