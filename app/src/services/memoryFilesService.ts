import { apiClient } from "./apiClient";
import { getFileInfo } from "@vonlabs/design-components";
import type { PresignRequest, PresignResponse } from "./fileUploadService";
import type { MemoryAttachment } from "../types/memoryContext";

/**
 * Generate a Mongo-compatible ObjectId (24 hex chars: 8-byte timestamp +
 * 10-byte random + 6-byte counter). Avoids pulling in the `bson` package.
 */
export function generateMemoryId(): string {
  const timestamp = Math.floor(Date.now() / 1000)
    .toString(16)
    .padStart(8, "0");
  const random = Array.from({ length: 10 }, () =>
    Math.floor(Math.random() * 256)
      .toString(16)
      .padStart(2, "0"),
  ).join("");
  const counter = Math.floor(Math.random() * 0xffffff)
    .toString(16)
    .padStart(6, "0");
  return timestamp + random + counter;
}

/**
 * Memory-scoped file upload (commands-style). The BE has only two endpoints
 * for memory files:
 *   POST /memory-contexts/{memory_id}/files/presign   → presigned PUT URL
 *   GET  /memory-contexts/files/download?s3Key=...    → presigned GET URL
 *
 * There is no confirm/delete — the MemoryContext document's `attachments`
 * array (sent on create/update) is the source of truth for what's attached.
 * `memory_id` in the presign path can be any client-supplied id, including
 * one for a memory that doesn't exist yet (pre-create flow).
 */
class MemoryFilesService {
  private base(memoryId: string): string {
    return `/api/v1/memory-contexts/${memoryId}/files`;
  }

  /** Presign a PUT URL for direct S3 upload of a file to this memory. */
  presign(memoryId: string, request: PresignRequest): Promise<PresignResponse> {
    return apiClient.post<PresignResponse>(
      `${this.base(memoryId)}/presign`,
      request,
    );
  }

  /**
   * Upload a File directly to S3 using the presigned PUT URL. Uses
   * XMLHttpRequest for progress tracking. Surfaces the S3 XML error body
   * (Code/Message) when the PUT fails so the caller can show a useful toast.
   */
  uploadToS3(
    uploadUrl: string,
    file: File,
    onProgress?: (progress: number) => void,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          onProgress?.(progress);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          const body = xhr.responseText ?? "";
          const codeMatch = body.match(/<Code>([^<]+)<\/Code>/);
          const messageMatch = body.match(/<Message>([^<]+)<\/Message>/);
          const detail = [codeMatch?.[1], messageMatch?.[1]]
            .filter(Boolean)
            .join(": ");
          console.error("S3 upload failed", { status: xhr.status, body });
          reject(
            new Error(
              `S3 upload failed (${xhr.status})${detail ? ` — ${detail}` : ""}`,
            ),
          );
        }
      });
      xhr.addEventListener("error", () => {
        reject(new Error("S3 upload failed: network error"));
      });
      xhr.addEventListener("abort", () => {
        reject(new Error("S3 upload aborted"));
      });

      xhr.open("PUT", uploadUrl);
      xhr.setRequestHeader("Content-Type", file.type);
      xhr.send(file);
    });
  }

  /** Get a presigned download URL for a memory attachment by its s3 key. */
  getDownloadUrl(
    s3Key: string,
  ): Promise<{ downloadUrl: string; fileName: string }> {
    return apiClient.get<{ downloadUrl: string; fileName: string }>(
      `/api/v1/memory-contexts/files/download?s3Key=${encodeURIComponent(s3Key)}`,
    );
  }

  /**
   * High-level helper: presign → S3 PUT → assemble the full MemoryAttachment
   * shape the BE expects on memory create/update. No confirm step. The
   * `memoryId` may be either an existing memory's id or a client-generated
   * draft id for a memory that doesn't exist yet (pre-create flow); the BE
   * presign endpoint accepts both.
   */
  async uploadFile(
    memoryId: string,
    file: File,
    onProgress?: (progress: number) => void,
  ): Promise<MemoryAttachment> {
    const presigned = await this.presign(memoryId, {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    });
    await this.uploadToS3(presigned.uploadUrl, file, onProgress);
    const info = getFileInfo(file.type);
    return {
      fileId: presigned.uploadId,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      extension: info?.extension ?? "",
      category: info?.category ?? "document",
      s3Key: presigned.s3Key,
    };
  }
}

export const memoryFilesService = new MemoryFilesService();
