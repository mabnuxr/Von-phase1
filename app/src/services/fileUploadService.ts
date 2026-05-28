import { apiClient } from "./apiClient";

/**
 * Presign request payload
 */
export interface PresignRequest {
  fileName: string;
  fileType: string;
  fileSize: number;
}

/**
 * Presign response from backend
 */
export interface PresignResponse {
  uploadUrl: string;
  uploadId: string;
  s3Key: string;
}

/**
 * Confirm response from backend
 */
export interface ConfirmResponse {
  id: string;
  fileName: string;
  sizeBytes: number;
  status: string;
}

/**
 * File metadata response from backend
 */
export interface SendState {
  sent_at: string;
  result: Record<string, unknown>;
}

export interface FileMetadataResponse {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  status: string;
  source: string;
  createdAt: string;
  artifactType?: string;
  runId?: string;
  isPending?: boolean;
  sendState?: SendState | null;
}

/**
 * Paginated file metadata list response
 */
export interface FileMetadataListResponse {
  data: FileMetadataResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Service for file upload operations (presign, S3 PUT, confirm)
 */
class FileUploadService {
  private getFilesBase(conversationId: string): string {
    return `/api/v1/chat/conversations/${conversationId}/files`;
  }

  /**
   * Request a presigned PUT URL for uploading a file to S3
   */
  async presign(
    conversationId: string,
    request: PresignRequest,
  ): Promise<PresignResponse> {
    return apiClient.post<PresignResponse>(
      `${this.getFilesBase(conversationId)}/presign`,
      request,
    );
  }

  /**
   * Upload a file directly to S3 using the presigned PUT URL.
   * Uses XMLHttpRequest for upload progress tracking.
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
          reject(new Error(`S3 upload failed with status ${xhr.status}`));
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

  /**
   * Confirm that a file was successfully uploaded to S3.
   * Backend verifies via HeadObject and updates metadata to "completed".
   */
  async confirm(
    conversationId: string,
    fileId: string,
  ): Promise<ConfirmResponse> {
    return apiClient.post<ConfirmResponse>(
      `${this.getFilesBase(conversationId)}/${fileId}/confirm`,
    );
  }

  /**
   * List file metadata for a conversation (only completed files).
   * Used for aggregate size validation.
   */
  async listFiles(
    conversationId: string,
    page: number = 1,
    limit: number = 100,
    source?: string,
    runId?: string,
  ): Promise<FileMetadataListResponse> {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (source) params.set("source", source);
    if (runId) params.set("run_id", runId);
    return apiClient.get<FileMetadataListResponse>(
      `${this.getFilesBase(conversationId)}?${params.toString()}`,
    );
  }

  /**
   * Delete file metadata (soft delete). No S3 cleanup needed.
   */
  async deleteFile(conversationId: string, fileId: string): Promise<void> {
    return apiClient.delete(`${this.getFilesBase(conversationId)}/${fileId}`);
  }

  /**
   * Get a presigned download URL for a file
   */
  async getDownloadUrl(
    conversationId: string,
    fileId: string,
  ): Promise<{ downloadUrl: string; fileName: string }> {
    return apiClient.get<{ downloadUrl: string; fileName: string }>(
      `${this.getFilesBase(conversationId)}/${fileId}/download`,
    );
  }
}

// Singleton instance
export const fileUploadService = new FileUploadService();
