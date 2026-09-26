// Flags set by the page script so the inline boot script in _document can
// tell whether hydration happened (see _document.tsx).
declare global {
  interface Window {
    __revealOk?: boolean;
    __loaderOk?: boolean;
  }
}

export {};
