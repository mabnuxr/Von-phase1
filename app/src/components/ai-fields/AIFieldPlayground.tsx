import { useState, useEffect, useRef } from "react";
import useAiFieldsStore from "../../store/vonAiFieldsStore";
import type { PlaygroundOpp } from "../../store/vonAiFieldsStore";
import type {
  OpportunitySearchResult,
  SampleOpportunity,
} from "../../types/vonAiFields";
import {
  useOpportunitySearch,
  useRunPlayground,
} from "../../hooks/useVonAiFields";
import {
  MagnifyingGlassIcon,
  PlayIcon,
  XIcon,
  SpinnerGapIcon,
  CaretRightIcon,
} from "@phosphor-icons/react";

// ─── Constants ──────────────────────────────────────────────
const MAX_OPPS = 5;

// ─── Helper: format currency ────────────────────────────────
function formatAmount(amount: number | null | undefined): string {
  if (amount == null) return "";
  return `$${amount.toLocaleString()}`;
}

// ─── Helpers ────────────────────────────────────────────────
function formatInsights(
  insights: string | Record<string, unknown> | undefined,
): { summary: string; reasoning: string } {
  if (!insights) return { summary: "", reasoning: "" };
  if (typeof insights === "string")
    return { summary: insights, reasoning: insights };

  // Object: extract value + reasoning fields
  const entries = Object.entries(insights);
  const reasoningEntry = entries.find(([k]) => k.endsWith("_reasoning"));
  const valueEntry = entries.find(([k]) => !k.endsWith("_reasoning"));

  const summary = valueEntry ? `${valueEntry[0]}: ${valueEntry[1]}` : "";
  const reasoning = reasoningEntry ? String(reasoningEntry[1]) : "";
  return { summary, reasoning };
}

// ─── PlaygroundCard (internal) ──────────────────────────────
function PlaygroundCard({
  opp,
  onRemove,
}: {
  opp: PlaygroundOpp;
  onRemove: (id: string) => void;
}) {
  const [showReasoning, setShowReasoning] = useState(false);
  const { summary, reasoning } = formatInsights(opp.result?.insights);

  const statusIndicator = () => {
    switch (opp.status) {
      case "ready":
        return <span className="text-xs font-medium text-gray-500">Ready</span>;
      case "running":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600">
            <SpinnerGapIcon size={12} className="animate-spin" />
            Running
          </span>
        );
      case "done":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            Done
          </span>
        );
      case "error":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            Error
          </span>
        );
    }
  };

  return (
    <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg space-y-2">
      {/* Top row: name + amount + status + remove */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900 m-0 truncate">
            {opp.name}
          </p>
          {opp.amount != null && (
            <p className="text-xs text-gray-500 m-0 mt-0.5">
              {formatAmount(opp.amount)}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {statusIndicator()}
          <button
            onClick={() => onRemove(opp.opportunityId)}
            className="p-0.5 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            aria-label={`Remove ${opp.name}`}
          >
            <XIcon size={14} />
          </button>
        </div>
      </div>

      {/* Error output */}
      {opp.status === "error" && opp.result?.error && (
        <p className="text-xs text-red-600 m-0">{opp.result.error}</p>
      )}

      {/* Done output */}
      {opp.status === "done" && opp.result && (
        <div className="space-y-2">
          {/* Insights text */}
          {summary && <p className="text-sm text-gray-800 m-0">{summary}</p>}

          {/* Source counts */}
          <div className="flex items-center gap-3">
            {opp.result.callsCount != null && (
              <span className="text-xs text-gray-500">
                {opp.result.callsCount} call
                {opp.result.callsCount !== 1 ? "s" : ""}
              </span>
            )}
            {opp.result.emailsCount != null && (
              <span className="text-xs text-gray-500">
                {opp.result.emailsCount} email
                {opp.result.emailsCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Show reasoning toggle */}
          {reasoning && (
            <div>
              <button
                onClick={() => setShowReasoning((prev) => !prev)}
                className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-800 transition-colors cursor-pointer"
              >
                <CaretRightIcon
                  size={12}
                  className={`transition-transform duration-200 ${
                    showReasoning ? "rotate-90" : ""
                  }`}
                />
                {showReasoning ? "Hide reasoning" : "Show reasoning"}
              </button>
              {showReasoning && (
                <div className="mt-2 p-3 bg-white border border-dashed border-gray-200 rounded-md">
                  <p className="text-xs text-gray-700 m-0 whitespace-pre-wrap">
                    {reasoning}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── AIFieldPlayground ──────────────────────────────────────
interface AIFieldPlaygroundProps {
  columnsToGenerate: Array<{ name: string; description: string; type: string }>;
  sources: string[];
  opportunityFilter?: string | null;
  sampleOpportunities?: SampleOpportunity[];
}

export function AIFieldPlayground({
  columnsToGenerate,
  sources,
  opportunityFilter,
  sampleOpportunities,
}: AIFieldPlaygroundProps) {
  const {
    playgroundOpps,
    addPlaygroundOpp,
    removePlaygroundOpp,
    setPlaygroundExecutionId,
    setPlaygroundOppStatus,
  } = useAiFieldsStore();

  const runPlayground = useRunPlayground();

  // Seed playground with sample opportunities from the event
  const seededRef = useRef(false);
  useEffect(() => {
    if (
      seededRef.current ||
      !sampleOpportunities?.length ||
      playgroundOpps.length > 0
    )
      return;
    seededRef.current = true;
    for (const opp of sampleOpportunities.slice(0, MAX_OPPS)) {
      addPlaygroundOpp({
        opportunityId: opp.id,
        name: opp.name,
        amount: opp.amount ?? null,
        stage: opp.stage ?? "",
        owner: opp.owner ?? "",
      });
    }
  }, [sampleOpportunities, playgroundOpps.length, addPlaygroundOpp]);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const resultsEndRef = useRef<HTMLDivElement>(null);

  const isFull = playgroundOpps.length >= MAX_OPPS;
  const isAnyRunning = playgroundOpps.some((o) => o.status === "running");

  // Auto-scroll to bottom when results stream in
  const completedCount = playgroundOpps.filter(
    (o) => o.status === "done" || o.status === "error",
  ).length;
  useEffect(() => {
    if (completedCount > 0) {
      resultsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [completedCount]);

  // Opportunity search query
  const { data: searchResults, isLoading: isSearching } = useOpportunitySearch(
    searchQuery,
    dropdownOpen && !isFull,
    opportunityFilter,
  );

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropdownOpen]);

  // Handle selecting an opportunity from search results
  const handleSelectOpp = (opp: OpportunitySearchResult) => {
    addPlaygroundOpp({
      opportunityId: opp.opportunityId,
      name: opp.name,
      amount: opp.amount,
      stage: opp.stage,
      owner: opp.owner ?? "",
    });
    setSearchQuery("");
    setDropdownOpen(false);
  };

  // Handle "Run all"
  const handleRunAll = async () => {
    const readyIds = playgroundOpps
      .filter((o) => o.status === "ready")
      .map((o) => o.opportunityId);

    if (readyIds.length === 0) return;

    // Only mark the IDs we're actually sending as running
    readyIds.forEach((id) => setPlaygroundOppStatus(id, "running"));

    try {
      const result = await runPlayground.mutateAsync({
        opportunityIds: readyIds,
        columnsToGenerate,
        sources,
      });
      setPlaygroundExecutionId(result.executionId);
    } catch {
      // Reset running opps to error so UI isn't stuck
      readyIds.forEach((id) => {
        setPlaygroundOppStatus(id, "error", {
          opportunityId: id,
          success: false,
          error: "Failed to start playground run",
        });
      });
    }
  };

  // Filter out already-selected opps from search results
  const selectedIds = new Set(playgroundOpps.map((o) => o.opportunityId));
  const filteredResults = (searchResults ?? []).filter(
    (r) => !selectedIds.has(r.opportunityId),
  );

  return (
    <div className="border border-gray-200 rounded-xl bg-white p-3.5">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold tracking-[-0.01em] text-gray-900 m-0">
              Playground
            </h3>
            <p className="text-xs text-gray-400 mt-0.5 m-0">
              Test this field on a few records before running on all matches.
            </p>
          </div>
          <span className="text-xs text-gray-500">
            {playgroundOpps.length} / {MAX_OPPS}
          </span>
        </div>

        {/* Search */}
        <div className="relative" ref={dropdownRef}>
          <div className="relative">
            <MagnifyingGlassIcon
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (!dropdownOpen) setDropdownOpen(true);
              }}
              onFocus={() => {
                setDropdownOpen(true);
              }}
              disabled={isFull}
              placeholder={
                isFull
                  ? "Maximum opportunities reached"
                  : "Search opportunities..."
              }
              className="w-full h-8 pl-9 pr-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900 focus:ring-0 focus:shadow-[0_0_0_3px_rgba(0,0,0,.06)] bg-white transition-all duration-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
            />
          </div>

          {/* Search dropdown */}
          {dropdownOpen && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-[0_4px_14px_-4px_rgba(0,0,0,.14),0_1px_3px_rgba(0,0,0,.06)] z-20 max-h-60 overflow-y-auto p-1">
              {isSearching ? (
                <div className="px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
                  <SpinnerGapIcon size={14} className="animate-spin" />
                  Searching...
                </div>
              ) : filteredResults.length > 0 ? (
                filteredResults.map((opp) => (
                  <button
                    key={opp.opportunityId}
                    onClick={() => handleSelectOpp(opp)}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors rounded-md"
                  >
                    <div className="font-medium text-gray-900">{opp.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {[opp.stage, formatAmount(opp.amount), opp.owner]
                        .filter(Boolean)
                        .join(" \u00b7 ")}
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-gray-500">
                  No opportunities found
                </div>
              )}
            </div>
          )}
        </div>

        {/* Selected opportunities */}
        {playgroundOpps.length > 0 && (
          <div className="space-y-2">
            {playgroundOpps.map((opp) => (
              <PlaygroundCard
                key={opp.opportunityId}
                opp={opp}
                onRemove={removePlaygroundOpp}
              />
            ))}
            <div ref={resultsEndRef} />
          </div>
        )}

        {/* Empty state */}
        {playgroundOpps.length === 0 && (
          <div className="flex flex-col items-center justify-center border border-dashed border-gray-200 rounded-lg bg-gray-50 p-5 text-center">
            <p className="text-sm text-gray-500 m-0">
              Search and add opportunities to test this field.
            </p>
            <p className="text-xs text-gray-400 m-0 mt-1">
              Select up to {MAX_OPPS} opportunities, then run to see results.
            </p>
          </div>
        )}

        {/* Run all button */}
        {playgroundOpps.length > 0 && (
          <button
            onClick={handleRunAll}
            disabled={isAnyRunning || runPlayground.isPending}
            className="h-8 px-3 inline-flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white rounded-md text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnyRunning || runPlayground.isPending ? (
              <>
                <SpinnerGapIcon size={14} className="animate-spin" />
                Running...
              </>
            ) : (
              <>
                <PlayIcon size={14} weight="fill" />
                Run all
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
