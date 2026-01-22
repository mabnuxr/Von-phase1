/**
 * Utility functions for transforming RAG artifacts to CallTranscript format
 *
 * These functions are shared between:
 * - useTransparencyDrawer (bulk RAG artifacts for Calls tab)
 * - SingleArtifactDrawerContainer (single RAG artifact)
 */

import type { CallTranscript } from "@vonlabs/design-components";
import type { ArtifactResponse } from "../services/conversationsService";

/**
 * Extract call title from row data
 */
export function extractCallTitle(row: Record<string, unknown>): string {
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

/**
 * Extract call date from row data
 */
export function extractCallDate(row: Record<string, unknown>): string {
  if (row.start_time_iso) {
    return String(row.start_time_iso);
  }
  if (typeof row.start_time === "number") {
    return new Date(row.start_time * 1000).toISOString();
  }
  return new Date().toISOString();
}

/**
 * Transform a single artifact's rows to CallTranscript array
 * Used for extracting calls from one artifact's sample.rows
 */
export function transformRowsToCalls(
  rows: Array<Record<string, unknown>>,
  seenIds?: Set<string>,
): CallTranscript[] {
  const seen = seenIds ?? new Set<string>();
  const calls: CallTranscript[] = [];

  for (const row of rows) {
    if (row.type !== "call") continue;

    const callId = String(row.conversation_id || row.id || Math.random());

    if (seen.has(callId)) continue;
    seen.add(callId);

    calls.push({
      id: callId,
      title: extractCallTitle(row),
      date: extractCallDate(row),
      sourceUrl: row.deep_link ? String(row.deep_link) : undefined,
      meetingUrl: row.meeting_url ? String(row.meeting_url) : undefined,
      summary: row.chunk_text ? String(row.chunk_text) : undefined,
    });
  }

  return calls;
}

/**
 * Transform multiple RAG artifacts to CallTranscript array
 * Used by useTransparencyDrawer for bulk RAG artifacts
 */
export function transformBulkArtifactsToCalls(
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

    const calls = transformRowsToCalls(content.sample.rows, seenIds);
    allCalls.push(...calls);
  }

  return allCalls.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

/**
 * Transform a single RAG artifact to CallTranscript array
 * Used by SingleArtifactDrawerContainer
 */
export function transformSingleArtifactToCalls(
  artifact: ArtifactResponse,
): CallTranscript[] {
  const content = artifact.content as {
    sample?: {
      rows?: Array<Record<string, unknown>>;
    };
  };

  if (!content.sample?.rows) {
    return [];
  }

  const calls = transformRowsToCalls(content.sample.rows);

  return calls.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

/**
 * Check if the artifact is a RAG/conversation search artifact
 */
export function isRagArtifact(toolName: string): boolean {
  return toolName === "execute_conversation_search";
}
