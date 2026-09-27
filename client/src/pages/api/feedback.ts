import { randomUUID } from "node:crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import { pool } from "@/lib/db";
import { currentUserId } from "@/lib/chat/user";

const MAX_REASON = 2000;
const MAX_TEXT = 8000;

/** Saves a rating of one answer; the two sad ratings must say why. */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { messageId, rating, reason, question, answer, locale } = (req.body ?? {}) as Record<string, unknown>;
  const text = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);
  const why = text(reason, MAX_REASON);
  if (typeof messageId !== "string" || !messageId || messageId.length > 100)
    return res.status(400).json({ error: "messageId required" });
  if (typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 5)
    return res.status(400).json({ error: "rating must be 1–5" });
  if (rating <= 2 && !why) return res.status(400).json({ error: "reason required" });

  try {
    const userId = await currentUserId(req);
    await pool.query(
      `insert into chat_feedback (id, message_id, user_id, rating, reason, question, answer, locale)
       values ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [randomUUID(), messageId, userId, rating, why, text(question, MAX_TEXT), text(answer, MAX_TEXT), text(locale, 10)],
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error("[api/feedback]", err);
    res.status(500).json({ error: "Failed to save feedback" });
  }
}
