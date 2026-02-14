import { useState, useCallback, useRef } from 'react';
import type { FileAttachment, FileValidationResult, FileValidationError } from './types';
import {
  FILE_SIZE_LIMIT_BYTES,
  FILE_SIZE_LIMIT_MB,
  MAX_FILES,
  SUPPORTED_FILE_TYPES,
  getFileInfo,
  generateFileId,
} from './types';

export interface UseFileUploadOptions {
  /** Callback when a file validation error occurs */
  onError?: (error: FileValidationError, message: string) => void;
  /** Callback when files are added */
  onFilesAdded?: (files: FileAttachment[]) => void;
  /** Callback when a file is removed */
  onFileRemoved?: (id: string) => void;
  /** Maximum number of files allowed */
  maxFiles?: number;
  /** Maximum file size in bytes */
  maxSizeBytes?: number;
}

export interface UseFileUploadReturn {
  /** Current attached files */
  attachments: FileAttachment[];
  /** Whether drag is active over the drop zone */
  isDragActive: boolean;
  /** Add files from file input or drop */
  addFiles: (files: FileList | File[]) => void;
  /** Remove a file by ID */
  removeFile: (id: string) => void;
  /** Clear all files */
  clearFiles: () => void;
  /** Handle drag enter event */
  handleDragEnter: (e: React.DragEvent) => void;
  /** Handle drag leave event */
  handleDragLeave: (e: React.DragEvent) => void;
  /** Handle drag over event */
  handleDragOver: (e: React.DragEvent) => void;
  /** Handle drop event */
  handleDrop: (e: React.DragEvent) => void;
  /** Open file picker */
  openFilePicker: () => void;
  /** Ref for hidden file input */
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  /** Whether file picker is open */
  isPickerOpen: boolean;
}

/**
 * Validate a single file
 */
function validateFile(
  file: File,
  currentCount: number,
  existingFiles: FileAttachment[],
  maxFiles: number,
  maxSizeBytes: number
): FileValidationResult {
  // Check file size
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: 'file_too_large',
      message: `"${file.name}" exceeds the ${FILE_SIZE_LIMIT_MB} MB limit. Please choose a smaller file.`,
    };
  }

  // Check max files
  if (currentCount >= maxFiles) {
    return {
      valid: false,
      error: 'max_files_exceeded',
      message: `Up to ${maxFiles} files can be attached per message.`,
    };
  }

  // Check supported type
  const fileInfo = getFileInfo(file.type);
  if (!fileInfo) {
    // Try to get extension from filename as fallback
    const extension = file.name.split('.').pop()?.toLowerCase();
    const supportedExtensions = Object.values(SUPPORTED_FILE_TYPES).map((t) =>
      t.extension.toLowerCase()
    );

    if (!extension || !supportedExtensions.includes(extension)) {
      return {
        valid: false,
        error: 'unsupported_type',
        message: `"${file.name}" is not a supported format. Accepted types: PDF, DOC, DOCX, XLS, XLSX, CSV, PPT, PPTX, TXT, MD, JSON, PNG, JPG, and GIF.`,
      };
    }
  }

  // Check for duplicates (by name and size)
  const isDuplicate = existingFiles.some(
    (existing) => existing.name === file.name && existing.size === file.size
  );
  if (isDuplicate) {
    return {
      valid: false,
      error: 'duplicate_file',
      message: `"${file.name}" is already attached.`,
    };
  }

  return { valid: true };
}

/**
 * Create FileAttachment from File
 */
function createAttachment(file: File): FileAttachment {
  const fileInfo = getFileInfo(file.type);

  // Fallback extension from filename
  const fallbackExtension = file.name.split('.').pop()?.toUpperCase() || 'FILE';

  const attachment: FileAttachment = {
    id: generateFileId(),
    file,
    name: file.name,
    size: file.size,
    type: file.type,
    extension: fileInfo?.extension || fallbackExtension,
    category: fileInfo?.category || 'document',
    status: 'pending',
  };

  // Create preview URL for images
  if (attachment.category === 'image') {
    attachment.previewUrl = URL.createObjectURL(file);
  }

  return attachment;
}

/**
 * Hook for managing file uploads in chat
 */
export function useFileUpload(options: UseFileUploadOptions = {}): UseFileUploadReturn {
  const {
    onError,
    onFilesAdded,
    onFileRemoved,
    maxFiles = MAX_FILES,
    maxSizeBytes = FILE_SIZE_LIMIT_BYTES,
  } = options;

  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const validAttachments: FileAttachment[] = [];
      let currentCount = attachments.length;

      for (const file of fileArray) {
        const validation = validateFile(
          file,
          currentCount,
          [...attachments, ...validAttachments],
          maxFiles,
          maxSizeBytes
        );

        if (validation.valid) {
          validAttachments.push(createAttachment(file));
          currentCount++;
        } else if (validation.error && validation.message) {
          onError?.(validation.error, validation.message);
        }
      }

      if (validAttachments.length > 0) {
        setAttachments((prev) => [...prev, ...validAttachments]);
        onFilesAdded?.(validAttachments);
      }
    },
    [attachments, maxFiles, maxSizeBytes, onError, onFilesAdded]
  );

  const removeFile = useCallback(
    (id: string) => {
      setAttachments((prev) => {
        const file = prev.find((f) => f.id === id);
        // Revoke object URL to prevent memory leaks
        if (file?.previewUrl) {
          URL.revokeObjectURL(file.previewUrl);
        }
        return prev.filter((f) => f.id !== id);
      });
      onFileRemoved?.(id);
    },
    [onFileRemoved]
  );

  const clearFiles = useCallback(() => {
    // Revoke all object URLs
    attachments.forEach((file) => {
      if (file.previewUrl) {
        URL.revokeObjectURL(file.previewUrl);
      }
    });
    setAttachments([]);
  }, [attachments]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragActive(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragActive(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);
      dragCounterRef.current = 0;

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
        e.dataTransfer.clearData();
      }
    },
    [addFiles]
  );

  const openFilePicker = useCallback(() => {
    setIsPickerOpen(true);
    fileInputRef.current?.click();
    // Reset picker state after a short delay
    setTimeout(() => setIsPickerOpen(false), 100);
  }, []);

  return {
    attachments,
    isDragActive,
    addFiles,
    removeFile,
    clearFiles,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    openFilePicker,
    fileInputRef,
    isPickerOpen,
  };
}

export default useFileUpload;
