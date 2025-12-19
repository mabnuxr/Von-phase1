// Types
export type {
  FileAttachment,
  FileCategory,
  SupportedMimeType,
  FileValidationError,
  FileValidationResult,
} from './types';

export {
  SUPPORTED_FILE_TYPES,
  FILE_SIZE_LIMIT_MB,
  FILE_SIZE_LIMIT_BYTES,
  MAX_FILES,
  getFileInfo,
  getAcceptString,
  formatFileSize,
  generateFileId,
} from './types';

// Components
export { FilePreview } from './FilePreview';
export type { FilePreviewProps } from './FilePreview';

export { MessageFilePreview } from './MessageFilePreview';
export type { MessageFilePreviewProps } from './MessageFilePreview';

export { DragDropOverlay } from './DragDropOverlay';
export type { DragDropOverlayProps } from './DragDropOverlay';

// Hooks
export { useFileUpload } from './useFileUpload';
export type { UseFileUploadOptions, UseFileUploadReturn } from './useFileUpload';
