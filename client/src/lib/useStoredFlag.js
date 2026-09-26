import { useCallback, useSyncExternalStore } from "react";

// A boolean preference kept in localStorage. Server and first client render see
// `fallback`, so there is no hydration mismatch — same approach as lib/i18n.js.

const listeners = new Set();
const memory = new Map();

function subscribe(fn) {
  listeners.add(fn);
  window.addEventListener("storage", fn);
  return () => {
    listeners.delete(fn);
    window.removeEventListener("storage", fn);
  };
}

export function useStoredFlag(key, fallback = false) {
  const read = useCallback(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw === "1") return true;
      if (raw === "0") return false;
    } catch {}
    return memory.get(key) ?? fallback;
  }, [key, fallback]);

  const server = useCallback(() => fallback, [fallback]);
  const value = useSyncExternalStore(subscribe, read, server);

  const set = useCallback(
    (next) => {
      memory.set(key, next);
      try {
        localStorage.setItem(key, next ? "1" : "0");
      } catch {}
      listeners.forEach((fn) => fn());
    },
    [key],
  );

  return [value, set];
}
