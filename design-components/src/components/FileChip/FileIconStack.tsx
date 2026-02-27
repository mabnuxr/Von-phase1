/**
 * FileIconStack — stacked circular file-type icons with a count label.
 *
 * Designed for accordion summaries: shows up to 3 overlapping icons then
 * "N file(s)" text, matching the pattern in the screenshot.
 */

import React from 'react';
import type { ChipFile } from './FileChip';
import { FileTypeIcon } from './FileChip';

export interface FileIconStackProps {
  files: ChipFile[];
  /** Maximum number of icons shown before clipping. Defaults to 3. */
  maxIcons?: number;
  /**
   * Label rendered after the icon stack.
   * Defaults to "{count} file(s)". Pass a custom string to override
   * (e.g. "referring {count} files" for CommandPreview).
   */
  label?: string;
}

export const FileIconStack: React.FC<FileIconStackProps> = ({ files, maxIcons = 3, label }) => {
  if (files.length === 0) return null;

  const visible = files.slice(0, maxIcons);
  const overflow = files.length - visible.length;
  const count = files.length;
  const displayLabel = label ?? `${count} file${count !== 1 ? 's' : ''}`;

  return (
    <span className="inline-flex items-center gap-1.5">
      {/* Stacked icons */}
      <span className="inline-flex items-center">
        {visible.map((file, i) => (
          <span
            key={file.id}
            className="inline-flex items-center justify-center w-[22px] h-[22px] rounded-full bg-white border border-gray-200 shrink-0"
            style={{ marginLeft: i > 0 ? -7 : 0, zIndex: visible.length - i }}
            title={file.name}
          >
            <FileTypeIcon file={file} size={11} />
          </span>
        ))}
        {overflow > 0 && (
          <span
            className="inline-flex items-center justify-center w-[22px] h-[22px] rounded-full bg-gray-100 border border-gray-200 text-[10px] leading-none font-medium text-gray-500 shrink-0"
            style={{ marginLeft: -7 }}
          >
            +{overflow}
          </span>
        )}
      </span>

      {/* Label */}
      <span className="text-xs text-gray-400">{displayLabel}</span>
    </span>
  );
};

export default FileIconStack;
