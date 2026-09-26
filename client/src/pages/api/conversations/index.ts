import type { NextApiRequest, NextApiResponse } from "next";
import { resolveOwner } from "@/lib/chat/owner";
import { listConversations } from "@/lib/chat/store";

/** The visitor's (or account's) conversations, newest first, without messages. */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const owner = await resolveOwner(req, res, { create: false });
    res.setHeader("Cache-Control", "private, no-store");
    res.status(200).json({ conversations: owner ? await listConversations(owner) : [] });
  } catch (err) {
    console.error("[api/conversations]", err);
    res.status(500).json({ error: "Failed to list conversations" });
  }
}
