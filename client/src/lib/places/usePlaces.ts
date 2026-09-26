import { useEffect, useState } from "react";
import type { PlacesResult } from "@/types/places";

export type PlacesState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error" }
  | { status: "done"; result: PlacesResult };

/** Looks up a name, website or category through /api/places. */
export function usePlaces(query: string): PlacesState {
  const [state, setState] = useState<PlacesState>({ status: "idle" });

  useEffect(() => {
    const q = query.trim();
    if (!q) return;
    const controller = new AbortController();
    const start = setTimeout(() => setState({ status: "loading" }), 0);
    fetch(`/api/places?q=${encodeURIComponent(q)}`, { signal: controller.signal })
      .then((res) => (res.ok ? (res.json() as Promise<PlacesResult>) : Promise.reject(new Error(String(res.status)))))
      .then((result) => setState({ status: "done", result }))
      .catch((e: unknown) => {
        if ((e as Error).name !== "AbortError") setState({ status: "error" });
      });
    return () => {
      clearTimeout(start);
      controller.abort();
    };
  }, [query]);

  return query.trim() ? state : { status: "idle" };
}
