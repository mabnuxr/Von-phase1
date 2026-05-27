import { useCallback, useEffect, useState } from "react";

const KEY = "von-recent-searches";
const MAX = 6;

function read(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((x) => typeof x === "string")
      : [];
  } catch {
    return [];
  }
}

/**
 * Recent search query strings, MRU-ordered, deduped, capped at 6.
 * Pure FE concern — never sent to the backend.
 */
export function useRecentSearchesStorage() {
  const [searches, setSearches] = useState<string[]>(() => read());

  // Resync on focus so multi-tab edits stay coherent.
  useEffect(() => {
    const onFocus = () => setSearches(read());
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const push = useCallback((q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    const next = [trimmed, ...read().filter((x) => x !== trimmed)].slice(
      0,
      MAX,
    );
    localStorage.setItem(KEY, JSON.stringify(next));
    setSearches(next);
  }, []);

  return { searches, push };
}
