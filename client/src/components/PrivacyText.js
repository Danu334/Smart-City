import Link from "next/link";

// Renders a sentence with a {link} placeholder, linking to the privacy
// policy in a new tab so a half-filled form is never lost.
export default function PrivacyText({ text, linkText, className }) {
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
