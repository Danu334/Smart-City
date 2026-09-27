import { useEffect } from "react";
import { useSession } from "@/lib/auth-client";

// Cat-paw cursor while an owner account is signed in. Owner emails are kept
// as SHA-256 hashes so the addresses never ship in the client bundle.
const OWNER_EMAIL_HASHES = new Set([
  "c639aa255e00c33e5d2771422bb4290e77ffa2ad89ace5d337fd9a60bfe4295b",
  "2900726553bacf55764ecefde8a1049c4aac21bc81c208c8ccbe3d0bb5a450a4",
]);
const CLASS_NAME = "paw-cursor";

async function sha256(text: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

export default function PawCursor() {
  const { data: session } = useSession();
  const email = session?.user.email?.trim().toLowerCase() ?? "";

  useEffect(() => {
    const root = document.documentElement;
    if (!email) {
      root.classList.remove(CLASS_NAME);
      return;
    }
    let live = true;
    sha256(email)
      .then((hash) => {
        if (live) root.classList.toggle(CLASS_NAME, OWNER_EMAIL_HASHES.has(hash));
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [email]);

  return null;
}
