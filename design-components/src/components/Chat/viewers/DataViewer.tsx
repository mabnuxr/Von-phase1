/**
 * DataViewer — Inline preview for structured data files
 *
 * Switches by `format` (derived from MIME / extension):
 *  - json   → pretty-printed JSON
 *  - jsonl  → first N lines, each pretty-printed; warns when truncated
 *  - xml    → pre-formatted with light wrapping
 *  - yaml   → pre-formatted
 *  - binary → metadata + "binary file" message (e.g. Parquet)
 *
 * Sized to keep the parser cost predictable: a single very large JSON blob is rendered
 * directly via JSON.stringify, but JSONL is line-capped to avoid runaway DOM size.
 */

import React, { useMemo } from 'react';

/**
 * Discriminator for the data-file renderer. Single source of truth — extend
 * this const-object whenever a new format is added; do NOT fall back to
 * `string` at call sites. Follows the project's const-object + derived-type
 * convention (see `ArtifactType`, `MentionItemType`).
 */
export const DataFormat = {
  Json: 'json',
  Jsonl: 'jsonl',
  Xml: 'xml',
  Yaml: 'yaml',
  Binary: 'binary',
} as const;

export type DataFormat = (typeof DataFormat)[keyof typeof DataFormat];

interface DataViewerProps {
  /** Raw file text (UTF-8). For binary formats this should be empty. */
  text: string;
  format: DataFormat;
  /** File size in bytes — used for the binary placeholder. */
  sizeBytes?: number;
  /** File name (e.g. "report.parquet") — surfaced in the binary placeholder. */
  fileName?: string;
}

const JSONL_PREVIEW_LINES = 200;

function formatJson(text: string): { body: string; error?: string } {
  try {
    return { body: JSON.stringify(JSON.parse(text), null, 2) };
  } catch (err) {
    return { body: text, error: err instanceof Error ? err.message : 'Invalid JSON' };
  }
}

function formatJsonl(text: string): { body: string; truncated: boolean; errors: number } {
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  const preview = lines.slice(0, JSONL_PREVIEW_LINES);
  let errors = 0;
  const body = preview
    .map((line, idx) => {
      try {
        return `// line ${idx + 1}\n${JSON.stringify(JSON.parse(line), null, 2)}`;
      } catch {
        errors += 1;
        return `// line ${idx + 1} (parse error)\n${line}`;
      }
    })
    .join('\n\n');
  return { body, truncated: lines.length > JSONL_PREVIEW_LINES, errors };
}

export const DataViewer: React.FC<DataViewerProps> = ({ text, format, sizeBytes, fileName }) => {
  const rendered = useMemo(() => {
    if (format === DataFormat.Binary) {
      return {
        body: '',
        notice: `Binary file${
          sizeBytes ? ` (${(sizeBytes / 1024).toFixed(1)} KB)` : ''
        }. Use Download to open in a native tool.`,
      };
    }
    if (format === DataFormat.Json) {
      const { body, error } = formatJson(text);
      return { body, notice: error ? `Could not parse JSON: ${error}` : undefined };
    }
    if (format === DataFormat.Jsonl) {
      const { body, truncated, errors } = formatJsonl(text);
      const parts: string[] = [];
      if (truncated)
        parts.push(`Showing first ${JSONL_PREVIEW_LINES} of many lines — download for full file.`);
      if (errors > 0) parts.push(`${errors} line(s) failed to parse and are shown raw.`);
      return { body, notice: parts.length ? parts.join(' ') : undefined };
    }
    // xml, yaml — render as-is, monospace
    return { body: text, notice: undefined };
  }, [text, format, sizeBytes]);

  return (
    <div className="flex-1 overflow-auto bg-gray-50 p-4 settings-scrollbar">
      {rendered.notice && (
        <div className="mb-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
          {rendered.notice}
        </div>
      )}
      {format === DataFormat.Binary ? (
        <div className="text-sm text-gray-600">{fileName ?? 'Unknown file'}</div>
      ) : (
        <pre className="text-xs font-mono whitespace-pre-wrap break-words text-gray-800 bg-white border border-gray-200 rounded p-4">
          {rendered.body}
        </pre>
      )}
    </div>
  );
};
