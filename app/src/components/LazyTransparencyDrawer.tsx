/**
 * LazyTransparencyDrawer - Wrapper that adds lazy loading for artifacts
 *
 * This component wraps the TransparencyDrawer and handles fetching
 * artifact content on-demand when the user clicks on a specific artifact tab.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  TransparencyDrawer,
  type TransparencyQueryResult,
  type CallTranscript,
} from '@vonlabs/design-components';
import { useLazyArtifactContent } from '../hooks/useMessageArtifacts';
import {
  transformSingleArtifact,
  transformSummariesToPlaceholders,
  type ArtifactSummary,
} from '../utils/transformArtifactsToTransparency';
import type { ArtifactResponse } from '../services/conversationsService';

interface LazyTransparencyDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  conversationId: string | null;
  runId: string | null;
  artifactSummaries: ArtifactSummary[];
  isListLoading: boolean;
}

/**
 * Cache for loaded artifacts to avoid re-fetching
 */
const artifactCache = new Map<string, ArtifactResponse>();

export const LazyTransparencyDrawer: React.FC<LazyTransparencyDrawerProps> = ({
  isOpen,
  onClose,
  title = 'Sources',
  conversationId,
  runId,
  artifactSummaries,
  isListLoading,
}) => {
  // Track which artifact is currently selected (for lazy loading)
  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(null);

  // Track loaded artifacts content
  const [loadedArtifacts, setLoadedArtifacts] = useState<Map<string, ArtifactResponse>>(new Map());

  // Fetch the selected artifact's content
  const { data: fetchedArtifact, isLoading: isArtifactLoading } = useLazyArtifactContent(
    conversationId,
    runId,
    selectedArtifactId
  );

  // When artifact is fetched, add it to our loaded artifacts map
  useEffect(() => {
    if (fetchedArtifact && selectedArtifactId) {
      setLoadedArtifacts((prev) => {
        const next = new Map(prev);
        next.set(selectedArtifactId, fetchedArtifact);
        // Also update the global cache
        artifactCache.set(selectedArtifactId, fetchedArtifact);
        return next;
      });
    }
  }, [fetchedArtifact, selectedArtifactId]);

  // When drawer opens with summaries, auto-select the first artifact
  useEffect(() => {
    if (isOpen && artifactSummaries.length > 0 && !selectedArtifactId) {
      setSelectedArtifactId(artifactSummaries[0].artifact_id);
    }
  }, [isOpen, artifactSummaries, selectedArtifactId]);

  // Reset state when drawer closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedArtifactId(null);
      // Keep the loaded artifacts for potential cache reuse
    }
  }, [isOpen]);

  // Initialize loaded artifacts from cache when summaries change
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

  // Transform loaded artifacts and summaries into QueryResults
  const queries: TransparencyQueryResult[] = useMemo(() => {
    if (artifactSummaries.length === 0) {
      return [];
    }

    return artifactSummaries.map((summary) => {
      const loadedArtifact = loadedArtifacts.get(summary.artifact_id);

      if (loadedArtifact) {
        // Transform the loaded artifact to QueryResult
        const result = transformSingleArtifact(loadedArtifact);
        if (result) {
          return result;
        }
      }

      // Return a placeholder for not-yet-loaded artifacts
      const placeholders = transformSummariesToPlaceholders([summary]);
      const placeholder = placeholders[0];

      // Update description based on loading state
      if (summary.artifact_id === selectedArtifactId && isArtifactLoading) {
        placeholder.description = 'Loading...';
      } else if (!loadedArtifact) {
        placeholder.description = 'Click to load';
      }

      return placeholder;
    });
  }, [artifactSummaries, loadedArtifacts, selectedArtifactId, isArtifactLoading]);

  // Extract calls from loaded artifacts
  const calls: CallTranscript[] = useMemo(() => {
    const allCalls: CallTranscript[] = [];

    for (const artifact of loadedArtifacts.values()) {
      if (artifact.tool_name !== 'execute_conversation_search') continue;

      const content = artifact.content as {
        sample?: {
          rows?: Array<Record<string, unknown>>;
        };
      };

      if (!content.sample?.rows) continue;

      for (const row of content.sample.rows) {
        if (row.type !== 'call') continue;

        const call: CallTranscript = {
          id: String(row.conversation_id || row.id),
          title: String(row.chunk_text || '').slice(0, 100) + '...',
          date: row.start_time_iso
            ? String(row.start_time_iso)
            : new Date((row.start_time as number) * 1000).toISOString(),
          sourceUrl: row.deep_link ? String(row.deep_link) : undefined,
          summary: row.chunk_text ? String(row.chunk_text).slice(0, 500) : undefined,
        };

        if (!allCalls.find((c) => c.id === call.id)) {
          allCalls.push(call);
        }
      }
    }

    return allCalls;
  }, [loadedArtifacts]);

  // Handle query tab selection - trigger lazy load
  const handleQuerySelect = useCallback((queryId: string) => {
    // Always update the selected artifact ID
    // This will trigger a fetch if the artifact isn't already loaded/cached by React Query
    setSelectedArtifactId(queryId);
  }, []);

  return (
    <TransparencyDrawer
      isOpen={isOpen}
      onClose={onClose}
      queries={queries}
      calls={calls}
      title={title}
      isLoading={isListLoading}
      onQuerySelect={handleQuerySelect}
    />
  );
};

export default LazyTransparencyDrawer;
