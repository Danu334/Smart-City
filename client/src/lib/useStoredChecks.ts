import { useCallback, useMemo, useSyncExternalStore } from "react";

// Which items of a list are ticked, kept in localStorage as a JSON array of
// indexes. Server and first client render see nothing ticked, so there is no
// hydration mismatch (same approach as useStoredFlag).

const listeners = new Set<() => void>();
const memory = new Map<string, string>();

function subscribe(fn: () => void) {
  listeners.add(fn);
  window.addEventListener("storage", fn);
  return () => {
    listeners.delete(fn);
    window.removeEventListener("storage", fn);
  };
}

export function useStoredChecks(key: string): [Set<number>, (index: number, on: boolean) => void, () => void] {
  const read = useCallback(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) return raw;
    } catch {}
    return memory.get(key) ?? "[]";
  }, [key]);

  const raw = useSyncExternalStore(subscribe, read, () => "[]");
  const checked = useMemo(() => {
    try {
      const list = JSON.parse(raw);
      return new Set<number>(Array.isArray(list) ? list.filter(Number.isInteger) : []);
    } catch {
      return new Set<number>();
    }
  }, [raw]);

  const write = useCallback(
    (next: Set<number>) => {
      const value = JSON.stringify([...next].sort((a, b) => a - b));
      memory.set(key, value);
      try {
        if (next.size) localStorage.setItem(key, value);
        else localStorage.removeItem(key);
      } catch {}
      listeners.forEach((fn) => fn());
    },
    [key],
  );

  const toggle = useCallback(
    (index: number, on: boolean) => {
      const next = new Set(checked);
      if (on) next.add(index);
      else next.delete(index);
      write(next);
    },
    [checked, write],
  );

  const clear = useCallback(() => write(new Set()), [write]);

  return [checked, toggle, clear];
}
