import { useState, useEffect, useRef, useCallback } from 'react';
import type { Command, CommandAttachment } from './types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseCommandDataSourcesOptions {
  isOpen: boolean;
  /** Used when calling onUploadFile — must come from useCommandForm so both hooks share the same ID. */
  commandId: string;
  editingCommand?: Command | null;
  onUploadFile?: (commandId: string, file: File) => Promise<{ fileId: string; s3Key: string }>;
  onRequestFilePreviewUrl?: (s3Key: string) => Promise<string>;
}

export interface UseCommandDataSourcesReturn {
  dataSources: CommandAttachment[];
  isAnyFileUploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  /** Add files: creates uploading placeholders, then eagerly uploads each one. */
  handleFilesSelected: (files: File[]) => Promise<void>;
  handleRemoveDataSource: (id: string) => void;
  /** Open the preview panel for a specific file. */
  handleFileChipClick: (fileId: string) => void;
  previewFileId: string | null;
  setPreviewFileId: React.Dispatch<React.SetStateAction<string | null>>;
  /** Presigned URLs fetched on-demand; null = fetch failed. */
  fetchedPreviewUrls: Record<string, string | null>;
  requestPreviewUrl: (fileId: string) => Promise<void>;
  previewIndex: number;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useCommandDataSources({
  isOpen,
  commandId,
  editingCommand,
  onUploadFile,
  onRequestFilePreviewUrl,
}: UseCommandDataSourcesOptions): UseCommandDataSourcesReturn {
  const [dataSources, setDataSources] = useState<CommandAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Tracks filenames currently uploading or already uploaded to prevent duplicates
  const uploadedFileNamesRef = useRef<Set<string>>(new Set());
  // Presigned download URLs fetched on-demand; null = fetch attempted and failed
  const [fetchedPreviewUrls, setFetchedPreviewUrls] = useState<Record<string, string | null>>({});
  // In-flight preview URL requests — ref-based so dedup check is never stale
  const fetchingPreviewIdsRef = useRef<Set<string>>(new Set());
  const [previewFileId, setPreviewFileId] = useState<string | null>(null);

  // Reset whenever the drawer opens
  useEffect(() => {
    if (isOpen) {
      setFetchedPreviewUrls({});
      fetchingPreviewIdsRef.current.clear();
      setPreviewFileId(null);
      setDataSources(editingCommand?.dataSources ?? []);
      uploadedFileNamesRef.current = new Set(
        editingCommand?.dataSources?.map((ds) => ds.name) ?? []
      );
    }
  }, [isOpen, editingCommand]);

  const handleRemoveDataSource = useCallback((id: string) => {
    setPreviewFileId((current) => (current === id ? null : current));
    setDataSources((prev) => {
      const removed = prev.find((ds) => ds.id === id);
      if (removed) uploadedFileNamesRef.current.delete(removed.name);
      return prev.filter((ds) => ds.id !== id);
    });
  }, []);

  // Fetches a presigned URL for a single file and stores the result.
  // Ref-based in-flight guard prevents duplicate concurrent fetches without
  // capturing fetchedPreviewUrls as a dependency.
  const requestPreviewUrl = useCallback(
    async (fileId: string) => {
      if (!onRequestFilePreviewUrl) return;
      if (fetchingPreviewIdsRef.current.has(fileId)) return;
      const s3Key = dataSources.find((ds) => ds.id === fileId)?.s3Key;
      if (!s3Key) return;
      fetchingPreviewIdsRef.current.add(fileId);
      try {
        const url = await onRequestFilePreviewUrl(s3Key);
        setFetchedPreviewUrls((prev) => ({ ...prev, [fileId]: url }));
      } catch {
        setFetchedPreviewUrls((prev) => ({ ...prev, [fileId]: null }));
      }
    },
    [dataSources, onRequestFilePreviewUrl]
  );

  const handleFileChipClick = useCallback((fileId: string) => {
    setPreviewFileId(fileId);
  }, []);

  const handleFilesSelected = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;

      const uniqueFiles = files.filter((f) => !uploadedFileNamesRef.current.has(f.name));
      if (uniqueFiles.length === 0) return;
      uniqueFiles.forEach((f) => uploadedFileNamesRef.current.add(f.name));

      const newAttachments: CommandAttachment[] = uniqueFiles.map((file) => {
        const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
        let category: CommandAttachment['category'] = 'document';
        if (file.type.startsWith('image/')) category = 'image';
        else if (
          file.type.includes('spreadsheet') ||
          file.type.includes('excel') ||
          ['xlsx', 'xls', 'csv'].includes(ext)
        )
          category = 'spreadsheet';
        else if (
          file.type.includes('presentation') ||
          file.type.includes('powerpoint') ||
          ['pptx', 'ppt'].includes(ext)
        )
          category = 'presentation';
        else if (['txt', 'md', 'json'].includes(ext)) category = 'text';

        return {
          id: `pending-${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name}`,
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          extension: ext,
          category,
          uploadStatus: 'uploading' as const,
        };
      });

      // Show uploading placeholders immediately
      setDataSources((prev) => [...prev, ...newAttachments]);

      if (onUploadFile) {
        await Promise.all(
          newAttachments.map(async (attachment, idx) => {
            const file = uniqueFiles[idx];
            const tempId = attachment.id;
            try {
              const { fileId, s3Key } = await onUploadFile(commandId, file);
              setDataSources((prev) =>
                prev.map((ds) =>
                  ds.id === tempId
                    ? { ...ds, id: fileId, s3Key, uploadStatus: 'uploaded' as const }
                    : ds
                )
              );
            } catch {
              // Remove silently — clears dedup entry so the user can retry
              uploadedFileNamesRef.current.delete(file.name);
              setDataSources((prev) => prev.filter((ds) => ds.id !== tempId));
              setPreviewFileId((current) => (current === tempId ? null : current));
            }
          })
        );
      }
    },
    [commandId, onUploadFile]
  );

  const isAnyFileUploading = dataSources.some((ds) => ds.uploadStatus === 'uploading');
  const previewIndex = previewFileId ? dataSources.findIndex((ds) => ds.id === previewFileId) : -1;

  return {
    dataSources,
    isAnyFileUploading,
    fileInputRef,
    handleFilesSelected,
    handleRemoveDataSource,
    handleFileChipClick,
    previewFileId,
    setPreviewFileId,
    fetchedPreviewUrls,
    requestPreviewUrl,
    previewIndex,
  };
}
