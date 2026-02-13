import { useCallback, useEffect, useRef, useState } from "react";
import {
  type FileAttachment,
  type FileCategory,
  getFileInfo,
  generateFileId,
  FILE_SIZE_LIMIT_BYTES,
  MAX_FILES,
} from "@vonlabs/design-components";
import {
  fileUploadService,
  type PresignResponse,
  type ConfirmResponse,
} from "../services/fileUploadService";

/**
 * Denormalized file metadata stored on the message.
 * Same shape stored in both Message.fileAttachments and FileMetadata collection.
 */
export interface MessageFileAttachment {
  fileId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  extension: string;
  category: string;
  s3Key: string;
}

/**
 * Hook that manages file attachments with eager upload.
 *
 * When files are added and a conversationId is available, the full pipeline
 * (presign → S3 PUT → confirm) starts immediately. The attachment status
 * transitions: pending → uploading → uploaded/error.
 *
 * Dashboard owns the FileAttachment[] state (controlled mode) and passes it
 * down to StandardChatInput for rendering.
 */
export function useFileUploadPipeline(conversationId: string | null) {
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  // Map of attachment ID → MessageFileAttachment (for completed uploads)
  const metadataRef = useRef<Map<string, MessageFileAttachment>>(new Map());

  /**
   * Run the upload pipeline for a single attachment.
   * Updates attachment status in state as it progresses.
   */
  const startUpload = useCallback(
    async (attachment: FileAttachment, convId: string) => {
      // Mark as uploading
      setAttachments((prev) =>
        prev.map((a) =>
          a.id === attachment.id ? { ...a, status: "uploading" as const } : a,
        ),
      );

      try {
        // 1. Presign
        const presignResponse: PresignResponse =
          await fileUploadService.presign(convId, {
            fileName: attachment.name,
            fileType: attachment.type,
            fileSize: attachment.size,
          });

        // Store uploadId on attachment for potential deletion
        setAttachments((prev) =>
          prev.map((a) =>
            a.id === attachment.id
              ? {
                  ...a,
                  uploadId: presignResponse.uploadId,
                  s3Key: presignResponse.s3Key,
                }
              : a,
          ),
        );

        // 2. Upload to S3
        await fileUploadService.uploadToS3(
          presignResponse.uploadUrl,
          attachment.file,
        );

        // 3. Confirm
        const confirmResponse: ConfirmResponse =
          await fileUploadService.confirm(convId, presignResponse.uploadId);

        // 4. Store metadata and mark as uploaded
        const metadata: MessageFileAttachment = {
          fileId: confirmResponse.id,
          fileName: attachment.name,
          fileSize: attachment.size,
          mimeType: attachment.type,
          extension: attachment.extension,
          category: attachment.category,
          s3Key: presignResponse.s3Key,
        };
        metadataRef.current.set(attachment.id, metadata);

        setAttachments((prev) =>
          prev.map((a) =>
            a.id === attachment.id ? { ...a, status: "uploaded" as const } : a,
          ),
        );
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error(
            `[useFileUploadPipeline] Upload failed for ${attachment.name}:`,
            error,
          );
        }
        setAttachments((prev) =>
          prev.map((a) =>
            a.id === attachment.id
              ? {
                  ...a,
                  status: "error" as const,
                  error: "Upload failed",
                }
              : a,
          ),
        );
      }
    },
    [],
  );

  /**
   * Add raw files — validate, create FileAttachments, start upload if conversationId exists.
   */
  const addFiles = useCallback(
    (rawFiles: File[]) => {
      const newAttachments: FileAttachment[] = [];
      let currentCount = attachments.length;

      for (const file of rawFiles) {
        // Validate max files
        if (currentCount >= MAX_FILES) {
          break;
        }

        // Validate size
        if (file.size > FILE_SIZE_LIMIT_BYTES) {
          continue;
        }

        // Validate type
        const fileInfo = getFileInfo(file.type);
        if (!fileInfo) {
          // Fallback: try extension
          const ext = file.name.split(".").pop()?.toUpperCase();
          if (!ext) continue;
        }

        // Check duplicates
        const isDuplicate = attachments.some(
          (a) => a.name === file.name && a.size === file.size,
        );
        if (isDuplicate) continue;

        const fallbackExt = file.name.split(".").pop()?.toUpperCase() || "FILE";

        const attachment: FileAttachment = {
          id: generateFileId(),
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          extension: fileInfo?.extension || fallbackExt,
          category: (fileInfo?.category || "document") as FileCategory,
          status: "pending",
          previewUrl: file.type.startsWith("image/")
            ? URL.createObjectURL(file)
            : undefined,
        };

        newAttachments.push(attachment);
        currentCount++;
      }

      if (newAttachments.length === 0) return;

      setAttachments((prev) => [...prev, ...newAttachments]);

      // Start upload immediately if conversation exists
      if (conversationId) {
        for (const attachment of newAttachments) {
          startUpload(attachment, conversationId);
        }
      }
    },
    [attachments, conversationId, startUpload],
  );

  // Auto-start uploads for pending files when conversationId becomes available
  // (e.g., files attached before conversation was created in a new chat)
  useEffect(() => {
    if (!conversationId) return;
    const pending = attachments.filter((a) => a.status === "pending");
    for (const attachment of pending) {
      startUpload(attachment, conversationId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]); // Only react to conversationId changes to avoid double uploads

  /**
   * Remove a file. If it was uploaded, delete metadata on backend (fire-and-forget).
   */
  const removeFile = useCallback(
    (id: string) => {
      setAttachments((prev) => {
        const file = prev.find((a) => a.id === id);
        if (file?.previewUrl) {
          URL.revokeObjectURL(file.previewUrl);
        }
        // Fire-and-forget backend delete if file was confirmed
        if (file?.uploadId && conversationId) {
          fileUploadService
            .deleteFile(conversationId, file.uploadId)
            .catch(() => {
              // Best effort — metadata will be orphaned but agent filters by status
            });
        }
        return prev.filter((a) => a.id !== id);
      });
      metadataRef.current.delete(id);
    },
    [conversationId],
  );

  /**
   * Get MessageFileAttachment[] for all uploaded files (to include on the message).
   */
  const getMetadataForMessage = useCallback((): MessageFileAttachment[] => {
    return Array.from(metadataRef.current.values());
  }, []);

  /**
   * Upload any pending files (for the case where no conversation existed when attached).
   * Returns metadata for all files once complete.
   */
  const uploadPendingFiles = useCallback(
    async (convId: string): Promise<MessageFileAttachment[]> => {
      const pending = attachments.filter((a) => a.status === "pending");

      if (pending.length === 0) {
        return getMetadataForMessage();
      }

      // Upload pending files and wait for all to complete
      await Promise.all(pending.map((a) => startUpload(a, convId)));

      // Return all metadata from ref (state may be stale after async uploads)
      return Array.from(metadataRef.current.values());
    },
    [attachments, startUpload, getMetadataForMessage],
  );

  /**
   * Clear all attachments after message is sent.
   */
  const clearFiles = useCallback(() => {
    attachments.forEach((a) => {
      if (a.previewUrl) URL.revokeObjectURL(a.previewUrl);
    });
    setAttachments([]);
    metadataRef.current.clear();
  }, [attachments]);

  const allUploaded =
    attachments.length > 0 && attachments.every((a) => a.status === "uploaded");

  return {
    attachments,
    addFiles,
    removeFile,
    getMetadataForMessage,
    uploadPendingFiles,
    clearFiles,
    allUploaded,
    hasAttachments: attachments.length > 0,
  };
}
