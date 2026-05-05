import { apiClient } from "./apiClient";
import { getFileInfo } from "@vonlabs/design-components";
import type { MemoryAttachment } from "../types/memoryContext";

/**
 * Generate a Mongo-compatible ObjectId (24 hex chars: 4-byte timestamp +
 * 5-byte random + 3-byte counter). Avoids pulling in the `bson` package.
 */
export function generateMemoryId(): string {
  // 4-byte timestamp (seconds since epoch) → 8 hex chars
  const timestamp = Math.floor(Date.now() / 1000)
    .toString(16)
    .padStart(8, "0");
  // 5 random bytes → 10 hex chars
  const random = Array.from({ length: 5 }, () =>
    Math.floor(Math.random() * 256)
      .toString(16)
      .padStart(2, "0"),
  ).join("");
  // 3-byte counter → 6 hex chars
  const counter = Math.floor(Math.random() * 0xffffff)
    .toString(16)
    .padStart(6, "0");
  return timestamp + random + counter;
}

/**
 * Wire shapes for the memory file endpoints. The S3 key is internal to
 * the BE — clients only ever see `fileId`.
 */
interface MemoryPresignRequest {
  fileName: string;
  fileType: string;
  fileSize: number;
}
interface MemoryPresignResponse {
  uploadUrl: string;
  fileId: string;
}
interface MemoryConfirmResponse {
  fileId: string;
  fileName: string;
  sizeBytes: number;
  status: string;
}

/**
 * Memory-scoped file upload. Three-step flow modeled on the chat upload:
 *   1. POST /memory-contexts/{memory_id}/files/presign — pending
 *      FileMetadata + presigned PUT URL
 *   2. PUT to S3 directly                              — bytes upload
 *   3. POST /memory-contexts/files/{file_id}/confirm   — HeadObject
 *      verify, mark completed
 *   4. GET  /memory-contexts/files/{file_id}/download  — presigned GET
 *
 * `memory_id` may be a draft id for a memory that doesn't exist yet —
 * the FE generates one upfront via `generateMemoryId()` and uses it as
 * both the presign target and the create-memory id so the FileMetadata
 * binding lines up.
 */
class MemoryFilesService {
  private base(memoryId: string): string {
    return `/api/v1/memory-contexts/${memoryId}/files`;
  }

  presign(
    memoryId: string,
    request: MemoryPresignRequest,
  ): Promise<MemoryPresignResponse> {
    return apiClient.post<MemoryPresignResponse>(
      `${this.base(memoryId)}/presign`,
      request,
    );
  }

  confirm(fileId: string): Promise<MemoryConfirmResponse> {
    return apiClient.post<MemoryConfirmResponse>(
      `/api/v1/memory-contexts/files/${fileId}/confirm`,
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

  /** Get a presigned download URL for a memory attachment by its fileId. */
  getDownloadUrl(
    fileId: string,
  ): Promise<{ downloadUrl: string; fileName: string }> {
    return apiClient.get<{ downloadUrl: string; fileName: string }>(
      `/api/v1/memory-contexts/files/${fileId}/download`,
    );
  }

  /**
   * High-level helper: presign → S3 PUT → confirm → assemble the
   * MemoryAttachment shape the BE expects on memory create/update.
   *
   * `memoryId` may be either an existing memory's id or a client-generated
   * draft id for a memory that doesn't exist yet (pre-create flow); the
   * BE presign endpoint accepts both and binds FileMetadata.memory_id
   * to whatever was passed.
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
    const confirmed = await this.confirm(presigned.fileId);
    const info = getFileInfo(file.type);
    return {
      fileId: confirmed.fileId,
      fileName: confirmed.fileName,
      fileSize: confirmed.sizeBytes,
      mimeType: file.type,
      extension: info?.extension ?? "",
      category: info?.category ?? "document",
    };
  }
}

export const memoryFilesService = new MemoryFilesService();
