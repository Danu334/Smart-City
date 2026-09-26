import type { NextApiRequest, NextApiResponse } from "next";
import { currentUserId } from "@/lib/chat/user";
import { listConversations } from "@/lib/chat/store";

/** The signed-in user's conversations, newest first, without messages; none for visitors. */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const userId = await currentUserId(req);
    res.setHeader("Cache-Control", "private, no-store");
    res.status(200).json({ conversations: userId ? await listConversations(userId) : [] });
  } catch (err) {
    console.error("[api/conversations]", err);
    res.status(500).json({ error: "Failed to list conversations" });
  }
}
