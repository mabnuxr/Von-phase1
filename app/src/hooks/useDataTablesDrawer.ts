/**
 * useDataTablesDrawer - Business logic for DataTablesDrawer
 *
 * Handles:
 * - Fetching VonIQ artifacts from the sample run
 * - Lazy loading of artifact content when user selects a tab
 * - Transformation of artifacts to DataTableConfig format for DeepResearchDataTablesDrawer
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import type { DataTableConfig } from "@vonlabs/design-components";
import {
  useDeepResearchArtifacts,
  useLazyArtifactContent,
} from "./useMessageArtifacts";
import { transformIQArtifactToDataTable } from "../utils/transformArtifactsToTransparency";
import type { ArtifactResponse } from "../services/conversationsService";

export interface UseDataTablesDrawerParams {
  isOpen: boolean;
  conversationId: string | null;
  runId: string | null;
}

export interface UseDataTablesDrawerReturn {
  /** Data tables for DeepResearchDataTablesDrawer */
  tables: DataTableConfig[];
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

  // Transform artifacts to DataTableConfig format for DeepResearchDataTablesDrawer
  const tables = useMemo((): DataTableConfig[] => {
    return vonIqArtifacts
      .map((summary) => {
        const loadedArtifact = loadedArtifacts.get(summary.artifact_id);
        const isCurrentlyLoading =
          summary.artifact_id === selectedArtifactId && isArtifactLoading;

        // If artifact is loaded, transform it
        if (loadedArtifact) {
          const table = transformIQArtifactToDataTable(loadedArtifact);
          if (table) {
            return table;
          }
        }

        // Return a placeholder for unloaded artifacts
        return {
          id: summary.artifact_id,
          name: summary.tool_name || `Table ${summary.artifact_id.slice(0, 8)}`,
          description: isCurrentlyLoading ? "Loading..." : summary.artifact_type,
          columns: [],
          data: [],
          rowCount: 0,
        } as DataTableConfig;
      })
      .filter((table): table is DataTableConfig => table !== null);
  }, [vonIqArtifacts, loadedArtifacts, selectedArtifactId, isArtifactLoading]);

  // Handle artifact selection
  const handleArtifactSelect = useCallback((artifactId: string) => {
    setSelectedArtifactId(artifactId);
  }, []);

  return {
    tables,
    selectedArtifactId,
    handleArtifactSelect,
    dataTablesInfo,
    isLoading: isListLoading,
    error: listError as Error | null,
  };
}
