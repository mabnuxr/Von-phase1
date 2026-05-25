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
import { Streamdown } from "streamdown";
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
 * Wire-format of a .slack_draft artifact (JSON file on S3).
 *
 * The backend SlackDraftTool emits a single shape discriminated by `kind`:
 *   - "message" (default) / "scheduled" → message-composer fields populated
 *   - "channel"                          → channel-creation fields populated
 *   - "canvas"                           → canvas create/update fields populated
 * Only message/scheduled flow into <SlackMessageComposer> today; channel/canvas
 * render a lightweight placeholder card until their composer UIs land.
 */
type SlackDraftKind = "message" | "scheduled" | "channel" | "canvas";

interface SlackDraftPayload {
  kind?: SlackDraftKind;
  // message / scheduled fields
  conversation_id?: string;
  conversation_display?: string;
  conversation_type?: SlackConversationType;
  thread_ts?: string | null;
  thread_context?: string | null;
  reply_broadcast?: boolean;
  text?: string;
  display_text?: string;
  text_plain?: string;
  tab_label?: string;
  post_at?: number;
  // channel fields
  name?: string;
  is_private?: boolean;
  // canvas fields
  markdown?: string;
  channel_id?: string | null;
  canvas_id?: string | null;
}

/** Pull the first `# H1` out of a canvas markdown body for use as the card
 *  heading. Mirrors what Slack itself renders. Returns null when no H1. */
function extractH1(markdown: string | undefined): string | null {
  if (!markdown) return null;
  const match = markdown.match(/^\s*#\s+(.+?)\s*$/m);
  return match ? match[1].trim() : null;
}

function isMessageKind(p: SlackDraftPayload): boolean {
  const kind = p.kind ?? "message";
  return kind === "message" || kind === "scheduled";
}

interface SendSlackMessageResult {
  ts?: string;
  channel?: string;
  permalink?: string;
  // canvas / channel kinds
  canvas_id?: string;
  channel_id?: string;
  updated?: boolean;
  is_channel_canvas?: boolean;
  name?: string;
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

async function sendSlackArtifact(
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
    conversationId: p.conversation_id ?? "",
    conversationDisplay: p.conversation_display ?? "",
    conversationType: p.conversation_type ?? "channel",
    threadTs: p.thread_ts ?? undefined,
    threadContext: p.thread_context ?? undefined,
    replyBroadcast: p.reply_broadcast ?? false,
    text: p.text ?? "",
    displayText: p.display_text,
    textPlain: p.text_plain,
    tabLabel: p.tab_label,
  };
}

const SLACK_ICON_URL =
  "https://vonlabs-public-assets.s3.us-west-2.amazonaws.com/integrations/slack.svg";

interface DraftCopy {
  heading: string;
  subheading: string;
  ctaLabel: string; // button label while idle
  sendingLabel: string; // button label while in-flight
  sentLabel: string; // button label after success
  successToast: string; // toast message on successful send
}

/** Single source of truth for kind-specific copy on the canvas/channel card.
 *  Adding a new kind means filling out one branch here instead of touching
 *  four places in the JSX. */
function getDraftCopy(payload: SlackDraftPayload): DraftCopy {
  const kind = payload.kind ?? "message";

  if (kind === "channel") {
    return {
      heading: `#${payload.name ?? "untitled"}`,
      subheading: payload.is_private ? "Private channel" : "Public channel",
      ctaLabel: "Create",
      sendingLabel: "Create…",
      sentLabel: "Created",
      successToast: "Channel created in Slack",
    };
  }

  // kind === "canvas"
  const isUpdate = !!payload.canvas_id;
  const cta = isUpdate ? "Update" : "Create";
  const target = canvasTargetLabel(payload);
  const subheading = isUpdate
    ? "Replace canvas content"
    : target
      ? `New canvas, ${target}`
      : "New standalone canvas (lives in your Canvases sidebar)";

  return {
    heading: extractH1(payload.markdown) ?? "Untitled canvas",
    subheading,
    ctaLabel: cta,
    sendingLabel: `${cta}…`,
    sentLabel: isUpdate ? "Updated" : "Created",
    successToast: isUpdate
      ? "Canvas updated in Slack"
      : "Canvas created in Slack",
  };
}

function canvasTargetLabel(payload: SlackDraftPayload): string | null {
  if (!payload.channel_id) return null;
  const display = payload.conversation_display;
  if (!display) return "attached to selected conversation";
  switch (payload.conversation_type) {
    case "dm":
      return `attached to DM with ${display}`;
    case "group_dm":
      return `attached to group DM (${display})`;
    case "channel":
    default:
      return `attached to #${display.replace(/^#/, "")}`;
  }
}

/**
 * Card for kind=channel / kind=canvas drafts. The backend's `/send` endpoint
 * dispatches on the artifact's `kind` field, so wiring the button is the same
 * as for message drafts — just with a contextual label (Create / Update).
 */
function SlackNonMessageDraftCard({
  conversationId,
  fileId,
  payload,
}: {
  conversationId: string;
  fileId: string;
  payload: SlackDraftPayload;
}) {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [permalink, setPermalink] = useState<string | null>(null);

  const kind = payload.kind ?? "message";
  const copy = getDraftCopy(payload);

  const handleSend = useCallback(async () => {
    setIsSending(true);
    try {
      const result = await sendSlackArtifact(conversationId, fileId);
      setIsSent(true);
      if (result.permalink) setPermalink(result.permalink);
      showToast({ message: copy.successToast, variant: "success" });
    } catch (e) {
      handleSendError(e, showToast, navigate);
    } finally {
      setIsSending(false);
    }
  }, [conversationId, fileId, copy.successToast, showToast, navigate]);

  return (
    <div className="border border-gray-100 rounded-xl bg-white overflow-hidden flex flex-col shadow-xs">
      {/* Provider strip */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-gray-100 shrink-0">
        <img src={SLACK_ICON_URL} alt="Slack" width={16} height={16} />
        <span className="text-sm font-medium text-gray-900">Slack</span>
        <span className="ml-auto text-[11px] font-medium text-gray-500 uppercase tracking-wide">
          {kind} draft
        </span>
      </div>

      {/* Heading row */}
      <div className="px-3 py-2 border-b border-gray-100 shrink-0">
        <div className="text-sm font-semibold text-gray-900 truncate">
          {copy.heading}
        </div>
        <div className="text-xs text-gray-500 mt-0.5">{copy.subheading}</div>
      </div>

      {/* Body — markdown preview (canvas only) */}
      {kind === "canvas" && payload.markdown && (
        <div className="px-3 py-3">
          <div className="max-h-80 overflow-y-auto bg-gray-50/60 border border-gray-100 rounded-lg px-3 py-2.5 text-sm text-gray-900 leading-relaxed markdown-content settings-scrollbar">
            <Streamdown parseIncompleteMarkdown={false}>
              {payload.markdown}
            </Streamdown>
          </div>
        </div>
      )}

      {/* Footer CTA */}
      <div className="flex items-center justify-end gap-1.5 px-3 py-2.5 border-t border-gray-100 shrink-0">
        {isSent && permalink && (
          <a
            href={permalink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline mr-auto"
          >
            View in Slack
          </a>
        )}
        <button
          onClick={() => void handleSend()}
          disabled={isSending || isSent}
          className={`h-8.5 px-4 text-sm font-medium rounded-xl transition-colors ${
            isSent
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default"
              : isSending
                ? "bg-gray-900 text-white opacity-70 cursor-wait"
                : "bg-gray-900 text-white hover:bg-gray-800 cursor-pointer"
          }`}
        >
          {isSent
            ? copy.sentLabel
            : isSending
              ? copy.sendingLabel
              : copy.ctaLabel}
        </button>
      </div>
    </div>
  );
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
      const result = await sendSlackArtifact(conversationId, artifact.fileId);
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

  if (!isMessageKind(parsedQuery.data)) {
    return (
      <SlackNonMessageDraftCard
        conversationId={conversationId}
        fileId={artifact.fileId}
        payload={parsedQuery.data}
      />
    );
  }

  return (
    <SlackMessageComposer
      messages={[
        { ...payloadToMessage(parsedQuery.data), id: artifact.fileId },
      ]}
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
  const nonMessagePayloads: { payload: SlackDraftPayload; fileId: string }[] =
    [];

  parsedQueries.forEach((pq, i) => {
    const payload = pq.data;
    if (!payload) return;
    if (!isMessageKind(payload)) {
      nonMessagePayloads.push({ payload, fileId: artifacts[i].fileId });
      return;
    }
    messageToArtifactIndex.push(i);
    messages.push({ ...payloadToMessage(payload), id: artifacts[i].fileId });
  });

  if (messages.length === 0 && nonMessagePayloads.length === 0) {
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
      const result = await sendSlackArtifact(conversationId, a.fileId);
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
    <>
      {messages.length > 0 && (
        <SlackMessageComposer
          messages={messages}
          onSend={(index) => void handleSend(index)}
          isSending={isSending}
          sentIndices={sentIndices}
          permalinks={permalinks}
        />
      )}
      {nonMessagePayloads.map(({ payload, fileId }) => (
        <SlackNonMessageDraftCard
          key={fileId}
          conversationId={conversationId}
          fileId={fileId}
          payload={payload}
        />
      ))}
    </>
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
        onClick: () =>
          navigate("/settings?tab=integrations", { state: { fromApp: true } }),
      },
    });
  } else if (e instanceof ApiError && e.statusCode === 403) {
    showToast({
      message: "Connect Slack to send messages from Von.",
      variant: "error",
      action: {
        label: "Connect",
        onClick: () =>
          navigate("/settings?tab=integrations", { state: { fromApp: true } }),
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
