/**
 * File Attachment Types
 * Types and interfaces for file upload functionality in chat
 */

/**
 * Supported file types for upload
 */
export const SUPPORTED_FILE_TYPES = {
  // Documents
  'application/pdf': { extension: 'PDF', category: 'document' },
  'application/msword': { extension: 'DOC', category: 'document' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
    extension: 'DOCX',
    category: 'document',
  },

  // Spreadsheets
  'application/vnd.ms-excel': { extension: 'XLS', category: 'spreadsheet' },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
    extension: 'XLSX',
    category: 'spreadsheet',
  },
  'text/csv': { extension: 'CSV', category: 'spreadsheet' },

  // Presentations
  'application/vnd.ms-powerpoint': { extension: 'PPT', category: 'presentation' },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': {
    extension: 'PPTX',
    category: 'presentation',
  },

  // Text
  'text/plain': { extension: 'TXT', category: 'text' },
  'application/json': { extension: 'JSON', category: 'text' },
  'text/markdown': { extension: 'MD', category: 'text' },

  // Images
  'image/jpeg': { extension: 'JPG', category: 'image' },
  'image/png': { extension: 'PNG', category: 'image' },
  'image/gif': { extension: 'GIF', category: 'image' },
} as const;

export type SupportedMimeType = keyof typeof SUPPORTED_FILE_TYPES;
export type FileCategory = 'document' | 'spreadsheet' | 'presentation' | 'text' | 'image';

/**
 * File size limits
 */
export const FILE_SIZE_LIMIT_MB = 5;
export const FILE_SIZE_LIMIT_BYTES = FILE_SIZE_LIMIT_MB * 1024 * 1024;
export const MAX_FILES = 5;
export const AGGREGATE_SIZE_LIMIT_MB = 10;
export const AGGREGATE_SIZE_LIMIT_BYTES = AGGREGATE_SIZE_LIMIT_MB * 1024 * 1024;

/**
 * Represents an attached file
 */
export interface FileAttachment {
  /** Unique identifier for the attachment */
  id: string;
  /** Original file object */
  file: File;
  /** File name */
  name: string;
  /** File size in bytes */
  size: number;
  /** MIME type */
  type: string;
  /** File extension (e.g., 'PDF', 'XLSX') */
  extension: string;
  /** File category */
  category: FileCategory;
  /** Preview URL for images */
  previewUrl?: string;
  /** Upload progress (0-100) */
  uploadProgress?: number;
  /** Upload status */
  status: 'pending' | 'uploading' | 'uploaded' | 'error';
  /** Error message if upload failed */
  error?: string;
  /** Backend file ID — set after presign */
  uploadId?: string;
  /** S3 key — set after presign */
  s3Key?: string;
}

/**
 * File validation error types
 */
export type FileValidationError =
  | 'file_too_large'
  | 'unsupported_type'
  | 'max_files_exceeded'
  | 'duplicate_file'
  | 'aggregate_size_exceeded'
  | 'conversation_files_exceeded';

/**
 * File validation result
 */
export interface FileValidationResult {
  valid: boolean;
  error?: FileValidationError;
  message?: string;
}

/**
 * Get file info from MIME type
 */
export function getFileInfo(
  mimeType: string
): { extension: string; category: FileCategory } | null {
  const info = SUPPORTED_FILE_TYPES[mimeType as SupportedMimeType];
  if (info) {
    return { extension: info.extension, category: info.category };
  }

  return null;
}

/**
 * Get accept string for file input
 */
export function getAcceptString(): string {
  return Object.keys(SUPPORTED_FILE_TYPES).join(',');
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}

/**
 * Generate unique ID for file attachment
 */
export function generateFileId(): string {
  return `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
