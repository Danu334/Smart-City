// The three honesty glyphs: answered (teal), gap (amber), contradiction (rose).
// Shared by the landing page's anatomy figure and the chat surfaces.
import type { Tone } from "@/types/chat";

/** The three kinds of answer, in the order used everywhere on the site. */
export const ANSWER_TONES: Tone[] = ["teal", "amber", "rose"];

export default function StateIcon({ tone }: { tone: Tone }) {
  if (tone === "teal")
    return (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <path d="M5 10.5l3.2 3L15 6.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  if (tone === "amber")
    return (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <circle cx="10" cy="10" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeDasharray="3 2.4" />
        <path d="M10 7v3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="10" cy="13.2" r="1" fill="currentColor" />
      </svg>
    );
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M4 7h8M4 13h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 4.5L15.5 7 12 9.5M12 10.5l3.5 2.5-3.5 2.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
