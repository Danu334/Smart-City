import { useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { useMe } from "@/lib/useMe";

const CLASS_NAME = "paw-cursor";
// Remembered so the paw is there from the first paint on the next visit.
const STORAGE_KEY = "sc-paw-cursor";

function set(on: boolean) {
  document.documentElement.classList.toggle(CLASS_NAME, on);
  try {
    if (on) localStorage.setItem(STORAGE_KEY, "1");
    else localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

/** Cat-paw cursor for the owners' accounts, on every page. */
export default function PawCursor() {
  const { data: session, isPending } = useSession();
  const me = useMe();

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "1") document.documentElement.classList.add(CLASS_NAME);
    } catch {}
  }, []);

  useEffect(() => {
    if (isPending) return;
    if (!session) set(false);
    else if (me) set(me.pawCursor);
  }, [isPending, session, me]);

  return null;
}
