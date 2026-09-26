import { Html, Head, Main, NextScript } from "next/document";

// Runs before first paint:
// - reveal-ready: hide scroll-reveal content until it animates in
//   (lib/useReveal.js); dropped after 3s if the page script never ran.
// - loader: show the splash once per session (is-loading), otherwise hide
//   it instantly (skip-loader); if the page script never ran, hide it at 5s.
const boot = `(function(){var d=document.documentElement;d.classList.add("reveal-ready");
var seen=false;try{seen=!!sessionStorage.getItem("sc-loaded")}catch(e){seen=true}
d.classList.add(seen?"skip-loader":"is-loading");
setTimeout(function(){if(!window.__revealOk)d.classList.remove("reveal-ready")},3000);
setTimeout(function(){if(!window.__loaderOk){d.classList.remove("is-loading");d.classList.add("skip-loader")}},5000);})();`;

export default function Document() {
  return (
    <Html lang="ro">
      <Head>
        <script dangerouslySetInnerHTML={{ __html: boot }} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
