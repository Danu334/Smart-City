import { Html, Head, Main, NextScript } from "next/document";

// Hide reveal-animated content before first paint (no flash), but show it
// again after 3s if the page script never started the animations.
const revealBoot = `document.documentElement.classList.add("reveal-ready");setTimeout(function(){if(!window.__revealOk)document.documentElement.classList.remove("reveal-ready")},3000);`;

export default function Document() {
  return (
    <Html lang="ro">
      <Head>
        <script dangerouslySetInnerHTML={{ __html: revealBoot }} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
