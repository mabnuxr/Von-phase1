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
  // Prefer call_title, then conversation_title
  const rawTitle = row.call_title || row.conversation_title;
  if (rawTitle) {
    const title = String(rawTitle);
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
  // Prefer call_start_time (ISO string), then start_time_iso, then start_time (unix)
  if (row.call_start_time) {
    return String(row.call_start_time);
  }
  if (row.start_time_iso) {
    return String(row.start_time_iso);
  }
  if (typeof row.start_time === "number") {
    return new Date(row.start_time * 1000).toISOString();
  }
  return new Date().toISOString();
}

/**
 * Extract participants from speaker name fields
 */
function extractParticipants(row: Record<string, unknown>): string[] {
  const participants: string[] = [];

  const addNames = (field: unknown) => {
    if (Array.isArray(field)) {
      for (const name of field) {
        if (typeof name === "string" && name.trim()) {
          participants.push(name.trim());
        }
      }
    }
  };

  addNames(row.external_speaker_names);
  addNames(row.internal_speaker_names);

  return participants;
}

/**
 * Compute duration string from start/end times
 */
function extractDuration(row: Record<string, unknown>): string | undefined {
  const startStr = row.call_start_time || row.start_time_iso;
  const endStr = row.call_end_time || row.end_time_iso;

  if (!startStr || !endStr) return undefined;

  const start = new Date(String(startStr)).getTime();
  const end = new Date(String(endStr)).getTime();

  if (isNaN(start) || isNaN(end) || end <= start) return undefined;

  const diffMs = end - start;
  const totalMinutes = Math.round(diffMs / 60000);

  if (totalMinutes < 60) {
    return `${totalMinutes}m`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
}

/**
 * Compute time range string (e.g., "3:00 PM - 3:30 PM")
 */
function extractTimeRange(row: Record<string, unknown>): string | undefined {
  const startStr = row.call_start_time || row.start_time_iso;
  const endStr = row.call_end_time || row.end_time_iso;

  if (!startStr || !endStr) return undefined;

  const start = new Date(String(startStr));
  const end = new Date(String(endStr));

  if (isNaN(start.getTime()) || isNaN(end.getTime())) return undefined;

  const fmt = (d: Date) =>
    d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

  return `${fmt(start)} – ${fmt(end)}`;
}

/**
 * Extract summary from row data - prefers the rich summary field over chunk_text
 */
function extractSummary(row: Record<string, unknown>): string | undefined {
  if (typeof row.summary === "string" && row.summary.trim()) {
    return row.summary;
  }
  if (typeof row.chunk_text === "string" && row.chunk_text.trim()) {
    return row.chunk_text;
  }
  return undefined;
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
    const callId =
      row.conversation_id ||
      row.call_id ||
      row.id ||
      row.deep_link ||
      row.meeting_url;

    if (!callId) continue;

    const callIdStr = String(callId);

    if (seen.has(callIdStr)) continue;
    seen.add(callIdStr);

    const participants = extractParticipants(row);

    calls.push({
      id: callIdStr,
      title: extractCallTitle(row),
      date: extractCallDate(row),
      duration: extractDuration(row),
      timeRange: extractTimeRange(row),
      participants: participants.length > 0 ? participants : undefined,
      sourceUrl: row.deep_link ? String(row.deep_link) : undefined,
      meetingUrl: row.meeting_url ? String(row.meeting_url) : undefined,
      summary: extractSummary(row),
      relevanceScore:
        typeof row.relevance_score === "number"
          ? row.relevance_score
          : undefined,
      recencyScore:
        typeof row.recency_score === "number" ? row.recency_score : undefined,
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
      rows?: Array<Record<string, unknown>>;
    };

    // Support both formats: rows nested under sample or at top level
    const rows = content.sample?.rows || content.rows;
    if (!rows) continue;

    const calls = transformRowsToCalls(rows, seenIds);
    allCalls.push(...calls);
  }

  // Sort by relevance_score (highest first), use recency_score as tiebreaker
  return allCalls.sort((a, b) => {
    const relevanceA = a.relevanceScore ?? 0;
    const relevanceB = b.relevanceScore ?? 0;

    // Primary sort: by relevance score descending
    if (relevanceA !== relevanceB) {
      return relevanceB - relevanceA;
    }

    // Tiebreaker: by recency score descending (more recent = higher score)
    const recencyA = a.recencyScore ?? 0;
    const recencyB = b.recencyScore ?? 0;

    if (recencyA !== recencyB) {
      return recencyB - recencyA;
    }

    // Final fallback: by date descending (shouldn't reach here if recency_score exists)
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
}

/**
 * Transform a single RAG artifact to CallTranscript array
 * Used by SingleArtifactDrawerContainer
 */
export function transformSingleArtifactToCalls(
  artifact: ArtifactResponse,
): CallTranscript[] {
  return transformBulkArtifactsToCalls([artifact]);
}

/**
 * Check if the artifact is a RAG/conversation search artifact
 */
export function isRagArtifact(category: string): boolean {
  return category === "rag";
}
