/**
 * GmailDraftCardContainer — self-contained container for rendering Gmail draft cards.
 *
 * Given one or more FileArtifacts with artifactType "email_draft", fetches EML
 * files from S3 via presigned URLs, parses them, and renders <EmailComposer>.
 * Shows <ArtifactCardSkeleton> while loading or if any artifact is pending.
 */

import React, { useState, useCallback } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import {
  EmailComposer,
  ArtifactCardSkeleton,
} from "@vonlabs/design-components";
import type { FileArtifact, EmailData } from "@vonlabs/design-components";
import { fileUploadService } from "../services/fileUploadService";
import { apiClient, ApiError } from "../services/apiClient";
import { parseEmlContent } from "../lib/emailUtils";
import { useFeatureFlag } from "../hooks/useFeatureFlag";
import { useToast } from "../hooks/useToast";
import { useNavigate } from "react-router-dom";
import { report } from "../lib/analytics/tracker";

interface GmailDraftCardContainerProps {
  conversationId: string;
  artifact: FileArtifact;
}

/**
 * Split a comma-separated "to" string into an array of trimmed addresses.
 */
function toArray(to: string): string[] {
  return to
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

interface CreateDraftResponse {
  draft_id: string;
  message_id: string;
  gmail_url: string;
}

async function createGmailDraft(
  conversationId: string,
  fileId: string,
): Promise<CreateDraftResponse> {
  return apiClient.post<CreateDraftResponse>(
    "/api/v1/gsuite/gmail/create-draft",
    { file_id: fileId, conversation_id: conversationId },
  );
}

/** Build a Gmail URL that opens a draft directly in compose mode. */
function buildDraftComposeUrl(result: CreateDraftResponse): string {
  if (result.message_id) {
    return `https://mail.google.com/mail/u/0/#drafts?compose=${result.message_id}`;
  }
  return result.gmail_url;
}

/** Extract `detail.code` from an ApiError response body, if present. */
function getGmailErrorCode(e: unknown): string | null {
  if (!(e instanceof ApiError) || !e.response) return null;
  const resp = e.response as Record<string, unknown>;
  const detail = resp.detail;
  if (detail && typeof detail === "object") {
    return ((detail as Record<string, unknown>).code as string) ?? null;
  }
  return null;
}

export const GmailDraftCardContainer: React.FC<
  GmailDraftCardContainerProps
> = ({ conversationId, artifact }) => {
  const { isGmailEnabled } = useFeatureFlag();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);

  // Step 1 — get presigned download URL
  const urlQuery = useQuery({
    queryKey: ["eml-download-url", conversationId, artifact.fileId],
    queryFn: () =>
      fileUploadService.getDownloadUrl(conversationId, artifact.fileId),
    enabled: !artifact.isPending,
    staleTime: 4 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Step 2 — fetch EML as ArrayBuffer and parse with postal-mime
  const parsedQuery = useQuery({
    queryKey: ["eml-parsed", artifact.fileId],
    queryFn: async () => {
      const res = await fetch(urlQuery.data!.downloadUrl);
      if (!res.ok) throw new Error(`EML fetch failed: ${res.status}`);
      const buffer = await res.arrayBuffer();
      return parseEmlContent(buffer);
    },
    enabled: !!urlQuery.data?.downloadUrl,
    staleTime: Infinity,
    gcTime: 10 * 60 * 1000,
  });

  const handleOpenInGmail = useCallback(async () => {
    report.emailDraftsOpenedInGmail(conversationId, 0);
    setIsCreatingDraft(true);
    try {
      const result = await createGmailDraft(conversationId, artifact.fileId);
      window.open(
        buildDraftComposeUrl(result),
        "_blank",
        "noopener,noreferrer",
      );
    } catch (e) {
      const errorCode = getGmailErrorCode(e);
      if (errorCode === "gmail_scope_insufficient") {
        showToast({
          message: "Gmail permissions have changed. Please reconnect Gmail.",
          variant: "error",
          action: {
            label: "Reconnect",
            onClick: () =>
              navigate("/settings?tab=integrations", {
                state: { fromApp: true },
              }),
          },
        });
      } else if (e instanceof ApiError && e.statusCode === 403) {
        showToast({
          message: "Connect Gmail to open long emails as drafts.",
          variant: "error",
          action: {
            label: "Connect",
            onClick: () =>
              navigate("/settings?tab=integrations", {
                state: { fromApp: true },
              }),
          },
        });
      } else {
        showToast({
          message: "Failed to create Gmail draft. Please try again.",
          variant: "error",
        });
      }
    } finally {
      setIsCreatingDraft(false);
    }
  }, [conversationId, artifact.fileId, showToast, navigate]);

  // Pending or loading → skeleton
  if (artifact.isPending || urlQuery.isLoading || parsedQuery.isLoading) {
    return <ArtifactCardSkeleton />;
  }

  // Error state — show inline message with retry
  if (urlQuery.error || parsedQuery.error) {
    return (
      <div className="border border-red-100 rounded-xl px-4 py-3 flex items-center gap-3 bg-red-50/50">
        <span className="text-sm text-red-700">
          Failed to load email draft.
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

  const parsed = parsedQuery.data;
  if (!parsed) {
    return (
      <div className="border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-500">
        Unable to parse email draft.
      </div>
    );
  }

  const emailData: EmailData = {
    to: toArray(parsed.to),
    cc: parsed.cc,
    bcc: parsed.bcc,
    subject: parsed.subject,
    body: parsed.body_full,
    bodyPlain: parsed.body_plain,
    isHtml: parsed.isHtml,
    tabLabel: parsed.tab_label,
  };

  return (
    <EmailComposer
      emails={[emailData]}
      onOpenInGmail={
        isGmailEnabled
          ? () => {
              void handleOpenInGmail();
            }
          : undefined
      }
      onBodyCopied={(index) =>
        report.emailDraftsBodyCopied(conversationId, index)
      }
      isCreatingDraft={isCreatingDraft}
    />
  );
};

// ── Multi-email container ────────────────────────────────────────────────────

interface EmailComposerContainerProps {
  conversationId: string;
  artifacts: FileArtifact[];
}

/**
 * Groups multiple email_draft artifacts into a single EmailComposer with tabs.
 */
export const EmailComposerContainer: React.FC<EmailComposerContainerProps> = ({
  conversationId,
  artifacts,
}) => {
  const { isGmailEnabled } = useFeatureFlag();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);

  // Fetch presigned URLs for all artifacts in parallel
  const urlQueries = useQueries({
    queries: artifacts.map((a) => ({
      queryKey: ["eml-download-url", conversationId, a.fileId],
      queryFn: () => fileUploadService.getDownloadUrl(conversationId, a.fileId),
      enabled: !a.isPending,
      staleTime: 4 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    })),
  });

  // Parse all EML files in parallel
  const parsedQueries = useQueries({
    queries: artifacts.map((a, i) => ({
      queryKey: ["eml-parsed", a.fileId],
      queryFn: async () => {
        const res = await fetch(urlQueries[i].data!.downloadUrl);
        if (!res.ok) throw new Error(`EML fetch failed: ${res.status}`);
        const buffer = await res.arrayBuffer();
        return parseEmlContent(buffer);
      },
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
          Failed to load email drafts.
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

  const emails: EmailData[] = [];
  const emailToArtifactIndex: number[] = [];

  parsedQueries.forEach((pq, i) => {
    const parsed = pq.data;
    if (!parsed) return;

    emailToArtifactIndex.push(i);
    emails.push({
      to: toArray(parsed.to),
      cc: parsed.cc,
      bcc: parsed.bcc,
      subject: parsed.subject,
      body: parsed.body_full,
      bodyPlain: parsed.body_plain,
      isHtml: parsed.isHtml,
      tabLabel: parsed.tab_label,
    });
  });

  if (emails.length === 0) {
    return (
      <div className="border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-500">
        Unable to parse email drafts.
      </div>
    );
  }

  const handleOpenInGmail = async (index: number) => {
    report.emailDraftsOpenedInGmail(conversationId, index);
    const artifactIdx = emailToArtifactIndex[index];
    const a = artifacts[artifactIdx];
    if (!a) return;

    setIsCreatingDraft(true);
    try {
      const result = await createGmailDraft(conversationId, a.fileId);
      window.open(
        buildDraftComposeUrl(result),
        "_blank",
        "noopener,noreferrer",
      );
    } catch (e) {
      const errorCode = getGmailErrorCode(e);
      if (errorCode === "gmail_scope_insufficient") {
        showToast({
          message: "Gmail permissions have changed. Please reconnect Gmail.",
          variant: "error",
          action: {
            label: "Reconnect",
            onClick: () =>
              navigate("/settings?tab=integrations", {
                state: { fromApp: true },
              }),
          },
        });
      } else if (e instanceof ApiError && e.statusCode === 403) {
        showToast({
          message: "Connect Gmail to open long emails as drafts.",
          variant: "error",
          action: {
            label: "Connect",
            onClick: () =>
              navigate("/settings?tab=integrations", {
                state: { fromApp: true },
              }),
          },
        });
      } else {
        showToast({
          message: "Failed to create Gmail draft. Please try again.",
          variant: "error",
        });
      }
    } finally {
      setIsCreatingDraft(false);
    }
  };

  return (
    <EmailComposer
      emails={emails}
      onOpenInGmail={
        isGmailEnabled
          ? (index: number) => void handleOpenInGmail(index)
          : undefined
      }
      onTabChange={(index) =>
        report.emailDraftsTabClicked(conversationId, index)
      }
      onBodyCopied={(index) =>
        report.emailDraftsBodyCopied(conversationId, index)
      }
      isCreatingDraft={isCreatingDraft}
    />
  );
};
