import { useEffect } from "react";

// Scroll-triggered entrances. Elements marked data-reveal="<variant>" get
// data-in once they scroll into view; CSS in globals.css does the motion.
// Direct children (and children of [data-reveal-list]) receive --i for
// staggering. _document.js adds .reveal-ready before first paint and drops
// it again if this hook never runs, so content is never stuck hidden.
export function useReveal() {
  useEffect(() => {
    window.__revealOk = true;
    const els = [...document.querySelectorAll<HTMLElement>("[data-reveal]")];
    const index = (parent: Element) => [...parent.children].forEach((c, i) => (c as HTMLElement).style.setProperty("--i", String(i)));
    els.forEach((el) => {
      index(el);
      el.querySelectorAll("[data-reveal-list]").forEach(index);
    });

    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.setAttribute("data-in", ""));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.setAttribute("data-in", "");
          io.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}
