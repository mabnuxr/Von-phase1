/**
 * useDataTablesDrawer - Business logic for DataTablesDrawer
 *
 * Handles:
 * - Fetching VonIQ artifacts from the sample run
 * - Lazy loading of artifact content when user selects a tab
 * - Transformation of artifacts to QueryResults
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import type {
  TransparencyQueryResult,
  DataTableArtifact,
} from "@vonlabs/design-components";
import {
  useDeepResearchArtifacts,
  useLazyArtifactContent,
} from "./useMessageArtifacts";
import { transformSingleArtifact } from "../utils/transformArtifactsToTransparency";
import type { ArtifactResponse } from "../services/conversationsService";

export interface UseDataTablesDrawerParams {
  isOpen: boolean;
  conversationId: string | null;
  runId: string | null;
}

export interface UseDataTablesDrawerReturn {
  /** Artifacts transformed for display */
  artifacts: DataTableArtifact[];
  /** Currently selected artifact ID */
  selectedArtifactId: string | null;
  /** Handler for artifact selection */
  handleArtifactSelect: (artifactId: string) => void;
  /** Data tables info for the DataTablesCard */
  dataTablesInfo: {
    tableCount: number;
    processedRecords?: number;
    totalRecords?: number;
  } | null;
  /** Whether the initial list is loading */
  isLoading: boolean;
  /** Error if any */
  error: Error | null;
}

// Module-level cache for loaded artifacts
const artifactCache = new Map<string, ArtifactResponse>();

export function useDataTablesDrawer({
  isOpen,
  conversationId,
  runId,
}: UseDataTablesDrawerParams): UseDataTablesDrawerReturn {
  // Fetch VonIQ artifacts for the message
  const {
    vonIqArtifacts,
    dataTablesInfo,
    isLoading: isListLoading,
    error: listError,
  } = useDeepResearchArtifacts(conversationId, runId);

  // Track selected artifact and loaded content
  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(
    null,
  );
  const [loadedArtifacts, setLoadedArtifacts] = useState<
    Map<string, ArtifactResponse>
  >(new Map());

  // Fetch content for selected artifact
  const { data: fetchedArtifact, isLoading: isArtifactLoading } =
    useLazyArtifactContent(conversationId, runId, selectedArtifactId);

  // Reset state when conversation/run changes
  useEffect(() => {
    setSelectedArtifactId(null);
    setLoadedArtifacts(new Map());
  }, [conversationId, runId]);

  // Store fetched artifact in local cache
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

  // Auto-select first artifact when drawer opens
  useEffect(() => {
    if (isOpen && vonIqArtifacts.length > 0 && !selectedArtifactId) {
      setSelectedArtifactId(vonIqArtifacts[0].artifact_id);
    }
  }, [isOpen, vonIqArtifacts, selectedArtifactId]);

  // Clear selection when drawer closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedArtifactId(null);
    }
  }, [isOpen]);

  // Restore cached artifacts when summaries change
  useEffect(() => {
    if (vonIqArtifacts.length > 0) {
      const cachedArtifacts = new Map<string, ArtifactResponse>();
      for (const summary of vonIqArtifacts) {
        const cached = artifactCache.get(summary.artifact_id);
        if (cached) {
          cachedArtifacts.set(summary.artifact_id, cached);
        }
      }
      if (cachedArtifacts.size > 0) {
        setLoadedArtifacts(cachedArtifacts);
      }
    }
  }, [vonIqArtifacts]);

  // Transform artifacts for display
  const artifacts = useMemo((): DataTableArtifact[] => {
    return vonIqArtifacts.map((summary) => {
      const loadedArtifact = loadedArtifacts.get(summary.artifact_id);
      const isCurrentlyLoading =
        summary.artifact_id === selectedArtifactId && isArtifactLoading;

      let data: TransparencyQueryResult | undefined;
      if (loadedArtifact) {
        const result = transformSingleArtifact(loadedArtifact);
        if (result) {
          data = result;
        }
      }

      return {
        id: summary.artifact_id,
        name: summary.tool_name || `Table ${summary.artifact_id.slice(0, 8)}`,
        description: summary.artifact_type,
        category: summary.category,
        isLoading: isCurrentlyLoading,
        data,
      };
    });
  }, [vonIqArtifacts, loadedArtifacts, selectedArtifactId, isArtifactLoading]);

  // Handle artifact selection
  const handleArtifactSelect = useCallback((artifactId: string) => {
    setSelectedArtifactId(artifactId);
  }, []);

  return {
    artifacts,
    selectedArtifactId,
    handleArtifactSelect,
    dataTablesInfo,
    isLoading: isListLoading,
    error: listError as Error | null,
  };
}
