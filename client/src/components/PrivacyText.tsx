import Link from "next/link";

// Renders a sentence with a {link} placeholder, linking to the privacy
// policy in a new tab so a half-filled form is never lost.
type PrivacyTextProps = { text: string; linkText: string; className?: string };

export default function PrivacyText({ text, linkText, className }: PrivacyTextProps) {
  const [before, after] = text.split("{link}");
  return (
    <span>
      {before}
      <Link href="/privacy" target="_blank" rel="noopener" className={className}>
        {linkText}
      </Link>
      {after}
    </span>
  );
}
