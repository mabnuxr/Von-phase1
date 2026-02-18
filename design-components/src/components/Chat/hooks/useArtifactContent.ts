/**
 * useArtifactContent — Fetches and parses S3-backed artifacts client-side
 *
 * Dispatches by MIME type:
 * - PDF:  native browser iframe (no fetch)
 * - MD/TXT: fetch text → TipTap readonly
 * - DOCX: docx-preview → rendered in DOM
 * - XLSX: ExcelJS → structured sheets
 * - CSV:  text split → structured sheet
 * - PPTX/other: download-only fallback
 */

import { useState, useEffect } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface ParsedSheet {
  name: string;
  columns: Array<{ id: string; label: string }>;
  rows: Record<string, string | number>[];
}

export type ArtifactContent =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'pdf'; url: string }
  | { kind: 'text'; text: string }
  | { kind: 'docx'; buffer: ArrayBuffer }
  | { kind: 'spreadsheet'; sheets: ParsedSheet[] }
  | { kind: 'unsupported' };

// ============================================================================
// MIME type classification
// ============================================================================

const PDF_MIMES = new Set(['application/pdf']);

const TEXT_MIMES = new Set(['text/markdown', 'text/plain', 'text/x-markdown']);

const DOCX_MIMES = new Set([
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
]);

const XLSX_MIMES = new Set([
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
]);

const CSV_MIMES = new Set(['text/csv']);

// ============================================================================
// Parsers (lazy-imported to avoid bloating the main bundle)
// ============================================================================

async function parseXlsx(buffer: ArrayBuffer): Promise<ArtifactContent> {
  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const sheets: ParsedSheet[] = [];
  workbook.eachSheet((worksheet) => {
    const columns: Array<{ id: string; label: string }> = [];
    const rows: Record<string, string | number>[] = [];

    // First row → column headers
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const id = `col_${colNumber - 1}`;
      const label = String(cell.value ?? `Column ${colNumber}`);
      columns.push({ id, label });
    });

    // If no columns found, skip this sheet
    if (columns.length === 0) return;

    // Remaining rows → data
    for (let rowIdx = 2; rowIdx <= worksheet.rowCount; rowIdx++) {
      const row = worksheet.getRow(rowIdx);
      const record: Record<string, string | number> = {};
      let hasValue = false;

      columns.forEach((col, colIdx) => {
        const cell = row.getCell(colIdx + 1);
        const value = cell.value;
        if (value !== null && value !== undefined && value !== '') {
          hasValue = true;
        }
        // Handle ExcelJS cell value types
        if (value && typeof value === 'object' && 'result' in value) {
          record[col.id] = String((value as { result: unknown }).result ?? '');
        } else {
          record[col.id] =
            value !== null && value !== undefined
              ? typeof value === 'number'
                ? value
                : String(value)
              : '';
        }
      });

      // Skip completely empty rows
      if (hasValue) {
        rows.push(record);
      }
    }

    sheets.push({ name: worksheet.name, columns, rows });
  });

  if (sheets.length === 0) {
    return { kind: 'error', message: 'No readable sheets found in this file' };
  }

  return { kind: 'spreadsheet', sheets };
}

function parseCsv(text: string): ArtifactContent {
  const lines = text.split('\n').filter((line) => line.trim() !== '');
  if (lines.length === 0) {
    return { kind: 'error', message: 'Empty CSV file' };
  }

  // Simple CSV parser (handles quoted fields)
  function splitCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  const headerFields = splitCsvLine(lines[0]);
  const columns = headerFields.map((label, i) => ({
    id: `col_${i}`,
    label: label || `Column ${i + 1}`,
  }));

  const rows: Record<string, string | number>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const fields = splitCsvLine(lines[i]);
    const record: Record<string, string | number> = {};
    columns.forEach((col, colIdx) => {
      const raw = fields[colIdx] ?? '';
      const num = Number(raw);
      record[col.id] = raw !== '' && !isNaN(num) ? num : raw;
    });
    rows.push(record);
  }

  return { kind: 'spreadsheet', sheets: [{ name: 'Sheet 1', columns, rows }] };
}

// ============================================================================
// Main parse dispatcher
// ============================================================================

async function parseArtifact(downloadUrl: string, mimeType?: string): Promise<ArtifactContent> {
  if (!mimeType) return { kind: 'unsupported' };

  if (PDF_MIMES.has(mimeType)) {
    return { kind: 'pdf', url: downloadUrl };
  }

  if (TEXT_MIMES.has(mimeType)) {
    const response = await fetch(downloadUrl);
    const text = await response.text();
    return { kind: 'text', text };
  }

  if (CSV_MIMES.has(mimeType)) {
    const response = await fetch(downloadUrl);
    const text = await response.text();
    return parseCsv(text);
  }

  if (DOCX_MIMES.has(mimeType)) {
    const response = await fetch(downloadUrl);
    const buffer = await response.arrayBuffer();
    return { kind: 'docx', buffer };
  }

  if (XLSX_MIMES.has(mimeType)) {
    const response = await fetch(downloadUrl);
    const buffer = await response.arrayBuffer();
    return parseXlsx(buffer);
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
