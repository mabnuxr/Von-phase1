import { useCallback, useEffect, useRef, useState } from "react";
import { searchService } from "../services";
import { ApiError } from "../services/apiClient";
import type { SearchMeta, SearchResult } from "../types/search";

const QUICK_DEBOUNCE_MS = 200;
const DEEP_IDLE_MS = 300;
const DEEP_CONFIDENCE_THRESHOLD = 0.4;
const RETRY_BACKOFF_MS = 250;

interface UseSearchState {
  results: SearchResult[];
  meta: SearchMeta | null;
  isQuickLoading: boolean;
  isDeepRunning: boolean;
  isDeepDone: boolean;
  error: string | null;
}

const INITIAL: UseSearchState = {
  results: [],
  meta: null,
  isQuickLoading: false,
  isDeepRunning: false,
  isDeepDone: false,
  error: null,
};

export function useSearch(query: string, enabled: boolean) {
  const [state, setState] = useState<UseSearchState>(INITIAL);

  const seqRef = useRef(0);
  const quickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const quickAbortRef = useRef<AbortController | null>(null);
  const deepAbortRef = useRef<AbortController | null>(null);

  const cancelAll = useCallback(() => {
    if (quickTimerRef.current) clearTimeout(quickTimerRef.current);
    if (deepTimerRef.current) clearTimeout(deepTimerRef.current);
    quickTimerRef.current = null;
    deepTimerRef.current = null;
    quickAbortRef.current?.abort();
    deepAbortRef.current?.abort();
    quickAbortRef.current = null;
    deepAbortRef.current = null;
  }, []);

  // Reset when modal closes.
  useEffect(() => {
    if (!enabled) {
      cancelAll();
      setState(INITIAL);
    }
  }, [enabled, cancelAll]);

  useEffect(() => {
    if (!enabled) return;

    const q = query.trim();
    cancelAll();

    if (!q) {
      setState(INITIAL);
      return;
    }

    // Clear stale loading flags + meta synchronously. Both Quick and Deep
    // fetches that were in-flight have just been aborted by cancelAll(),
    // and their catch blocks early-return on `controller.signal.aborted`
    // without touching state — so without this reset, the previous
    // query's `isDeepRunning` / `isQuickLoading` flags leak across the
    // keystroke and the UI keeps showing "Doing a deeper search…" (or
    // "Searching…") long after any actual call is gone. The flags get
    // re-set to true again when the next Quick / Deep actually fires.
    setState((s) => ({
      ...s,
      meta: null,
      isDeepDone: false,
      isDeepRunning: false,
      isQuickLoading: false,
    }));

    const mySeq = ++seqRef.current;

    quickTimerRef.current = setTimeout(async () => {
      const controller = new AbortController();
      quickAbortRef.current = controller;
      setState((s) => ({
        ...s,
        isQuickLoading: true,
        isDeepDone: false,
        error: null,
      }));

      const attemptQuick = async (retried: boolean): Promise<void> => {
        try {
          const res = await searchService.search(
            { query: q, deep: false },
            controller.signal,
          );
          if (mySeq !== seqRef.current) return;
          setState((s) => ({
            ...s,
            results: res.results,
            meta: res.meta,
            isQuickLoading: false,
            error: null,
          }));

          if (res.meta.confidence < DEEP_CONFIDENCE_THRESHOLD) {
            deepTimerRef.current = setTimeout(
              () => runDeep(q, mySeq),
              DEEP_IDLE_MS,
            );
          }
        } catch (err) {
          if (controller.signal.aborted) return;
          if (mySeq !== seqRef.current) return;
          if (err instanceof ApiError && err.statusCode >= 500 && !retried) {
            await new Promise((r) => setTimeout(r, RETRY_BACKOFF_MS));
            if (mySeq !== seqRef.current) return;
            return attemptQuick(true);
          }
          setState((s) => ({
            ...s,
            isQuickLoading: false,
            error: "Search unavailable",
          }));
        }
      };

      await attemptQuick(false);
    }, QUICK_DEBOUNCE_MS);

    return cancelAll;
    // runDeep is defined below as a stable closure pattern via refs; we
    // intentionally exclude it from deps to avoid re-firing on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, enabled, cancelAll]);

  const runDeep = useCallback(async (q: string, mySeq: number) => {
    if (mySeq !== seqRef.current) return;
    const controller = new AbortController();
    deepAbortRef.current = controller;
    setState((s) => ({ ...s, isDeepRunning: true }));

    try {
      const res = await searchService.search(
        { query: q, deep: true },
        controller.signal,
      );
      if (mySeq !== seqRef.current) return;
      setState((s) => ({
        ...s,
        results: res.results,
        meta: res.meta,
        isDeepRunning: false,
        isDeepDone: true,
      }));
    } catch (err) {
      if (controller.signal.aborted) return;
      if (mySeq !== seqRef.current) return;
      setState((s) => ({ ...s, isDeepRunning: false, isDeepDone: true }));
      void err;
    }
  }, []);

  return state;
}
