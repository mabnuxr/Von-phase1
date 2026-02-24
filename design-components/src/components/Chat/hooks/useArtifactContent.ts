/**
 * useArtifactContent — Fetches and parses S3-backed artifacts client-side
 *
 * Dispatches by MIME type:
 * - PDF:  native browser iframe (no fetch)
 * - MD/TXT: fetch text → TipTap readonly
 * - DOCX: docx-preview → rendered in DOM
 * - XLSX/CSV: SheetJS → HTML tables per sheet
 * - PPTX/other: download-only fallback
 */

import { useState, useEffect } from 'react';
import type XLSX_NS from 'xlsx';
import DOMPurify from 'dompurify';

// Lazy-load SheetJS (~700 KB) only when a spreadsheet is actually opened
let _xlsx: typeof XLSX_NS | null = null;
async function loadXlsx(): Promise<typeof XLSX_NS> {
  if (!_xlsx) {
    _xlsx = await import('xlsx');
  }
  return _xlsx;
}

// ============================================================================
// Types
// ============================================================================

export interface HtmlSheet {
  name: string;
  html: string;
}

export type ArtifactContent =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'image'; url: string }
  | { kind: 'pdf'; url: string }
  | { kind: 'text'; text: string }
  | { kind: 'docx'; buffer: ArrayBuffer }
  | { kind: 'spreadsheet'; sheets: HtmlSheet[]; truncated: boolean }
  | { kind: 'unsupported' };

// ============================================================================
// MIME helpers
// ============================================================================

const PDF_MIMES = new Set(['application/pdf']);

const TEXT_MIMES = new Set(['text/markdown', 'text/plain', 'text/x-markdown']);

const DOCX_MIMES = new Set([
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
]);

const SPREADSHEET_MIMES = new Set([
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv',
]);

// ============================================================================
// Parsers
// ============================================================================

/** Max rows per sheet before truncation to prevent browser hangs on large files */
const MAX_PREVIEW_ROWS = 5000;

async function parseSpreadsheet(
  data: ArrayBuffer | string,
  isText: boolean
): Promise<ArtifactContent> {
  const xlsx = await loadXlsx();
  const workbook = isText
    ? xlsx.read(data as string, { type: 'string' })
    : xlsx.read(new Uint8Array(data as ArrayBuffer), { type: 'array' });

  let truncated = false;

  const sheets: HtmlSheet[] = workbook.SheetNames.map((name: string) => {
    const sheet = workbook.Sheets[name];
    if (!sheet) return null;

    const ref = sheet['!ref'];
    if (ref) {
      const range = xlsx.utils.decode_range(ref);
      if (range.e.r >= MAX_PREVIEW_ROWS) {
        range.e.r = MAX_PREVIEW_ROWS - 1;
        sheet['!ref'] = xlsx.utils.encode_range(range);
        truncated = true;
      }
    }

    const rawHtml = xlsx.utils.sheet_to_html(sheet, { id: '', editable: false });
    return { name, html: DOMPurify.sanitize(rawHtml, { ALLOWED_URI_REGEXP: /^https?:\/\// }) };
  }).filter((s: HtmlSheet | null): s is HtmlSheet => s !== null);

  if (sheets.length === 0) {
    return { kind: 'error', message: 'No readable sheets found in this file' };
  }

  return { kind: 'spreadsheet', sheets, truncated };
}

// ============================================================================
// Fetch helper
// ============================================================================

async function fetchOrThrow(url: string): Promise<Response> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch file (${response.status})`);
  }
  return response;
}

// ============================================================================
// Main dispatcher
// ============================================================================

async function parseArtifact(downloadUrl: string, mimeType?: string): Promise<ArtifactContent> {
  if (!mimeType) return { kind: 'unsupported' };

  if (mimeType.startsWith('image/')) {
    return { kind: 'image', url: downloadUrl };
  }

  if (PDF_MIMES.has(mimeType)) {
    return { kind: 'pdf', url: downloadUrl };
  }

  if (TEXT_MIMES.has(mimeType)) {
    const response = await fetchOrThrow(downloadUrl);
    return { kind: 'text', text: await response.text() };
  }

  if (DOCX_MIMES.has(mimeType)) {
    const response = await fetchOrThrow(downloadUrl);
    return { kind: 'docx', buffer: await response.arrayBuffer() };
  }

  if (SPREADSHEET_MIMES.has(mimeType)) {
    const response = await fetchOrThrow(downloadUrl);
    const isCsv = mimeType === 'text/csv';
    const data = isCsv ? await response.text() : await response.arrayBuffer();
    return parseSpreadsheet(data, isCsv);
  }

  return { kind: 'unsupported' };
}

// ============================================================================
// Hook
// ============================================================================

export function useArtifactContent(downloadUrl?: string, mimeType?: string): ArtifactContent {
  const [content, setContent] = useState<ArtifactContent>({ kind: 'loading' });

  useEffect(() => {
    if (!downloadUrl) {
      setContent({ kind: 'loading' });
      return;
    }

    let cancelled = false;
    setContent({ kind: 'loading' });

    parseArtifact(downloadUrl, mimeType)
      .then((result) => {
        if (!cancelled) setContent(result);
      })
      .catch((err) => {
        if (!cancelled) {
          setContent({ kind: 'error', message: err?.message ?? 'Failed to load artifact' });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [downloadUrl, mimeType]);

  return content;
}
