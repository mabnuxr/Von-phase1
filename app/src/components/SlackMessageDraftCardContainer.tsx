/**
 * SlackMessageDraftCardContainer — self-contained container for slack_message_draft artifacts.
 *
 * Given one or more FileArtifacts with artifactType "slack_message_draft", fetches
 * JSON drafts from S3 via presigned URLs, parses them, and renders <SlackMessageComposer>.
 * Send routes through the backend `/api/v1/slack/messages` endpoint, which vends the
 * user's Scalekit-managed Slack OAuth token and calls slack_sdk.WebClient directly.
 */

import React, { useState, useCallback } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import {
  SlackMessageComposer,
  ArtifactCardSkeleton,
} from "@vonlabs/design-components";
import type {
  FileArtifact,
  SlackMessageData,
  SlackConversationType,
} from "@vonlabs/design-components";
import { fileUploadService } from "../services/fileUploadService";
import { apiClient, ApiError } from "../services/apiClient";
import { useToast } from "../hooks/useToast";
import { useNavigate } from "react-router-dom";

/**
 * Wire-format of a slack_message_draft artifact (JSON file on S3).
 * Mirrors the structure emitted by the backend SlackComposeDraftTool.
 */
interface SlackDraftPayload {
  conversation_id: string;
  conversation_display: string;
  conversation_type: SlackConversationType;
  thread_ts?: string | null;
  thread_context?: string | null;
  reply_broadcast?: boolean;
  text: string;
  display_text?: string;
  text_plain?: string;
  tab_label?: string;
}

interface SendSlackMessageResult {
  ts: string;
  channel: string;
  permalink?: string;
}

interface SendArtifactResponse {
  artifact_type: string;
  result: SendSlackMessageResult;
}

async function fetchSlackDraft(
  downloadUrl: string,
): Promise<SlackDraftPayload> {
  const res = await fetch(downloadUrl);
  if (!res.ok) throw new Error(`Slack draft fetch failed: ${res.status}`);
  return (await res.json()) as SlackDraftPayload;
}

async function sendSlackMessage(
  conversationId: string,
  fileId: string,
): Promise<SendSlackMessageResult> {
  const response = await apiClient.post<SendArtifactResponse>(
    `/api/v1/chat/conversations/${encodeURIComponent(conversationId)}/files/${encodeURIComponent(fileId)}/send`,
    { overrides: {} },
  );
  return response.result;
}

/** Extract `detail.code` from an ApiError response body, if present. */
function getSlackErrorCode(e: unknown): string | null {
  if (!(e instanceof ApiError) || !e.response) return null;
  const resp = e.response as Record<string, unknown>;
  const detail = resp.detail;
  if (detail && typeof detail === "object") {
    return ((detail as Record<string, unknown>).code as string) ?? null;
  }
  return null;
}

function payloadToMessage(p: SlackDraftPayload): SlackMessageData {
  return {
    conversationId: p.conversation_id,
    conversationDisplay: p.conversation_display,
    conversationType: p.conversation_type,
    threadTs: p.thread_ts ?? undefined,
    threadContext: p.thread_context ?? undefined,
    replyBroadcast: p.reply_broadcast ?? false,
    text: p.text,
    displayText: p.display_text,
    textPlain: p.text_plain,
    tabLabel: p.tab_label,
  };
}

// ── Single-message container ─────────────────────────────────────────────────

interface SlackMessageDraftCardContainerProps {
  conversationId: string;
  artifact: FileArtifact;
}

export const SlackMessageDraftCardContainer: React.FC<
  SlackMessageDraftCardContainerProps
> = ({ conversationId, artifact }) => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [isSending, setIsSending] = useState(false);
  const [sentIndices, setSentIndices] = useState<number[]>([]);
  const [permalinks, setPermalinks] = useState<Record<number, string>>({});

  const urlQuery = useQuery({
    queryKey: ["slack-draft-url", conversationId, artifact.fileId],
    queryFn: () =>
      fileUploadService.getDownloadUrl(conversationId, artifact.fileId),
    enabled: !artifact.isPending,
    staleTime: 4 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const parsedQuery = useQuery({
    queryKey: ["slack-draft-parsed", artifact.fileId],
    queryFn: () => fetchSlackDraft(urlQuery.data!.downloadUrl),
    enabled: !!urlQuery.data?.downloadUrl,
    staleTime: Infinity,
    gcTime: 10 * 60 * 1000,
  });

  const handleSend = useCallback(async () => {
    setIsSending(true);
    try {
      const result = await sendSlackMessage(conversationId, artifact.fileId);
      setSentIndices([0]);
      if (result.permalink) setPermalinks({ 0: result.permalink });
      showToast({ message: "Message sent to Slack", variant: "success" });
    } catch (e) {
      handleSendError(e, showToast, navigate);
    } finally {
      setIsSending(false);
    }
  }, [conversationId, artifact.fileId, showToast, navigate]);

  if (artifact.isPending || urlQuery.isLoading || parsedQuery.isLoading) {
    return <ArtifactCardSkeleton />;
  }

  if (urlQuery.error || parsedQuery.error) {
    return (
      <div className="border border-red-100 rounded-xl px-4 py-3 flex items-center gap-3 bg-red-50/50">
        <span className="text-sm text-red-700">
          Failed to load Slack message draft.
        </span>
        <button
          onClick={() => {
            void urlQuery.refetch().then(() => parsedQuery.refetch());
          }}
          className="text-sm text-red-700 underline cursor-pointer hover:text-red-900"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!parsedQuery.data) {
    return (
      <div className="border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-500">
        Unable to parse Slack message draft.
      </div>
    );
  }

  return (
    <SlackMessageComposer
      messages={[payloadToMessage(parsedQuery.data)]}
      onSend={() => void handleSend()}
      isSending={isSending}
      sentIndices={sentIndices}
      permalinks={permalinks}
    />
  );
};

// ── Multi-message container ──────────────────────────────────────────────────

interface SlackMessageComposerContainerProps {
  conversationId: string;
  artifacts: FileArtifact[];
}

export const SlackMessageComposerContainer: React.FC<
  SlackMessageComposerContainerProps
> = ({ conversationId, artifacts }) => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [isSending, setIsSending] = useState(false);
  const [sentIndices, setSentIndices] = useState<number[]>([]);
  const [permalinks, setPermalinks] = useState<Record<number, string>>({});

  const urlQueries = useQueries({
    queries: artifacts.map((a) => ({
      queryKey: ["slack-draft-url", conversationId, a.fileId],
      queryFn: () => fileUploadService.getDownloadUrl(conversationId, a.fileId),
      enabled: !a.isPending,
      staleTime: 4 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    })),
  });

  const parsedQueries = useQueries({
    queries: artifacts.map((a, i) => ({
      queryKey: ["slack-draft-parsed", a.fileId],
      queryFn: () => fetchSlackDraft(urlQueries[i].data!.downloadUrl),
      enabled: !!urlQueries[i].data?.downloadUrl,
      staleTime: Infinity,
      gcTime: 10 * 60 * 1000,
    })),
  });

  const anyPending = artifacts.some((a) => a.isPending);
  const anyUrlLoading = urlQueries.some((q) => q.isLoading);
  const anyParsedLoading = parsedQueries.some((q) => q.isLoading);

  if (anyPending || anyUrlLoading || anyParsedLoading) {
    return <ArtifactCardSkeleton />;
  }

  const anyError =
    urlQueries.some((q) => q.error) || parsedQueries.some((q) => q.error);
  if (anyError) {
    return (
      <div className="border border-red-100 rounded-xl px-4 py-3 flex items-center gap-3 bg-red-50/50">
        <span className="text-sm text-red-700">
          Failed to load Slack message drafts.
        </span>
        <button
          onClick={() => {
            urlQueries.forEach((q) => void q.refetch());
            parsedQueries.forEach((q) => void q.refetch());
          }}
          className="text-sm text-red-700 underline cursor-pointer hover:text-red-900"
        >
          Retry
        </button>
      </div>
    );
  }

  const messages: SlackMessageData[] = [];
  const messageToArtifactIndex: number[] = [];

  parsedQueries.forEach((pq, i) => {
    const payload = pq.data;
    if (!payload) return;
    messageToArtifactIndex.push(i);
    messages.push(payloadToMessage(payload));
  });

  if (messages.length === 0) {
    return (
      <div className="border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-500">
        Unable to parse Slack message drafts.
      </div>
    );
  }

  const handleSend = async (index: number) => {
    const artifactIdx = messageToArtifactIndex[index];
    const a = artifacts[artifactIdx];
    if (!a) return;

    setIsSending(true);
    try {
      const result = await sendSlackMessage(conversationId, a.fileId);
      setSentIndices((prev) =>
        prev.includes(index) ? prev : [...prev, index],
      );
      if (result.permalink) {
        setPermalinks((prev) => ({ ...prev, [index]: result.permalink! }));
      }
      showToast({ message: "Message sent to Slack", variant: "success" });
    } catch (e) {
      handleSendError(e, showToast, navigate);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <SlackMessageComposer
      messages={messages}
      onSend={(index) => void handleSend(index)}
      isSending={isSending}
      sentIndices={sentIndices}
      permalinks={permalinks}
    />
  );
};

// ── Shared error mapping ─────────────────────────────────────────────────────

function handleSendError(
  e: unknown,
  showToast: ReturnType<typeof useToast>["showToast"],
  navigate: ReturnType<typeof useNavigate>,
): void {
  const errorCode = getSlackErrorCode(e);
  if (errorCode === "slack_scope_insufficient") {
    showToast({
      message: "Slack permissions have changed. Please reconnect Slack.",
      variant: "error",
      action: {
        label: "Reconnect",
        onClick: () => navigate("/settings?tab=integrations"),
      },
    });
  } else if (e instanceof ApiError && e.statusCode === 403) {
    showToast({
      message: "Connect Slack to send messages from Von.",
      variant: "error",
      action: {
        label: "Connect",
        onClick: () => navigate("/settings?tab=integrations"),
      },
    });
  } else if (errorCode === "slack_not_in_channel") {
    showToast({
      message:
        "Von's Slack connection is not in this channel. Invite it and try again.",
      variant: "error",
    });
  } else if (errorCode === "slack_channel_not_found") {
    showToast({
      message: "This Slack channel could not be found.",
      variant: "error",
    });
  } else {
    showToast({
      message: "Failed to send Slack message. Please try again.",
      variant: "error",
    });
  }
}
