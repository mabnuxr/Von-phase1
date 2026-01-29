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
  TransparencyQueryResult,
} from "@vonlabs/design-components";
import {
  useLazyArtifactContent,
  useBulkArtifacts,
} from "./useMessageArtifacts";
import {
  transformSingleArtifact,
  transformSummariesToPlaceholders,
  type ArtifactSummary,
} from "../utils/transformArtifactsToTransparency";
import { transformBulkArtifactsToCalls } from "../utils/transformArtifactsToCalls";
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
  // Deep Research tab (VonIQ artifacts)
  vonIqQueries: TransparencyQueryResult[];
  handleVonIqSelect: (queryId: string) => void;
  hasVonIqArtifacts: boolean;
}

const artifactCache = new Map<string, ArtifactResponse>();

function transformArtifactsToQueries(
  dataArtifactSummaries: ArtifactSummary[],
  loadedArtifacts: Map<string, ArtifactResponse>,
  selectedArtifactId: string | null,
  isArtifactLoading: boolean,
): TransparencyQueryResult[] {
  if (dataArtifactSummaries.length === 0) {
    return [];
  }

  return dataArtifactSummaries.map((summary) => {
    const loadedArtifact = loadedArtifacts.get(summary.artifact_id);

    if (loadedArtifact) {
      const result = transformSingleArtifact(loadedArtifact);
      if (result) {
        return result;
      }
    }

    const placeholders = transformSummariesToPlaceholders([summary]);
    const placeholder = placeholders[0];

    if (summary.artifact_id === selectedArtifactId && isArtifactLoading) {
      placeholder.description = "Loading...";
    } else if (!loadedArtifact) {
      placeholder.description = "Click to load";
    }

    return placeholder;
  });
}

export function useTransparencyDrawer({
  isOpen,
  conversationId,
  runId,
  artifactSummaries,
}: UseTransparencyDrawerParams): UseTransparencyDrawerReturn {
  // Filter artifacts by category:
  // - Data tab: NOT "rag", NOT "e2b", NOT "iq"
  // - Calls tab: "rag"
  // - Deep Research tab: "iq"
  const dataArtifactSummaries = useMemo(
    () =>
      artifactSummaries.filter(
        (s) =>
          s.category !== "e2b" &&
          s.category !== "rag" &&
          s.category?.toLowerCase() !== "iq",
      ),
    [artifactSummaries],
  );

  const ragArtifactSummaries = useMemo(
    () => artifactSummaries.filter((s) => s.category === "rag"),
    [artifactSummaries],
  );

  const vonIqArtifactSummaries = useMemo(
    () =>
      artifactSummaries.filter((s) => s.category?.toLowerCase() === "iq"),
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

  // Reset state when conversation/run changes
  useEffect(() => {
    setSelectedDataArtifactId(null);
    setSelectedVonIqArtifactId(null);
    setLoadedArtifacts(new Map());
  }, [conversationId, runId]);

  // Store fetched Data artifact in cache
  useEffect(() => {
    if (fetchedDataArtifact && selectedDataArtifactId) {
      setLoadedArtifacts((prev) => {
        const next = new Map(prev);
        next.set(selectedDataArtifactId, fetchedDataArtifact);
        artifactCache.set(selectedDataArtifactId, fetchedDataArtifact);
        return next;
      });
    }
  }, [fetchedDataArtifact, selectedDataArtifactId]);

  // Store fetched VonIQ artifact in cache
  useEffect(() => {
    if (fetchedVonIqArtifact && selectedVonIqArtifactId) {
      setLoadedArtifacts((prev) => {
        const next = new Map(prev);
        next.set(selectedVonIqArtifactId, fetchedVonIqArtifact);
        artifactCache.set(selectedVonIqArtifactId, fetchedVonIqArtifact);
        return next;
      });
    }
  }, [fetchedVonIqArtifact, selectedVonIqArtifactId]);

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
        const cached = artifactCache.get(summary.artifact_id);
        if (cached) {
          cachedArtifacts.set(summary.artifact_id, cached);
        }
      }
      if (cachedArtifacts.size > 0) {
        setLoadedArtifacts(cachedArtifacts);
      }
    }
  }, [artifactSummaries]);

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

  // Transform VonIQ artifacts to QueryResults
  const vonIqQueries = useMemo(
    () =>
      transformArtifactsToQueries(
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

  // Transform RAG artifacts to CallTranscripts
  const calls = useMemo(
    () => transformBulkArtifactsToCalls(bulkRagArtifacts),
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
    // Deep Research tab
    vonIqQueries,
    handleVonIqSelect,
    hasVonIqArtifacts: vonIqArtifactSummaries.length > 0,
  };
}
