/**
 * Artifact Download Utilities
 *
 * Generates real downloadable files from artifact data:
 * - Documents → .docx (using `docx` library)
 * - Slides → .pptx (using `pptxgenjs`)
 * - Spreadsheets → .xlsx (using `exceljs`)
 */

import { saveAs } from 'file-saver';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  BorderStyle,
  AlignmentType,
} from 'docx';
import PptxGenJS from 'pptxgenjs';
import ExcelJS from 'exceljs';
import type { DocumentArtifact, SlidesArtifact, SpreadsheetArtifact } from './ChatViewV2';

// ============================================================================
// Markdown → docx paragraph converter
// ============================================================================

interface ParsedBlock {
  type: 'h1' | 'h2' | 'h3' | 'paragraph' | 'bullet' | 'numbered' | 'hr';
  text: string;
  number?: number;
}

function parseMarkdownToBlocks(markdown: string): ParsedBlock[] {
  const lines = markdown.split('\n');
  const blocks: ParsedBlock[] = [];
  let numberedCounter = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      numberedCounter = 0;
      continue;
    }

    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      blocks.push({ type: 'hr', text: '' });
      numberedCounter = 0;
    } else if (trimmed.startsWith('### ')) {
      blocks.push({ type: 'h3', text: trimmed.slice(4) });
      numberedCounter = 0;
    } else if (trimmed.startsWith('## ')) {
      blocks.push({ type: 'h2', text: trimmed.slice(3) });
      numberedCounter = 0;
    } else if (trimmed.startsWith('# ')) {
      blocks.push({ type: 'h1', text: trimmed.slice(2) });
      numberedCounter = 0;
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      blocks.push({ type: 'bullet', text: trimmed.slice(2) });
      numberedCounter = 0;
    } else if (/^\d+\.\s/.test(trimmed)) {
      numberedCounter++;
      blocks.push({
        type: 'numbered',
        text: trimmed.replace(/^\d+\.\s/, ''),
        number: numberedCounter,
      });
    } else {
      blocks.push({ type: 'paragraph', text: trimmed });
      numberedCounter = 0;
    }
  }

  return blocks;
}

/** Strip markdown inline formatting (bold, italic, code) for plain text */
function stripInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/`(.+?)`/g, '$1');
}

/** Create TextRuns that handle bold/italic inline formatting */
function createTextRuns(text: string): TextRun[] {
  const runs: TextRun[] = [];
  // Split by bold markers first
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  for (const part of parts) {
    if (part.startsWith('**') && part.endsWith('**')) {
      runs.push(new TextRun({ text: part.slice(2, -2), bold: true, font: 'Arial', size: 22 }));
    } else if (part) {
      runs.push(new TextRun({ text: part, font: 'Arial', size: 22 }));
    }
  }

  return runs.length > 0 ? runs : [new TextRun({ text, font: 'Arial', size: 22 })];
}

function blocksToParagraphs(blocks: ParsedBlock[]): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  for (const block of blocks) {
    switch (block.type) {
      case 'h1':
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: stripInlineMarkdown(block.text),
                font: 'Arial',
                size: 32,
                bold: true,
              }),
            ],
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 240, after: 120 },
          })
        );
        break;
      case 'h2':
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: stripInlineMarkdown(block.text),
                font: 'Arial',
                size: 28,
                bold: true,
              }),
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          })
        );
        break;
      case 'h3':
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: stripInlineMarkdown(block.text),
                font: 'Arial',
                size: 24,
                bold: true,
              }),
            ],
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 160, after: 80 },
          })
        );
        break;
      case 'bullet':
        paragraphs.push(
          new Paragraph({
            children: createTextRuns(block.text),
            bullet: { level: 0 },
            spacing: { before: 40, after: 40 },
          })
        );
        break;
      case 'numbered':
        paragraphs.push(
          new Paragraph({
            children: createTextRuns(block.text),
            numbering: { reference: 'default-numbering', level: 0 },
            spacing: { before: 40, after: 40 },
          })
        );
        break;
      case 'hr':
        paragraphs.push(
          new Paragraph({
            children: [new TextRun('')],
            border: {
              bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
            },
            spacing: { before: 200, after: 200 },
          })
        );
        break;
      default:
        paragraphs.push(
          new Paragraph({
            children: createTextRuns(block.text),
            spacing: { before: 60, after: 60 },
          })
        );
    }
  }

  return paragraphs;
}

// ============================================================================
// Download Functions
// ============================================================================

/**
 * Generate and download a .docx file from a DocumentArtifact
 */
export async function downloadDocument(artifact: DocumentArtifact): Promise<void> {
  const blocks = parseMarkdownToBlocks(artifact.content);
  const paragraphs = blocksToParagraphs(blocks);

  const doc = new Document({
    numbering: {
      config: [
        {
          reference: 'default-numbering',
          levels: [
            {
              level: 0,
              format: 'decimal' as const,
              text: '%1.',
              alignment: AlignmentType.START,
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: paragraphs,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const filename = artifact.title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-');
  saveAs(blob, `${filename}.docx`);
}

/**
 * Generate and download a .pptx file from a SlidesArtifact
 */
export async function downloadSlides(artifact: SlidesArtifact): Promise<void> {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5 inches
  pptx.author = 'Von AI';
  pptx.subject = artifact.title;

  for (const slide of artifact.slides) {
    const pptSlide = pptx.addSlide();

    // White background
    pptSlide.background = { fill: 'FFFFFF' };

    // Title
    pptSlide.addText(stripInlineMarkdown(slide.title), {
      x: 0.8,
      y: 0.4,
      w: 11.5,
      h: 0.8,
      fontSize: 28,
      fontFace: 'Calibri',
      color: '1a1a2e',
      bold: true,
      valign: 'bottom',
    });

    // Thin line under title
    pptSlide.addShape(pptx.ShapeType.rect, {
      x: 0.8,
      y: 1.3,
      w: 11.5,
      h: 0.01,
      fill: { color: 'E5E7EB' },
      line: { color: 'E5E7EB', width: 0 },
    });

    // Convert markdown content to text items
    const contentLines = slide.content
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const textItems: PptxGenJS.TextProps[] = [];
    for (const line of contentLines) {
      if (line.startsWith('### ')) {
        textItems.push({
          text: stripInlineMarkdown(line.slice(4)),
          options: {
            fontSize: 16,
            fontFace: 'Calibri',
            color: '1a1a2e',
            bold: true,
            paraSpaceBefore: 14,
            paraSpaceAfter: 6,
          },
        });
      } else if (line.startsWith('## ')) {
        textItems.push({
          text: stripInlineMarkdown(line.slice(3)),
          options: {
            fontSize: 18,
            fontFace: 'Calibri',
            color: '1a1a2e',
            bold: true,
            paraSpaceBefore: 16,
            paraSpaceAfter: 8,
          },
        });
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        textItems.push({
          text: stripInlineMarkdown(line.slice(2)),
          options: {
            fontSize: 13,
            fontFace: 'Calibri',
            color: '374151',
            bullet: { type: 'bullet' },
            indentLevel: 0,
            paraSpaceBefore: 3,
            paraSpaceAfter: 3,
          },
        });
      } else if (/^\d+\.\s/.test(line)) {
        textItems.push({
          text: stripInlineMarkdown(line.replace(/^\d+\.\s/, '')),
          options: {
            fontSize: 13,
            fontFace: 'Calibri',
            color: '374151',
            bullet: { type: 'number' },
            indentLevel: 0,
            paraSpaceBefore: 3,
            paraSpaceAfter: 3,
          },
        });
      } else {
        textItems.push({
          text: stripInlineMarkdown(line),
          options: {
            fontSize: 13,
            fontFace: 'Calibri',
            color: '374151',
            paraSpaceBefore: 4,
            paraSpaceAfter: 4,
          },
        });
      }
    }

    if (textItems.length > 0) {
      pptSlide.addText(textItems, {
        x: 0.8,
        y: 1.5,
        w: 11.5,
        h: 5.3,
        valign: 'top',
        autoFit: true,
      });
    }

    // Speaker notes
    if (slide.notes) {
      pptSlide.addNotes(slide.notes);
    }
  }

  const filename = artifact.title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-');
  await pptx.writeFile({ fileName: `${filename}.pptx` });
}

/**
 * Generate and download an .xlsx file from a SpreadsheetArtifact
 */
export async function downloadSpreadsheet(artifact: SpreadsheetArtifact): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Von AI';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet(artifact.title.slice(0, 31)); // Excel sheet name max 31 chars

  // Add columns
  worksheet.columns = artifact.columns.map((col) => ({
    header: col.label,
    key: col.id,
    width: Math.max(col.label.length + 4, 15),
  }));

  // Style header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, size: 11, color: { argb: 'FF374151' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF9FAFB' },
  };
  headerRow.border = {
    bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
  };
  headerRow.height = 24;

  // Add data rows
  for (const row of artifact.rows) {
    const dataRow = worksheet.addRow(row);
    dataRow.font = { size: 11, color: { argb: 'FF111827' } };
    dataRow.border = {
      bottom: { style: 'hair', color: { argb: 'FFF3F4F6' } },
    };
  }

  // Auto-fit column widths based on data
  for (const col of worksheet.columns) {
    if (col.values) {
      let maxLen = col.header ? String(col.header).length : 10;
      col.values.forEach((val) => {
        if (val) {
          const len = String(val).length;
          if (len > maxLen) maxLen = len;
        }
      });
      col.width = Math.min(maxLen + 4, 40);
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const filename = artifact.title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-');
  saveAs(blob, `${filename}.xlsx`);
}
