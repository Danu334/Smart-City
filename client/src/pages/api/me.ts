import type { NextApiRequest, NextApiResponse } from "next";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "@/lib/auth";
import { isFeedbackAdmin } from "@/lib/chat/feedback";

/** What the signed-in user may see beyond the chat (the nav asks). */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    res.setHeader("Cache-Control", "private, no-store");
    res.status(200).json({ feedbackAdmin: isFeedbackAdmin(session?.user.email) });
  } catch (err) {
    console.error("[api/me]", err);
    res.status(500).json({ feedbackAdmin: false });
  }
}
