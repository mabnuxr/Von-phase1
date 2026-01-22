/**
 * useTransparencyDrawer - Business logic for LazyTransparencyDrawer
 *
 * Handles:
 * - Artifact filtering by category (Data vs Calls/RAG)
 * - Lazy loading of artifact content for Data tab
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
  queries: TransparencyQueryResult[];
  calls: CallTranscript[];
  isCallsLoading: boolean;
  callsError: Error | null;
  handleQuerySelect: (queryId: string) => void;
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
  const dataArtifactSummaries = useMemo(
    () =>
      artifactSummaries.filter(
        (s) => s.category !== "e2b" && s.category !== "rag",
      ),
    [artifactSummaries],
  );

  const ragArtifactSummaries = useMemo(
    () => artifactSummaries.filter((s) => s.category === "rag"),
    [artifactSummaries],
  );

  const ragArtifactIds = useMemo(
    () => ragArtifactSummaries.map((s) => s.artifact_id),
    [ragArtifactSummaries],
  );

  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(
    null,
  );
  const [loadedArtifacts, setLoadedArtifacts] = useState<
    Map<string, ArtifactResponse>
  >(new Map());

  // Fetch RAG artifacts when drawer opens
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

  const { data: fetchedArtifact, isLoading: isArtifactLoading } =
    useLazyArtifactContent(conversationId, runId, selectedArtifactId);

  useEffect(() => {
    setSelectedArtifactId(null);
    setLoadedArtifacts(new Map());
  }, [conversationId, runId]);

  useEffect(() => {
    if (fetchedArtifact && selectedArtifactId) {
      setLoadedArtifacts((prev) => {
        const next = new Map(prev);
        next.set(selectedArtifactId, fetchedArtifact);
        artifactCache.set(selectedArtifactId, fetchedArtifact);
        return next;
      });
    }
  }, [fetchedArtifact, selectedArtifactId]);

  useEffect(() => {
    if (isOpen && dataArtifactSummaries.length > 0 && !selectedArtifactId) {
      setSelectedArtifactId(dataArtifactSummaries[0].artifact_id);
    }
  }, [isOpen, dataArtifactSummaries, selectedArtifactId]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedArtifactId(null);
    }
  }, [isOpen]);

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

  const queries = useMemo(
    () =>
      transformArtifactsToQueries(
        dataArtifactSummaries,
        loadedArtifacts,
        selectedArtifactId,
        isArtifactLoading,
      ),
    [
      dataArtifactSummaries,
      loadedArtifacts,
      selectedArtifactId,
      isArtifactLoading,
    ],
  );

  const calls = useMemo(
    () => transformBulkArtifactsToCalls(bulkRagArtifacts),
    [bulkRagArtifacts],
  );

  const handleQuerySelect = useCallback((queryId: string) => {
    setSelectedArtifactId(queryId);
  }, []);

  return {
    queries,
    calls,
    isCallsLoading,
    callsError: callsError as Error | null,
    handleQuerySelect,
  };
}
