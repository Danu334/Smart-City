import { createHash } from "node:crypto";

// The owners get a cat-paw cursor. Cosmetic, not a permission. Their emails
// are kept as SHA-256 hashes so they aren't written out in the repository.
const PAW_EMAIL_HASHES = new Set([
  "c639aa255e00c33e5d2771422bb4290e77ffa2ad89ace5d337fd9a60bfe4295b",
  "2900726553bacf55764ecefde8a1049c4aac21bc81c208c8ccbe3d0bb5a450a4",
]);

export function hasPawCursor(email: string | null | undefined): boolean {
  if (!email) return false;
  return PAW_EMAIL_HASHES.has(createHash("sha256").update(email.trim().toLowerCase()).digest("hex"));
}
