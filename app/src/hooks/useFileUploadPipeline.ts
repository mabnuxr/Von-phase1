import { useCallback, useEffect, useRef, useState } from "react";
import {
  type FileAttachment,
  type FileCategory,
  getFileInfo,
  generateFileId,
  FILE_SIZE_LIMIT_MB,
  FILE_SIZE_LIMIT_BYTES,
  MAX_FILES,
  AGGREGATE_SIZE_LIMIT_MB,
  AGGREGATE_SIZE_LIMIT_BYTES,
  SUPPORTED_FILE_TYPES,
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
  /** uploadId from the presign step — used to delete the upload on the backend. */
  uploadId: string;
}

export interface UseFileUploadPipelineOptions {
  onError?: (error: string, message: string) => void;
}

/**
 * Hook that manages file attachments with eager upload.
 *
 * When files are added and a conversationId is available, the full pipeline
 * (presign → S3 PUT → confirm) starts immediately. The attachment status
 * transitions: pending → uploading → uploaded/error.
 *
 * Enforces limits:
 * - Per-file: 20MB max
 * - Per-batch: 5 files max
 */
export function useFileUploadPipeline(
  conversationId: string | null,
  options?: UseFileUploadPipelineOptions,
) {
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  // Map of attachment ID → MessageFileAttachment (for completed uploads)
  const metadataRef = useRef<Map<string, MessageFileAttachment>>(new Map());
  const prevConversationIdRef = useRef<string | null>(conversationId);
  const conversationIdRef = useRef(conversationId);
  conversationIdRef.current = conversationId;

  const onErrorRef = useRef(options?.onError);
  onErrorRef.current = options?.onError;

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
          uploadId: presignResponse.uploadId,
        };
        // Only write metadata if we're still on the same conversation.
        // Allow null → newId transitions (new-conversation flow where the
        // conversation is created after files are attached).
        if (
          conversationIdRef.current !== null &&
          conversationIdRef.current !== convId
        )
          return;
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
      // 1. Validate per-file size first (most intuitive — user just picked this file)
      for (const file of rawFiles) {
        if (file.size > FILE_SIZE_LIMIT_BYTES) {
          onErrorRef.current?.(
            "file_too_large",
            `"${file.name}" exceeds the ${FILE_SIZE_LIMIT_MB} MB limit. Please choose a smaller file.`,
          );
          return;
        }
      }

      // 2. Validate total file count (existing + new)
      if (attachments.length + rawFiles.length > MAX_FILES) {
        onErrorRef.current?.(
          "max_files_exceeded",
          `Up to ${MAX_FILES} files can be attached per message.`,
        );
        return;
      }

      // 3. Validate aggregate size (existing + new must be under 20MB)
      const existingSize = attachments.reduce((sum, a) => sum + a.size, 0);
      const newSize = rawFiles.reduce((sum, f) => sum + f.size, 0);
      if (existingSize + newSize > AGGREGATE_SIZE_LIMIT_BYTES) {
        onErrorRef.current?.(
          "aggregate_size_exceeded",
          `Total attachment size cannot exceed ${AGGREGATE_SIZE_LIMIT_MB} MB. Try removing a file or using a smaller one.`,
        );
        return;
      }

      const newAttachments: FileAttachment[] = [];

      for (const file of rawFiles) {
        // Validate type
        const fileInfo = getFileInfo(file.type);
        if (!fileInfo) {
          const ext = file.name.split(".").pop()?.toLowerCase();
          const supportedExtensions = Object.values(SUPPORTED_FILE_TYPES).map(
            (t) => t.extension.toLowerCase(),
          );
          if (!ext || !supportedExtensions.includes(ext)) {
            onErrorRef.current?.(
              "unsupported_type",
              `"${file.name}" is not a supported format. Accepted types: PDF, DOC, DOCX, XLS, XLSX, CSV, PPT, PPTX, TXT, MD, JSON, PNG, JPG, and GIF.`,
            );
            continue;
          }
        }

        // Check duplicates
        const isDuplicate = attachments.some(
          (a) => a.name === file.name && a.size === file.size,
        );
        if (isDuplicate) {
          onErrorRef.current?.(
            "duplicate_file",
            `"${file.name}" is already attached.`,
          );
          continue;
        }

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

  // Clear file state when switching between conversations.
  // null → ID is skipped (new conversation being assigned, keep files).
  // ID_A → ID_B means user switched — clear stale attachments and S3 metadata.
  useEffect(() => {
    const prev = prevConversationIdRef.current;
    prevConversationIdRef.current = conversationId;

    if (prev !== null && prev !== conversationId) {
      setAttachments((currentAttachments) => {
        for (const a of currentAttachments) {
          if (a.previewUrl) URL.revokeObjectURL(a.previewUrl);
          if (a.uploadId && prev) {
            fileUploadService.deleteFile(prev, a.uploadId).catch(() => {});
          }
        }
        return [];
      });
      metadataRef.current.clear();
    }
  }, [conversationId]);

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
