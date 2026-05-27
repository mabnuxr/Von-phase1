import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Command } from "cmdk";
import { useNavigate } from "react-router-dom";
import { useSearch } from "../../hooks/useSearch";
import { useSearchRecents } from "../../hooks/useSearchRecents";
import { useSearchModalStore } from "../../hooks/useSearchModal";
import { useRecentSearchesStorage } from "../../hooks/useRecentSearchesStorage";
import { useRecentOpensStorage } from "../../hooks/useRecentOpensStorage";
import { report } from "../../lib/analytics/tracker";
import type { SearchResult } from "../../types/search";
import { SearchInputRow } from "./SearchInputRow";
import { SearchBody } from "./SearchBody";
import { SearchFallbackRow } from "./SearchFallbackRow";
import { pathForResult } from "./searchUtils";

export function SearchModal() {
  const isOpen = useSearchModalStore((s) => s.isOpen);
  const close = useSearchModalStore((s) => s.close);

  const [query, setQuery] = useState("");

  // Plain useNavigate (not the guarded variant) — react-router's `state` arg
  // is required to seed /chat/new with a prompt, and the guard wrapper only
  // accepts `(to, onNavigate?)`. Trade-off: unsaved-changes guards on the
  // page underneath the modal are bypassed when opening a search result.
  const navigate = useNavigate();

  const search = useSearch(query, isOpen);
  const recentsQuery = useSearchRecents(isOpen);
  const { searches: recentSearches, push: pushRecentSearch } =
    useRecentSearchesStorage();
  const { push: pushRecentOpen } = useRecentOpensStorage();

  // Reset on close.
  const lastReportedRef = useRef<string>("");
  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      lastReportedRef.current = "";
    }
  }, [isOpen]);

  const recentItems = useMemo(
    () => recentsQuery.data?.results ?? [],
    [recentsQuery.data?.results],
  );
  const trimmed = query.trim();
  const activeList = useMemo<SearchResult[]>(
    () => (trimmed ? search.results : recentItems.slice(0, 5)),
    [trimmed, search.results, recentItems],
  );

  // Fire `Search - Query Submitted` once per (query, used_deep) pair when
  // results settle. Reset on modal close so re-opening can fire again.
  useEffect(() => {
    if (!isOpen) return;
    if (!trimmed) return;
    if (!search.meta) return;
    if (search.isQuickLoading || search.isDeepRunning) return;
    const key = `${trimmed}|${search.meta.used_deep}`;
    if (lastReportedRef.current === key) return;
    lastReportedRef.current = key;
    report.searchQuerySubmitted({
      query_length: trimmed.length,
      deep_used: search.meta.used_deep,
      result_count: search.results.length,
      top_score: search.results[0]?.score ?? null,
    });
  }, [
    isOpen,
    trimmed,
    search.meta,
    search.isQuickLoading,
    search.isDeepRunning,
    search.results,
  ]);

  const openResult = useCallback(
    (r: SearchResult) => {
      if (trimmed) pushRecentSearch(trimmed);
      if (r.type === "chat" || r.type === "dashboard") {
        pushRecentOpen({ type: r.type, id: r.id });
      } else if (r.type === "widget" && r.parent_dashboard_id) {
        pushRecentOpen({ type: "dashboard", id: r.parent_dashboard_id });
      } else if (r.type === "artifact" && r.conversation_id) {
        pushRecentOpen({ type: "chat", id: r.conversation_id });
      }
      report.searchResultOpened({
        query: trimmed,
        result_type: r.type,
        result_position: activeList.indexOf(r),
        deep_used: search.meta?.used_deep ?? false,
      });
      navigate(pathForResult(r));
      close();
    },
    [
      trimmed,
      pushRecentSearch,
      pushRecentOpen,
      navigate,
      close,
      activeList,
      search.meta,
    ],
  );

  const fireFallback = useCallback(() => {
    if (trimmed) pushRecentSearch(trimmed);
    report.searchNewChatFromSearch({
      query: trimmed,
      was_zero_results: search.isDeepDone && search.results.length === 0,
    });
    // Seed the new chat with a natural-language ask so the agent searches
    // across the user's existing chats and dashboards for the query. Use
    // `initialInput` (not `prompt`) so NewConversation doesn't wrap it in
    // the shared-chat "Ask a follow-up" preamble.
    const seed = trimmed
      ? `What have my past chats and dashboards mentioned about "${trimmed}"?`
      : "";
    navigate("/chat/new", seed ? { state: { initialInput: seed } } : undefined);
    close();
  }, [
    trimmed,
    pushRecentSearch,
    navigate,
    close,
    search.isDeepDone,
    search.results,
  ]);

  // cmdk owns ↑↓ + Enter on the focused item. We still intercept:
  // - Esc → close modal
  // - Cmd/Ctrl+Enter → always fire the fallback (overrides cmdk's selection)
  const onKeyDownCapture = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && trimmed) {
        e.preventDefault();
        e.stopPropagation();
        fireFallback();
      }
    },
    [close, trimmed, fireFallback],
  );

  const showFallback = trimmed.length > 0;
  const promoted = search.isDeepDone && search.results.length === 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm"
            onClick={close}
          />
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.99, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.99, y: -6 }}
            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
            role="dialog"
            aria-label="Search"
            className="fixed left-1/2 top-[14vh] -translate-x-1/2 w-[640px] max-w-[calc(100vw-48px)] max-h-[70vh] z-[10000] flex flex-col bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden"
          >
            <Command
              shouldFilter={false}
              loop
              label="Search"
              onKeyDownCapture={onKeyDownCapture}
              className="flex flex-col flex-1 min-h-0"
            >
              <SearchInputRow
                value={query}
                onChange={setQuery}
                onClose={close}
                autoFocus
              />

              <Command.List className="flex-1 overflow-y-auto">
                <SearchBody
                  query={query}
                  results={search.results}
                  isQuickLoading={search.isQuickLoading}
                  isDeepRunning={search.isDeepRunning}
                  isDeepDone={search.isDeepDone}
                  error={search.error}
                  recentSearches={recentSearches}
                  recentItems={recentItems}
                  onChooseRecentSearch={(q) => setQuery(q)}
                  onOpen={(r) => openResult(r)}
                />
              </Command.List>

              {showFallback && (
                <SearchFallbackRow
                  query={trimmed}
                  promoted={promoted}
                  onClick={fireFallback}
                />
              )}
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
