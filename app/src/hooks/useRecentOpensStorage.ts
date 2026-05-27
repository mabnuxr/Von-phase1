import { useCallback, useEffect, useState } from "react";
import type { SearchResultType } from "../types/search";

const KEY = "von-recent-opens";
const MAX = 6;

export interface RecentOpenRef {
  type: Extract<SearchResultType, "chat" | "dashboard">;
  id: string;
}

function isRef(x: unknown): x is RecentOpenRef {
  if (!x || typeof x !== "object") return false;
  const r = x as Record<string, unknown>;
  return (
    (r.type === "chat" || r.type === "dashboard") && typeof r.id === "string"
  );
}

function read(): RecentOpenRef[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isRef) : [];
  } catch {
    return [];
  }
}

/**
 * `{ type, id }` refs of recently-opened chats/dashboards. Used purely as
 * client-side ranking input — the backend `/recents` endpoint is still the
 * source of full row data.
 */
export function useRecentOpensStorage() {
  const [opens, setOpens] = useState<RecentOpenRef[]>(() => read());

  useEffect(() => {
    const onFocus = () => setOpens(read());
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const push = useCallback((ref: RecentOpenRef) => {
    const next = [
      ref,
      ...read().filter((x) => !(x.id === ref.id && x.type === ref.type)),
    ].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
    setOpens(next);
  }, []);

  return { opens, push };
}
