/**
 * GmailDraftCardContainer — self-contained container for rendering Gmail draft cards.
 *
 * Given a FileArtifact with artifactType "email_draft", fetches the EML file
 * from S3 via a presigned URL, parses it, and renders <GmailDraftCard>.
 * Shows <ArtifactCardSkeleton> while loading or if the artifact is pending.
 */

import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  GmailDraftCard,
  ArtifactCardSkeleton,
} from "@vonlabs/design-components";
import type { FileArtifact } from "@vonlabs/design-components";
import { fileUploadService } from "../services/fileUploadService";
import {
  parseEmlContent,
  buildGmailComposeUrl,
  type DraftCard,
} from "../lib/emailUtils";

interface GmailDraftCardContainerProps {
  conversationId: string;
  artifact: FileArtifact;
}

export const GmailDraftCardContainer: React.FC<
  GmailDraftCardContainerProps
> = ({ conversationId, artifact }) => {
  // Step 1 — get presigned download URL
  const urlQuery = useQuery({
    queryKey: ["eml-download-url", conversationId, artifact.fileId],
    queryFn: () =>
      fileUploadService.getDownloadUrl(conversationId, artifact.fileId),
    enabled: !artifact.isPending,
    staleTime: 4 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Step 2 — fetch raw EML text from S3
  const contentQuery = useQuery({
    queryKey: ["eml-content", artifact.fileId],
    queryFn: async () => {
      const res = await fetch(urlQuery.data!.downloadUrl);
      if (!res.ok) throw new Error(`EML fetch failed: ${res.status}`);
      return res.text();
    },
    enabled: !!urlQuery.data?.downloadUrl,
    staleTime: Infinity,
    gcTime: 10 * 60 * 1000,
  });

  // Pending or loading → skeleton
  if (artifact.isPending || !contentQuery.data) {
    return <ArtifactCardSkeleton />;
  }

  // Parse EML content
  const parsed = parseEmlContent(contentQuery.data);
  if (!parsed) {
    return <ArtifactCardSkeleton />;
  }

  const card: DraftCard = { type: "email_draft", ...parsed };
  const gmailUrl = buildGmailComposeUrl(card);

  return (
    <GmailDraftCard
      artifact={{
        draftId: artifact.fileId,
        to: parsed.to,
        subject: parsed.subject,
        bodyPreview: parsed.body_preview,
        bodyFull: parsed.body_full,
        cc: parsed.cc,
        bcc: parsed.bcc,
        crmContext: parsed.crm_context,
        gmailUrl,
      }}
      isGmailEnabled={true}
      isGmailConnected={!!gmailUrl}
      onOpenInGmail={() => window.open(gmailUrl, "_blank")}
    />
  );
};
