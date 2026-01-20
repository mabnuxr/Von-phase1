/**
 * useTransparencyDrawer - Business logic for LazyTransparencyDrawer
 *
 * Handles:
 * - Artifact filtering by category (Data vs Calls/RAG)
 * - Lazy loading of artifact content
 * - Bulk fetching of RAG artifacts when Calls tab is visited
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
  handleTabChange: (tabId: string) => void;
}

const artifactCache = new Map<string, ArtifactResponse>();

function extractCallTitle(row: Record<string, unknown>): string {
  if (row.conversation_title) {
    const title = String(row.conversation_title);
    return title.length > 100 ? title.slice(0, 100) + "..." : title;
  }

  const chunkText = String(row.chunk_text || "");
  const titleMatch = chunkText.match(/^(?:=+\s*)?(.+?)(?:\s*=+)?$/m);
  const extractedTitle = titleMatch?.[1]?.trim() || chunkText.slice(0, 100);

  if (!extractedTitle) return "Untitled Call";
  return extractedTitle.length > 100
    ? extractedTitle.slice(0, 100) + "..."
    : extractedTitle;
}

function extractCallDate(row: Record<string, unknown>): string {
  if (row.start_time_iso) {
    return String(row.start_time_iso);
  }
  return new Date((row.start_time as number) * 1000).toISOString();
}

function transformArtifactsToCalls(
  bulkRagArtifacts:
    | ArtifactResponse[]
    | { artifacts?: ArtifactResponse[] }
    | undefined,
): CallTranscript[] {
  const artifacts = Array.isArray(bulkRagArtifacts)
    ? bulkRagArtifacts
    : bulkRagArtifacts?.artifacts;

  if (!artifacts || artifacts.length === 0) {
    return [];
  }

  const allCalls: CallTranscript[] = [];
  const seenIds = new Set<string>();

  for (const artifact of artifacts) {
    const content = artifact.content as {
      sample?: {
        rows?: Array<Record<string, unknown>>;
      };
    };

    if (!content.sample?.rows) continue;

    for (const row of content.sample.rows) {
      if (row.type !== "call") continue;

      const callId = String(row.conversation_id || row.id);

      if (seenIds.has(callId)) continue;
      seenIds.add(callId);

      allCalls.push({
        id: callId,
        title: extractCallTitle(row),
        date: extractCallDate(row),
        sourceUrl: row.deep_link ? String(row.deep_link) : undefined,
        summary: row.chunk_text ? String(row.chunk_text) : undefined,
      });
    }
  }

  return allCalls.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
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

  const [hasVisitedCallsTab, setHasVisitedCallsTab] = useState(false);
  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(
    null,
  );
  const [loadedArtifacts, setLoadedArtifacts] = useState<
    Map<string, ArtifactResponse>
  >(new Map());

  const {
    data: bulkRagArtifacts,
    isLoading: isCallsLoading,
    error: callsError,
  } = useBulkArtifacts(
    hasVisitedCallsTab ? conversationId : null,
    hasVisitedCallsTab ? runId : null,
    hasVisitedCallsTab ? ragArtifactIds : [],
  );

  const { data: fetchedArtifact, isLoading: isArtifactLoading } =
    useLazyArtifactContent(conversationId, runId, selectedArtifactId);

  useEffect(() => {
    setHasVisitedCallsTab(false);
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
    () => transformArtifactsToCalls(bulkRagArtifacts),
    [bulkRagArtifacts],
  );

  const handleQuerySelect = useCallback((queryId: string) => {
    setSelectedArtifactId(queryId);
  }, []);

  const handleTabChange = useCallback(
    (tabId: string) => {
      if (tabId === "calls" && !hasVisitedCallsTab) {
        setHasVisitedCallsTab(true);
      }
    },
    [hasVisitedCallsTab],
  );

  return {
    queries,
    calls,
    isCallsLoading,
    callsError: callsError as Error | null,
    handleQuerySelect,
    handleTabChange,
  };
}
