/**
 * useEmlDraftArtifacts
 *
 * Given a list of .eml file references (from useAgentArtifacts), fetches each
 * file from S3 via a presigned download URL, parses the RFC 2822 content, and
 * returns EmailDraftArtifact[] for rendering as GmailDraftCard.
 *
 * Two-step fetch per file:
 *   1. GET /files/{id}/download  →  { downloadUrl }  (presigned S3 URL)
 *   2. fetch(downloadUrl)        →  raw EML text
 */

import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import type { EmailDraftArtifact } from "@vonlabs/design-components";
import { fileUploadService } from "../services/fileUploadService";
import {
  parseEmlContent,
  buildGmailComposeUrl,
  type DraftCard,
} from "../lib/emailUtils";

/**
 * Route a presigned S3 URL through the appropriate Vite proxy to avoid CORS
 * issues and signature mismatches.
 *
 * S3 presigned URLs come in two styles:
 *
 * 1. Virtual-hosted: https://BUCKET.s3.REGION.amazonaws.com/KEY?sig...
 *    → bucket is in the hostname; canonical resource is /BUCKET/KEY
 *    → proxy target `vonlabs-public-assets.s3.us-west-2.amazonaws.com`
 *    → use /s3-assets prefix (strips it, forwards the /KEY path)
 *
 * 2. Path-style: https://s3.REGION.amazonaws.com/BUCKET/KEY?sig...
 *    → bucket is in the path; canonical resource is /BUCKET/KEY
 *    → proxy target must be s3.REGION.amazonaws.com so the path is forwarded
 *      unchanged — sending to the virtual-hosted endpoint would prepend the
 *      bucket name again, giving /BUCKET/BUCKET/KEY → SignatureDoesNotMatch
 *    → use /s3-path prefix (strips it, forwards the /BUCKET/KEY path)
 */
function toProxiedUrl(s3Url: string): string {
  try {
    const url = new URL(s3Url);
    const { pathname, search } = url;
    // Path-style: host is a bare S3 regional endpoint (s3.*, s3-*)
    const isPathStyle = /^s3[.-]/.test(url.hostname);
    return isPathStyle
      ? `/s3-path${pathname}${search}`
      : `/s3-assets${pathname}${search}`;
  } catch {
    return s3Url;
  }
}

export function useEmlDraftArtifacts(
  conversationId: string | null,
  emlFiles: { fileId: string; runId: string }[],
): EmailDraftArtifact[] {
  // Step 1 — get presigned download URLs
  const urlQueries = useQueries({
    queries: emlFiles.map((f) => ({
      queryKey: ["eml-download-url", conversationId, f.fileId],
      queryFn: () =>
        fileUploadService.getDownloadUrl(conversationId!, f.fileId),
      enabled: !!conversationId && !!f.fileId,
      staleTime: 4 * 60 * 1000, // presigned URLs expire, keep short
      gcTime: 10 * 60 * 1000,
    })),
  });

  // Step 2 — fetch EML text from S3
  const contentQueries = useQueries({
    queries: urlQueries.map((q, i) => ({
      queryKey: ["eml-content", emlFiles[i].fileId],
      queryFn: async () => {
        const res = await fetch(toProxiedUrl(q.data!.downloadUrl));
        if (!res.ok) throw new Error(`EML fetch failed: ${res.status}`);
        return res.text();
      },
      enabled: !!q.data?.downloadUrl,
      staleTime: Infinity,
      gcTime: 10 * 60 * 1000,
    })),
  });

  return useMemo(() => {
    const artifacts: EmailDraftArtifact[] = [];
    for (let i = 0; i < contentQueries.length; i++) {
      const text = contentQueries[i].data;
      if (!text) continue;
      const parsed = parseEmlContent(text);
      if (!parsed) continue;
      const card: DraftCard = { type: "email_draft", ...parsed };
      artifacts.push({
        draftId: emlFiles[i].fileId,
        to: parsed.to,
        subject: parsed.subject,
        bodyPreview: parsed.body_preview,
        bodyFull: parsed.body_full,
        cc: parsed.cc,
        bcc: parsed.bcc,
        crmContext: parsed.crm_context,
        gmailUrl: buildGmailComposeUrl(card),
      });
    }
    return artifacts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentQueries]);
}
