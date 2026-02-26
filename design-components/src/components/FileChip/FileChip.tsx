/**
 * FileChip — pill-shaped chip for representing an attached file.
 *
 * Displays a colored Phosphor file-type icon, the file name, an optional
 * remove button, and a spinner while the file is uploading.
 */

import React from 'react';
import {
  FileDoc,
  FilePdf,
  FileXls,
  FileCsv,
  FilePpt,
  FileText,
  FileImage,
  File as GenericFileIcon,
  SpinnerGap,
  X,
} from '@phosphor-icons/react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Minimal file shape the chip needs to render correctly. */
export interface ChipFile {
  id: string;
  name: string;
  /** MIME type, e.g. "application/pdf" */
  type?: string;
  extension?: string;
  category?: string;
}

export interface FileChipProps {
  file: ChipFile;
  /** Show an upload spinner and disable all interactions. */
  isUploading?: boolean;
  /** If provided, renders a remove (×) button. */
  onRemove?: (id: string) => void;
  /** Called when the chip body is clicked (e.g. open preview). */
  onClick?: (id: string) => void;
}

// ---------------------------------------------------------------------------
// Icon helper — exported so FileIconStack and other consumers can reuse it
// ---------------------------------------------------------------------------

export function FileTypeIcon({ file, size }: { file: ChipFile; size: number }) {
  const ext = file.extension?.toLowerCase();
  const mime = file.type ?? '';

  if (file.category === 'image')
    return <FileImage size={size} weight="duotone" className="text-gray-400 shrink-0" />;
  if (mime === 'application/pdf' || ext === 'pdf')
    return <FilePdf size={size} weight="duotone" className="text-gray-400 shrink-0" />;
  if (file.category === 'spreadsheet')
    return ext === 'csv' ? (
      <FileCsv size={size} weight="duotone" className="text-gray-400 shrink-0" />
    ) : (
      <FileXls size={size} weight="duotone" className="text-gray-400 shrink-0" />
    );
  if (file.category === 'presentation')
    return <FilePpt size={size} weight="duotone" className="text-gray-400 shrink-0" />;
  if (file.category === 'text')
    return <FileText size={size} weight="duotone" className="text-gray-400 shrink-0" />;
  if (ext === 'doc' || ext === 'docx')
    return <FileDoc size={size} weight="duotone" className="text-gray-400 shrink-0" />;
  return <GenericFileIcon size={size} weight="duotone" className="text-gray-400 shrink-0" />;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const FileChip: React.FC<FileChipProps> = ({
  file,
  isUploading = false,
  onRemove,
  onClick,
}) => {
  const clickable = !isUploading && !!onClick;

  return (
    <div
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={() => clickable && onClick!(file.id)}
      onKeyDown={(e) => clickable && e.key === 'Enter' && onClick!(file.id)}
      title={isUploading ? 'Uploading…' : file.name}
      className={`inline-flex items-center gap-1.5 pl-2 pr-2.5 py-1.5 rounded-2xl border text-xs max-w-[200px] transition-colors select-none ${
        isUploading
          ? 'bg-gray-50 border-gray-200 text-gray-400 opacity-60 cursor-default'
          : clickable
            ? 'bg-gray-100 border-gray-200 text-gray-700 cursor-pointer hover:bg-gray-200'
            : 'bg-gray-100 border-gray-200 text-gray-700'
      }`}
    >
      {isUploading ? (
        <SpinnerGap size={13} className="animate-spin shrink-0 text-gray-400" />
      ) : (
        <FileTypeIcon file={file} size={13} />
      )}

      <span className="truncate leading-none">{file.name}</span>

      {!isUploading && onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(file.id);
          }}
          className="ml-0.5 text-gray-400 hover:text-gray-600 shrink-0 cursor-pointer"
          aria-label={`Remove ${file.name}`}
        >
          <X size={10} />
        </button>
      )}
    </div>
  );
};

export default FileChip;
