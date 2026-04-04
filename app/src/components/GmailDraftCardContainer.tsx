/**
 * GmailDraftCardContainer — self-contained container for rendering Gmail draft cards.
 *
 * Given one or more FileArtifacts with artifactType "email_draft", fetches EML
 * files from S3 via presigned URLs, parses them, and renders <EmailComposer>.
 * Shows <ArtifactCardSkeleton> while loading or if any artifact is pending.
 */

import React from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import {
  EmailComposer,
  ArtifactCardSkeleton,
} from "@vonlabs/design-components";
import type { FileArtifact, EmailData } from "@vonlabs/design-components";
import { fileUploadService } from "../services/fileUploadService";
import {
  parseEmlContent,
  buildGmailComposeUrl,
  type DraftCard,
} from "../lib/emailUtils";
import { useFeatureFlag } from "../hooks/useFeatureFlag";

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

export const GmailDraftCardContainer: React.FC<
  GmailDraftCardContainerProps
> = ({ conversationId, artifact }) => {
  const { isGmailEnabled } = useFeatureFlag();

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

  const card: DraftCard = { type: "email_draft", ...parsed };
  const gmailUrl = buildGmailComposeUrl(card);

  const emailData: EmailData = {
    to: toArray(parsed.to),
    cc: parsed.cc,
    bcc: parsed.bcc,
    subject: parsed.subject,
    body: parsed.body_full,
  };

  return (
    <EmailComposer
      emails={[emailData]}
      onOpenInGmail={
        isGmailEnabled && gmailUrl
          ? () => {
              window.open(gmailUrl, "_blank", "noopener,noreferrer");
            }
          : undefined
      }
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
  const gmailUrls: (string | undefined)[] = [];

  for (const pq of parsedQueries) {
    const parsed = pq.data;
    if (!parsed) continue;

    const card: DraftCard = { type: "email_draft", ...parsed };
    gmailUrls.push(buildGmailComposeUrl(card));

    emails.push({
      to: toArray(parsed.to),
      cc: parsed.cc,
      bcc: parsed.bcc,
      subject: parsed.subject,
      body: parsed.body_full,
    });
  }

  if (emails.length === 0) {
    return (
      <div className="border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-500">
        Unable to parse email drafts.
      </div>
    );
  }

  return (
    <EmailComposer
      emails={emails}
      onOpenInGmail={
        isGmailEnabled
          ? (index: number) => {
              const url = gmailUrls[index];
              if (url) window.open(url, "_blank", "noopener,noreferrer");
            }
          : undefined
      }
    />
  );
};
