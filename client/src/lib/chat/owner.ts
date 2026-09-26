import { randomUUID } from "node:crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "@/lib/auth";
import { claimGuestConversations, type Owner } from "@/lib/chat/store";

// Anonymous visitors keep their history under a random id in an httpOnly
// cookie. After sign-in, the first chat request moves those conversations to
// the account and drops the cookie.

const GUEST_COOKIE = "sc-guest";
const GUEST_MAX_AGE = 60 * 60 * 24 * 365; // 1 year
const GUEST_ID = /^[0-9a-f-]{36}$/;

function guestCookie(value: string, maxAge: number): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${GUEST_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

/**
 * The owner of this request's conversations. With `create`, an anonymous
 * visitor without a guest cookie gets one; without it, returns null instead.
 */
export async function resolveOwner(
  req: NextApiRequest,
  res: NextApiResponse,
  { create }: { create: boolean },
): Promise<Owner | null> {
  const cookie = req.cookies[GUEST_COOKIE];
  const guestId = cookie && GUEST_ID.test(cookie) ? cookie : null;

  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (session) {
    if (guestId) {
      await claimGuestConversations(guestId, session.user.id);
      res.appendHeader("Set-Cookie", guestCookie("", 0));
    }
    return { userId: session.user.id };
  }

  if (guestId) return { guestId };
  if (!create) return null;

  const fresh = randomUUID();
  res.appendHeader("Set-Cookie", guestCookie(fresh, GUEST_MAX_AGE));
  return { guestId: fresh };
}
