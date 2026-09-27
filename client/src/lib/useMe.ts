import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";

// What /api/me says about the signed-in user, fetched once per user and
// shared by everything that asks (the nav).

export type Me = { feedbackAdmin: boolean };

const NOBODY: Me = { feedbackAdmin: false };
const cache = new Map<string, Promise<Me>>();

function load(userId: string): Promise<Me> {
  let me = cache.get(userId);
  if (!me) {
    me = fetch("/api/me")
      .then((res) => (res.ok ? res.json() : NOBODY))
      .then((data: Partial<Me>) => ({ feedbackAdmin: !!data.feedbackAdmin }))
      .catch(() => {
        cache.delete(userId);
        return NOBODY;
      });
    cache.set(userId, me);
  }
  return me;
}

/** Null while signed out or not known yet. */
export function useMe(): Me | null {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? null;
  const [me, setMe] = useState<{ userId: string; me: Me } | null>(null);

  useEffect(() => {
    if (!userId) return;
    let live = true;
    load(userId).then((value) => live && setMe({ userId, me: value }));
    return () => {
      live = false;
    };
  }, [userId]);

  return userId && me?.userId === userId ? me.me : null;
}
