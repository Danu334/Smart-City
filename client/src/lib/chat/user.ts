import type { NextApiRequest } from "next";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "@/lib/auth";

/** The signed-in user's id, or null for a visitor. Chat history needs an account. */
export async function currentUserId(req: NextApiRequest): Promise<string | null> {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  return session?.user.id ?? null;
}
