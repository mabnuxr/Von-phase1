import { renderMarkdownToSafeHtml } from '../TiptapEditor';
import type { ExpandPopoverState } from './LongTextPopover';

// Render markdown headings as styled <div>s instead of real <h*> tags —
// <h*> inside <td> pollutes the document outline for screen readers.
// Visual hierarchy is preserved via .md-h1..md-h6 in TiptapEditor.css.
// Safe to do with regex: input is already DOMPurify-sanitized HTML.
export function demoteHeadings(html: string): string {
  return html
    .replace(/<h([1-6])(\s[^>]*)?>/gi, (_match, level, attrs = '') => {
      const extra = attrs ? attrs : '';
      return `<div class="md-h${level}"${extra}>`;
    })
    .replace(/<\/h([1-6])>/gi, '</div>');
}

const EMPTY_PLACEHOLDER = '<span style="color:#9ca3af">—</span>';

// Grid Lite re-runs the formatter for every cell on every grid render; cache
// rendered output by raw value so we don't re-parse markdown each time.
const renderCache = new Map<string, string>();
const CACHE_LIMIT = 2000;

// `this.value` is bound by Grid Lite to the cell's raw value. The original
// markdown source is recovered for the expand popover from the <td>'s
// `data-value` attribute, which Grid Lite sets automatically.
export function markdownCellFormatter(this: { value: unknown }): string {
  const value = this.value;
  if (value == null || value === '') return EMPTY_PLACEHOLDER;
  if (typeof value !== 'string') return String(value);

  const cached = renderCache.get(value);
  if (cached !== undefined) return cached;

  const safeHtml = renderMarkdownToSafeHtml(value);
  const demoted = demoteHeadings(safeHtml);
  const html =
    '<div class="dt-markdown-wrap">' +
    '<div class="tiptap-viewer tiptap-viewer-cell dt-markdown-content">' +
    demoted +
    '</div>' +
    '<button type="button" class="dt-expand-btn" aria-label="Expand cell content"></button>' +
    '</div>';

  if (renderCache.size >= CACHE_LIMIT) renderCache.clear();
  renderCache.set(value, html);
  return html;
}

// Toggles `.is-truncated` based on actual overflow so the expand button only
// appears (via CSS) when content is clipped.
export function handleMarkdownCellHover(e: React.MouseEvent | MouseEvent): void {
  const td = (e.target as HTMLElement).closest('td');
  if (!td) return;
  const wrap = td.querySelector('.dt-markdown-wrap') as HTMLElement | null;
  if (!wrap) return;
  const content = wrap.querySelector('.dt-markdown-content') as HTMLElement | null;
  if (!content) return;
  const overflowing = content.scrollHeight > content.clientHeight + 1;
  if (overflowing === wrap.classList.contains('is-truncated')) return;
  wrap.classList.toggle('is-truncated', overflowing);
}

// Click handler for the expand button rendered by markdownCellFormatter.
// Recovers the raw markdown source from Grid Lite's auto-set data-value attr
// on the <td> and hands the popover anchor rect to the caller's setPopover.
export function createMarkdownCellClickHandler(
  setPopover: (state: ExpandPopoverState) => void
) {
  return (e: React.MouseEvent | MouseEvent) => {
    const btn = (e.target as HTMLElement).closest('.dt-expand-btn') as HTMLElement | null;
    if (!btn) return;
    e.stopPropagation();
    const td = btn.closest('td') as HTMLTableCellElement | null;
    if (!td) return;
    const source = td.dataset.value ?? td.textContent ?? '';
    if (source) setPopover({ text: source, rect: td.getBoundingClientRect() });
  };
}
