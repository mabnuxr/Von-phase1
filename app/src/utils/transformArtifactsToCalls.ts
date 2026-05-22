/**
 * Utility functions for transforming RAG artifacts to CallTranscript format
 *
 * These functions are shared between:
 * - useTransparencyDrawer (bulk RAG artifacts for Calls tab)
 * - SingleArtifactDrawerContainer (single RAG artifact)
 */

import type {
  CallTranscript,
  EmailTranscript,
  SlackTranscript,
  SlackTimelineEntry,
} from "@vonlabs/design-components";
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

  // Coerce start_time to number (handles both number type and numeric strings)
  const startTime =
    typeof row.start_time === "number"
      ? row.start_time
      : typeof row.start_time === "string"
        ? Number(row.start_time)
        : null;

  if (startTime !== null && isFinite(startTime)) {
    const timestamp = startTime * 1000;
    const date = new Date(timestamp);
    // Validate the date is valid before calling toISOString
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
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
 * Check if the artifact is a RAG/conversation search artifact
 */
export function isRagArtifact(category: string): boolean {
  return category === "rag";
}

/**
 * Clean email content by removing HTML tags, excessive whitespace, and template artifacts
 */
function cleanEmailContent(content: string): string {
  if (!content || !content.trim()) {
    return "";
  }

  let cleaned = content;

  // Remove HTML tags
  cleaned = cleaned.replace(/<[^>]*>/g, "");

  // Remove common email template footers/buttons (case insensitive)
  const footerPatterns = [
    /Request Access to Recording.*?→/gi,
    /Ask Fathom!.*/gi,
    /Try Ask Fathom.*?→/gi,
    /Ask our AI Assistant.*/gi,
    /It's ChatGPT for your meetings!.*/gi,
    /View in browser.*/gi,
    /Unsubscribe.*/gi,
  ];

  footerPatterns.forEach((pattern) => {
    cleaned = cleaned.replace(pattern, "");
  });

  // Normalize whitespace: replace multiple newlines with max 2, trim spaces
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");
  cleaned = cleaned.replace(/[ \t]+/g, " ");
  cleaned = cleaned.trim();

  return cleaned;
}

/**
 * Extract email subject from content
 * Tries to find "Subject:" header pattern, otherwise uses first line
 */
function extractEmailSubject(content: string): string {
  if (!content || !content.trim()) {
    return "No Subject";
  }

  // Try to extract subject from common email header patterns
  const subjectMatch = content.match(/^Subject:\s*(.+?)$/im);
  if (subjectMatch && subjectMatch[1].trim()) {
    return subjectMatch[1].trim().slice(0, 100);
  }

  // Fallback: use first line (truncated)
  const firstLine = content.split("\n")[0].trim();
  if (firstLine) {
    return firstLine.slice(0, 100);
  }

  return "No Subject";
}

/**
 * Transform a single row to EmailTranscript
 */
function transformRowToEmail(
  row: Record<string, unknown>,
  seenIds: Set<string>,
): EmailTranscript | null {
  const id = String(row.conversation_id || row.id || "");
  if (!id || seenIds.has(id)) return null;
  seenIds.add(id);

  // Backend provides best_chunk_text for conversation search results
  const rawContent = String(
    row.best_chunk_text || row.content || row.chunk_text || "",
  );
  if (!rawContent.trim()) return null;

  // Clean up HTML, excessive whitespace, and email template artifacts
  const content = cleanEmailContent(rawContent);
  if (!content.trim()) return null;

  // Use conversation_title as subject if available, otherwise extract from content
  const subject = row.conversation_title
    ? String(row.conversation_title)
    : extractEmailSubject(content);
  const preview = content.slice(0, 200).trim();

  return {
    id,
    type: "email",
    subject,
    preview,
    content,
    // Use the same validated date extraction as calls
    date: extractCallDate(row),
    sender: row.sender ? String(row.sender) : undefined,
    recipients:
      Array.isArray(row.recipients) && row.recipients.length > 0
        ? row.recipients.map(String)
        : undefined,
    crmObjectType: row.crm_object_type
      ? String(row.crm_object_type)
      : undefined,
    crmObjectId: row.crm_object_id ? String(row.crm_object_id) : undefined,
    relevanceScore:
      typeof row.relevance_score === "number" ? row.relevance_score : undefined,
    recencyScore:
      typeof row.recency_score === "number" ? row.recency_score : undefined,
  };
}

/**
 * Sort function for conversations by date descending (most recent first)
 */
function sortByDateDescending(
  a: { date?: string | null },
  b: { date?: string | null },
): number {
  const timeA = a.date ? new Date(a.date).getTime() : 0;
  const timeB = b.date ? new Date(b.date).getTime() : 0;
  return timeB - timeA;
}

/**
 * Content shape for fetch_conversation artifacts
 */
type FetchConversationContent = {
  conversation_id?: string;
  conversation_type?: string;
  success?: boolean;
  error_message?: string;
  call_content?: {
    summary?: string;
    transcript?: string;
  };
  call_metadata?: {
    call_title?: string;
    call_start_time?: string;
    call_end_time?: string;
    call_duration_seconds?: number;
    provider?: string;
    speakers?: Array<{ name?: string; email?: string; type?: string }>;
    deep_link?: string;
    meeting_url?: string;
  };
  // Email-specific fields (for email fetch_conversation artifacts)
  email_content?: {
    content?: string;
    body?: string;
    subject?: string;
  };
  email_metadata?: {
    sender?: string;
    from?: string;
    recipients?: string[];
    to?: string[];
    date?: string;
    start_time?: string;
    subject?: string;
  };
  // Slack-specific fields (for slack_message / slack_thread fetch_conversation artifacts)
  slack_content?: {
    channel_id?: string;
    channel_name?: string;
    thread_ts?: string;
    hit_chunk_index?: number;
    window_size?: number;
    timeline?: Array<{
      type?: string;
      chunk_index?: number;
      chunk_text?: string;
      start_ts?: number;
    }>;
    thread_chunk_count?: number;
    context_chunk_count?: number;
    message_chunk_count?: number;
    thread_count_in_window?: number;
  };
};

/**
 * Convert a Unix epoch second (or numeric string) to ISO date string.
 * Used to normalize Slack `start_time` / `hit_start_ts` to the date string
 * SlackTranscript carries.
 */
function unixToIso(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const num =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : NaN;
  if (!isFinite(num) || num <= 0) return null;
  const d = new Date(num * 1000);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

/**
 * Check if artifact content is a fetch_conversation shape
 */
function isFetchConversationContent(content: Record<string, unknown>): boolean {
  return "conversation_id" in content && "conversation_type" in content;
}

/**
 * Format duration seconds to a human-readable string (e.g., "7m", "1h 30m")
 */
function formatDurationSeconds(seconds: number): string {
  const totalMinutes = Math.round(seconds / 60);
  if (totalMinutes < 60) {
    return `${totalMinutes}m`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
}

/**
 * Transform a single Slack row from execute_conversation_search /
 * find_entity_conversations into a SlackTranscript.
 *
 * Backend row shape (see SlackResultRow in slack_helpers.py):
 *   type, conversation_id, channel_id, channel_name?, thread_ts?,
 *   hit_chunk_index?, hit_start_ts?, start_time?, chunk_text?,
 *   participant_emails: string[], message_count?, relevance_score?,
 *   recency_score? (topic_search only)
 */
function transformRowToSlack(
  row: Record<string, unknown>,
  seenIds: Set<string>,
): SlackTranscript | null {
  const rawType = row.type;
  if (rawType !== "slack_message" && rawType !== "slack_thread") return null;

  const id = String(row.conversation_id || row.channel_id || "");
  if (!id || seenIds.has(id)) return null;
  seenIds.add(id);

  const channelId = String(row.channel_id || row.conversation_id || "");
  const channelName = row.channel_name ? String(row.channel_name) : undefined;
  const threadTs = row.thread_ts ? String(row.thread_ts) : undefined;
  const chunkText = row.chunk_text ? String(row.chunk_text) : undefined;
  const hitChunkIndex =
    typeof row.hit_chunk_index === "number" ? row.hit_chunk_index : undefined;
  const messageCount =
    typeof row.message_count === "number" ? row.message_count : undefined;
  const participants = Array.isArray(row.participant_emails)
    ? row.participant_emails
        .map((e) => (typeof e === "string" ? e : null))
        .filter((e): e is string => Boolean(e))
    : undefined;

  // Prefer hit_start_ts (set by both formatters), fall back to start_time.
  const date =
    unixToIso(row.hit_start_ts) ||
    unixToIso(row.start_time) ||
    new Date().toISOString();

  return {
    id,
    type: rawType,
    channelId,
    channelName,
    threadTs,
    date,
    chunkText,
    participants,
    messageCount,
    hitChunkIndex,
    relevanceScore:
      typeof row.relevance_score === "number" ? row.relevance_score : undefined,
    recencyScore:
      typeof row.recency_score === "number" ? row.recency_score : undefined,
  };
}

/**
 * Transform a fetch_conversation artifact (slack_message / slack_thread) into
 * a SlackTranscript carrying the chronological `timeline` for the drawer.
 */
function transformFetchConversationToSlack(
  content: FetchConversationContent,
  seenIds: Set<string>,
): SlackTranscript | null {
  const convType = content.conversation_type;
  if (convType !== "slack_message" && convType !== "slack_thread") return null;

  const id = content.conversation_id;
  if (!id || seenIds.has(id)) return null;
  seenIds.add(id);

  const slackContent = content.slack_content;
  const channelId = slackContent?.channel_id || id;
  const threadTs = slackContent?.thread_ts;

  // Earliest timeline entry anchors the row's date so timeline rows still
  // sort sensibly alongside calls/emails (which use the start_time field).
  const timeline: SlackTimelineEntry[] | undefined = slackContent?.timeline
    ?.map((entry): SlackTimelineEntry => {
      const type: SlackTimelineEntry["type"] =
        entry.type === "slack_message" || entry.type === "slack_thread"
          ? entry.type
          : undefined;
      return {
        chunkIndex: entry.chunk_index,
        chunkText: entry.chunk_text,
        startTs: entry.start_ts,
        type,
      };
    })
    .filter((e) => e.chunkText || e.startTs);

  const earliestTs = timeline?.reduce<number>((acc, e) => {
    const ts = e.startTs ?? 0;
    if (!ts) return acc;
    if (!acc) return ts;
    return Math.min(acc, ts);
  }, 0);

  const date = unixToIso(earliestTs) || new Date().toISOString();

  // Surface a sensible chunkText preview for the collapsed row even when
  // the full content lives in `timeline`.
  const chunkText = timeline?.find((e) => e.chunkText)?.chunkText ?? undefined;

  const messageCount =
    slackContent?.thread_chunk_count ?? slackContent?.message_chunk_count;

  return {
    id,
    type: convType,
    channelId,
    threadTs,
    date,
    chunkText,
    messageCount,
    hitChunkIndex: slackContent?.hit_chunk_index,
    timeline,
  };
}

/**
 * Transform a fetch_conversation artifact into a CallTranscript
 */
function transformFetchConversationToCall(
  content: FetchConversationContent,
  seenIds: Set<string>,
): CallTranscript | null {
  const id = content.conversation_id;
  if (!id || seenIds.has(id)) return null;
  seenIds.add(id);

  const metadata = content.call_metadata;
  const callContent = content.call_content;

  const title = metadata?.call_title || "Untitled Call";
  const date = metadata?.call_start_time || new Date().toISOString();

  // Duration
  let duration: string | undefined;
  if (metadata?.call_duration_seconds) {
    duration = formatDurationSeconds(metadata.call_duration_seconds);
  } else if (metadata?.call_start_time && metadata?.call_end_time) {
    const start = new Date(metadata.call_start_time).getTime();
    const end = new Date(metadata.call_end_time).getTime();
    if (!isNaN(start) && !isNaN(end) && end > start) {
      duration = formatDurationSeconds((end - start) / 1000);
    }
  }

  // Time range
  let timeRange: string | undefined;
  if (metadata?.call_start_time && metadata?.call_end_time) {
    const start = new Date(metadata.call_start_time);
    const end = new Date(metadata.call_end_time);
    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      const fmt = (d: Date) =>
        d.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
      timeRange = `${fmt(start)} – ${fmt(end)}`;
    }
  }

  // Participants from speakers (fall back to email when name is missing)
  const participants = metadata?.speakers
    ?.map((s) => s.name || s.email)
    .filter((n): n is string => Boolean(n));

  return {
    id,
    title,
    date,
    duration,
    timeRange,
    participants:
      participants && participants.length > 0 ? participants : undefined,
    summary:
      callContent?.summary ||
      callContent?.transcript?.slice(0, 500) ||
      undefined,
    sourceUrl: metadata?.deep_link,
    meetingUrl: metadata?.meeting_url,
  };
}

/**
 * Transform a fetch_conversation artifact (email type) into an EmailTranscript
 */
function transformFetchConversationToEmail(
  content: FetchConversationContent,
  seenIds: Set<string>,
): EmailTranscript | null {
  const id = content.conversation_id;
  if (!id || seenIds.has(id)) return null;

  const emailContent = content.email_content;
  const emailMeta = content.email_metadata;
  const rawContent = (emailContent?.content ?? emailContent?.body ?? "").trim();
  if (!rawContent) return null;

  seenIds.add(id);

  const subject = emailContent?.subject ?? emailMeta?.subject;
  const date =
    emailMeta?.date ?? emailMeta?.start_time ?? new Date().toISOString();
  const sender = emailMeta?.sender ?? emailMeta?.from;
  const recipients = emailMeta?.recipients ?? emailMeta?.to;

  return {
    id,
    type: "email",
    subject,
    preview: rawContent.slice(0, 200),
    content: rawContent,
    date,
    sender,
    recipients,
  };
}

/**
 * Separate calls, emails, and Slack hits from bulk RAG artifacts.
 *
 * Supports both row-based artifacts (execute_conversation_search) and
 * single-conversation artifacts (fetch_conversation). Returns three arrays,
 * each sorted by date descending (most recent first). Slack rows are silently
 * skipped on the conversation_type/email branch and routed through their own
 * formatter — they don't fit the call/email shapes.
 */
export function separateConversations(
  bulkRagArtifacts:
    | ArtifactResponse[]
    | { artifacts?: ArtifactResponse[] }
    | undefined,
): {
  calls: CallTranscript[];
  emails: EmailTranscript[];
  slack: SlackTranscript[];
} {
  const artifacts = Array.isArray(bulkRagArtifacts)
    ? bulkRagArtifacts
    : bulkRagArtifacts?.artifacts;

  if (!artifacts || artifacts.length === 0) {
    return { calls: [], emails: [], slack: [] };
  }

  const calls: CallTranscript[] = [];
  const emails: EmailTranscript[] = [];
  const slack: SlackTranscript[] = [];
  const seenCallIds = new Set<string>();
  const seenEmailIds = new Set<string>();
  const seenSlackIds = new Set<string>();

  // Partition artifacts: process fetch_conversation artifacts first so their
  // rich data (title, summary, duration, speakers) populates the seenIds sets
  // before row-based artifacts (which may only have call_id + minimal fields).
  // This ensures deduplication keeps the richer version.
  const fetchConversationArtifacts: ArtifactResponse[] = [];
  const rowBasedArtifacts: ArtifactResponse[] = [];

  for (const artifact of artifacts) {
    const content = artifact.content as Record<string, unknown>;
    if (isFetchConversationContent(content)) {
      fetchConversationArtifacts.push(artifact);
    } else {
      rowBasedArtifacts.push(artifact);
    }
  }

  // Pass 1: fetch_conversation artifacts (rich single-conversation data)
  for (const artifact of fetchConversationArtifacts) {
    const content = artifact.content as FetchConversationContent;

    // Skip failed fetch_conversation results
    if (content.success === false || content.error_message) {
      continue;
    }

    const convType = content.conversation_type;
    if (convType === "email") {
      const email = transformFetchConversationToEmail(content, seenEmailIds);
      if (email) emails.push(email);
    } else if (convType === "slack_message" || convType === "slack_thread") {
      const slackRow = transformFetchConversationToSlack(content, seenSlackIds);
      if (slackRow) slack.push(slackRow);
    } else {
      const call = transformFetchConversationToCall(content, seenCallIds);
      if (call) calls.push(call);
    }
  }

  // Pass 2: row-based artifacts (execute_conversation_search / execute_sql_query)
  for (const artifact of rowBasedArtifacts) {
    const content = artifact.content as {
      sample?: { rows?: Array<Record<string, unknown>> };
      rows?: Array<Record<string, unknown>>;
    };

    const rows = content.sample?.rows || content.rows;
    if (!rows) continue;

    for (const row of rows) {
      const type = row.type as string | undefined;

      if (type === "call") {
        const callRows = transformRowsToCalls([row], seenCallIds);
        calls.push(...callRows);
      } else if (type === "email") {
        const email = transformRowToEmail(row, seenEmailIds);
        if (email) emails.push(email);
      } else if (type === "slack_message" || type === "slack_thread") {
        const slackRow = transformRowToSlack(row, seenSlackIds);
        if (slackRow) slack.push(slackRow);
      }
    }
  }

  // Sort all by date descending (most recent first)
  calls.sort(sortByDateDescending);
  emails.sort(sortByDateDescending);
  slack.sort(sortByDateDescending);

  return { calls, emails, slack };
}

/**
 * @deprecated Use `separateConversations` — adds Slack rows to the return.
 * Kept as a thin shim during the transition.
 */
export function separateCallsAndEmails(
  bulkRagArtifacts:
    | ArtifactResponse[]
    | { artifacts?: ArtifactResponse[] }
    | undefined,
): { calls: CallTranscript[]; emails: EmailTranscript[] } {
  const { calls, emails } = separateConversations(bulkRagArtifacts);
  return { calls, emails };
}
