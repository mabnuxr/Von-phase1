/**
 * useTransparencyDrawer - Business logic for LazyTransparencyDrawer
 *
 * Handles:
 * - Artifact filtering by category (Data vs Calls/RAG vs IQ)
 * - Lazy loading of artifact content for Data tab and Deep Research tab
 * - Bulk fetching of RAG artifacts when drawer opens
 * - Caching of loaded artifacts
 * - Transformation of artifacts to QueryResults and CallTranscripts
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import type {
  CallTranscript,
  EmailTranscript,
  TransparencyQueryResult,
  IQQueryResult,
} from "@vonlabs/design-components";
import {
  useLazyArtifactContent,
  useBulkArtifacts,
} from "./useMessageArtifacts";
import {
  transformSingleArtifact,
  transformSummariesToPlaceholders,
  transformIQArtifactToDataTable,
  MEMORY_TOOL_NAMES,
  type ArtifactSummary,
} from "../utils/transformArtifactsToTransparency";
import { separateCallsAndEmails } from "../utils/transformArtifactsToCalls";
import type { ArtifactResponse } from "../services/conversationsService";

export interface UseTransparencyDrawerParams {
  isOpen: boolean;
  conversationId: string | null;
  runId: string | null;
  artifactSummaries: ArtifactSummary[];
}

export interface UseTransparencyDrawerReturn {
  // Data tab
  queries: TransparencyQueryResult[];
  handleQuerySelect: (queryId: string) => void;
  // Calls tab
  calls: CallTranscript[];
  isCallsLoading: boolean;
  callsError: Error | null;
  // Emails tab
  emails: EmailTranscript[];
  // Deep Research tab (VonIQ artifacts)
  vonIqQueries: IQQueryResult[];
  handleVonIqSelect: (queryId: string) => void;
  hasVonIqArtifacts: boolean;
}

// Module-level cache for loaded artifacts, scoped by conversationId:runId:artifactId
const artifactCache = new Map<string, ArtifactResponse>();

// Helper to create a scoped cache key
function getCacheKey(
  conversationId: string | null,
  runId: string | null,
  artifactId: string,
): string {
  return `${conversationId ?? ""}:${runId ?? ""}:${artifactId}`;
}

// Helper to clear cache entries for a specific conversation/run
function clearCacheForRun(
  conversationId: string | null,
  runId: string | null,
): void {
  const prefix = `${conversationId ?? ""}:${runId ?? ""}:`;
  for (const key of artifactCache.keys()) {
    if (key.startsWith(prefix)) {
      artifactCache.delete(key);
    }
  }
}

function transformArtifactsToQueries(
  dataArtifactSummaries: ArtifactSummary[],
  loadedArtifacts: Map<string, ArtifactResponse>,
  selectedArtifactId: string | null,
  isArtifactLoading: boolean,
): TransparencyQueryResult[] {
  if (dataArtifactSummaries.length === 0) {
    return [];
  }

  const results: TransparencyQueryResult[] = [];

  for (const summary of dataArtifactSummaries) {
    const loadedArtifact = loadedArtifacts.get(summary.artifact_id);

    if (loadedArtifact) {
      const result = transformSingleArtifact(loadedArtifact);
      if (result) {
        // Successfully transformed — only show if it has rows
        if (result.rows.length > 0) {
          results.push(result);
        }
        // Zero rows: skip tab entirely (no data to show)
        continue;
      }
      // result is null (unexpected schema, missing columns) — fall through to placeholder
    }

    // Not yet loaded — show placeholder
    const placeholders = transformSummariesToPlaceholders([summary]);
    const placeholder = placeholders[0];

    if (summary.artifact_id === selectedArtifactId && isArtifactLoading) {
      placeholder.description = "Loading...";
    } else {
      placeholder.description = "Click to load";
    }

    results.push(placeholder);
  }

  return results;
}

/**
 * Transform IQ artifacts to IQQueryResult format for ReportTable display
 */
function transformIQArtifactsToIQQueries(
  iqArtifactSummaries: ArtifactSummary[],
  loadedArtifacts: Map<string, ArtifactResponse>,
  selectedArtifactId: string | null,
  isArtifactLoading: boolean,
): IQQueryResult[] {
  if (iqArtifactSummaries.length === 0) {
    return [];
  }

  return iqArtifactSummaries.map((summary) => {
    const loadedArtifact = loadedArtifacts.get(summary.artifact_id);

    if (loadedArtifact) {
      const tableConfig = transformIQArtifactToDataTable(loadedArtifact);
      if (tableConfig) {
        return {
          id: tableConfig.id,
          name: tableConfig.name,
          description: tableConfig.description,
          columns: tableConfig.columns,
          data: tableConfig.data,
          rowCount: tableConfig.rowCount,
        };
      }
    }

    // Return placeholder for unloaded artifacts
    const placeholders = transformSummariesToPlaceholders([summary]);
    const placeholder = placeholders[0];

    let description = placeholder.description;
    if (summary.artifact_id === selectedArtifactId && isArtifactLoading) {
      description = "Loading...";
    } else if (!loadedArtifact) {
      description = "Click to load";
    }

    return {
      id: summary.artifact_id,
      name: placeholder.name,
      description,
      columns: [],
      data: [],
      rowCount: 0,
    };
  });
}

export function useTransparencyDrawer({
  isOpen,
  conversationId,
  runId,
  artifactSummaries,
}: UseTransparencyDrawerParams): UseTransparencyDrawerReturn {
  // Filter artifacts by category:
  // - Data tab: NOT "rag", NOT "e2b", NOT "iq", NOT memory
  // - Calls tab: "rag"
  // - Deep Research tab: "iq"
  const dataArtifactSummaries = useMemo(
    () =>
      artifactSummaries.filter(
        (s) =>
          s.category !== "e2b" &&
          s.category !== "rag" &&
          s.category !== "memory" &&
          s.category?.toLowerCase() !== "iq" &&
          !MEMORY_TOOL_NAMES.has(s.tool_name),
      ),
    [artifactSummaries],
  );

  const ragArtifactSummaries = useMemo(
    () => artifactSummaries.filter((s) => s.category === "rag"),
    [artifactSummaries],
  );

  const vonIqArtifactSummaries = useMemo(
    () => artifactSummaries.filter((s) => s.category?.toLowerCase() === "iq"),
    [artifactSummaries],
  );

  const ragArtifactIds = useMemo(
    () => ragArtifactSummaries.map((s) => s.artifact_id),
    [ragArtifactSummaries],
  );

  // State for Data tab artifact selection
  const [selectedDataArtifactId, setSelectedDataArtifactId] = useState<
    string | null
  >(null);

  // State for Deep Research tab artifact selection
  const [selectedVonIqArtifactId, setSelectedVonIqArtifactId] = useState<
    string | null
  >(null);

  // Shared cache for loaded artifacts
  const [loadedArtifacts, setLoadedArtifacts] = useState<
    Map<string, ArtifactResponse>
  >(new Map());

  // Fetch RAG artifacts when drawer opens (bulk fetch for Calls tab)
  const shouldFetchRagArtifacts = isOpen && ragArtifactIds.length > 0;

  const {
    data: bulkRagArtifacts,
    isLoading: isCallsLoading,
    error: callsError,
  } = useBulkArtifacts(
    shouldFetchRagArtifacts ? conversationId : null,
    shouldFetchRagArtifacts ? runId : null,
    shouldFetchRagArtifacts ? ragArtifactIds : [],
  );

  // Lazy load artifact content for Data tab
  const { data: fetchedDataArtifact, isLoading: isDataArtifactLoading } =
    useLazyArtifactContent(conversationId, runId, selectedDataArtifactId);

  // Lazy load artifact content for Deep Research tab
  const { data: fetchedVonIqArtifact, isLoading: isVonIqArtifactLoading } =
    useLazyArtifactContent(conversationId, runId, selectedVonIqArtifactId);

  // Reset state and clear cache when conversation/run changes
  useEffect(() => {
    setSelectedDataArtifactId(null);
    setSelectedVonIqArtifactId(null);
    setLoadedArtifacts(new Map());
    // Clear stale cache entries for the previous conversation/run
    clearCacheForRun(conversationId, runId);
  }, [conversationId, runId]);

  // Store fetched Data artifact in cache
  useEffect(() => {
    if (fetchedDataArtifact && selectedDataArtifactId) {
      setLoadedArtifacts((prev) => {
        const next = new Map(prev);
        next.set(selectedDataArtifactId, fetchedDataArtifact);
        // Use scoped cache key to avoid cross-conversation/tenant collisions
        const cacheKey = getCacheKey(
          conversationId,
          runId,
          selectedDataArtifactId,
        );
        artifactCache.set(cacheKey, fetchedDataArtifact);
        return next;
      });
    }
  }, [fetchedDataArtifact, selectedDataArtifactId, conversationId, runId]);

  // Store fetched VonIQ artifact in cache
  useEffect(() => {
    if (fetchedVonIqArtifact && selectedVonIqArtifactId) {
      setLoadedArtifacts((prev) => {
        const next = new Map(prev);
        next.set(selectedVonIqArtifactId, fetchedVonIqArtifact);
        // Use scoped cache key to avoid cross-conversation/tenant collisions
        const cacheKey = getCacheKey(
          conversationId,
          runId,
          selectedVonIqArtifactId,
        );
        artifactCache.set(cacheKey, fetchedVonIqArtifact);
        return next;
      });
    }
  }, [fetchedVonIqArtifact, selectedVonIqArtifactId, conversationId, runId]);

  // Auto-select first Data artifact when drawer opens
  useEffect(() => {
    if (isOpen && dataArtifactSummaries.length > 0 && !selectedDataArtifactId) {
      setSelectedDataArtifactId(dataArtifactSummaries[0].artifact_id);
    }
  }, [isOpen, dataArtifactSummaries, selectedDataArtifactId]);

  // Auto-select first VonIQ artifact when drawer opens
  useEffect(() => {
    if (
      isOpen &&
      vonIqArtifactSummaries.length > 0 &&
      !selectedVonIqArtifactId
    ) {
      setSelectedVonIqArtifactId(vonIqArtifactSummaries[0].artifact_id);
    }
  }, [isOpen, vonIqArtifactSummaries, selectedVonIqArtifactId]);

  // Reset selections when drawer closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedDataArtifactId(null);
      setSelectedVonIqArtifactId(null);
    }
  }, [isOpen]);

  // Restore cached artifacts when summaries change
  useEffect(() => {
    if (artifactSummaries.length > 0) {
      const cachedArtifacts = new Map<string, ArtifactResponse>();
      for (const summary of artifactSummaries) {
        // Use scoped cache key to retrieve from module cache
        const cacheKey = getCacheKey(
          conversationId,
          runId,
          summary.artifact_id,
        );
        const cached = artifactCache.get(cacheKey);
        if (cached) {
          cachedArtifacts.set(summary.artifact_id, cached);
        }
      }
      if (cachedArtifacts.size > 0) {
        setLoadedArtifacts(cachedArtifacts);
      }
    }
  }, [artifactSummaries, conversationId, runId]);

  // Transform Data artifacts to QueryResults
  const queries = useMemo(
    () =>
      transformArtifactsToQueries(
        dataArtifactSummaries,
        loadedArtifacts,
        selectedDataArtifactId,
        isDataArtifactLoading,
      ),
    [
      dataArtifactSummaries,
      loadedArtifacts,
      selectedDataArtifactId,
      isDataArtifactLoading,
    ],
  );

  // Transform VonIQ artifacts to IQQueryResults (for ReportTable display)
  const vonIqQueries = useMemo(
    () =>
      transformIQArtifactsToIQQueries(
        vonIqArtifactSummaries,
        loadedArtifacts,
        selectedVonIqArtifactId,
        isVonIqArtifactLoading,
      ),
    [
      vonIqArtifactSummaries,
      loadedArtifacts,
      selectedVonIqArtifactId,
      isVonIqArtifactLoading,
    ],
  );

  // Transform RAG artifacts to CallTranscripts and EmailTranscripts
  const { calls, emails } = useMemo(
    () => separateCallsAndEmails(bulkRagArtifacts),
    [bulkRagArtifacts],
  );

  const handleQuerySelect = useCallback((queryId: string) => {
    setSelectedDataArtifactId(queryId);
  }, []);

  const handleVonIqSelect = useCallback((queryId: string) => {
    setSelectedVonIqArtifactId(queryId);
  }, []);

  return {
    // Data tab
    queries,
    handleQuerySelect,
    // Calls tab
    calls,
    isCallsLoading,
    callsError: callsError as Error | null,
    // Emails tab
    emails,
    // Deep Research tab
    vonIqQueries,
    handleVonIqSelect,
    hasVonIqArtifacts: vonIqArtifactSummaries.length > 0,
  };
}
