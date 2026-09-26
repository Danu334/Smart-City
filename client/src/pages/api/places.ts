import type { NextApiRequest, NextApiResponse } from "next";
import { resolvePlaces } from "@/lib/places/resolve";
import type { PlacesResult } from "@/types/places";

type Body = PlacesResult | { error: "missing_query" | "lookup_failed" };

// GET /api/places?q=<name | website | category>
export default async function handler(req: NextApiRequest, res: NextApiResponse<Body>) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).end();
  }
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (!q || q.length > 200) return res.status(400).json({ error: "missing_query" });

  try {
    const result = await resolvePlaces(q);
    // Places rarely move: let Vercel's CDN answer repeats for a day, which
    // also keeps us well inside OpenStreetMap's fair-use limits.
    res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=604800");
    return res.status(200).json(result);
  } catch (error) {
    console.error("places lookup failed", q, error);
    return res.status(502).json({ error: "lookup_failed" });
  }
}
