import { Marked } from 'marked';
import DOMPurify from 'dompurify';
import { escapeHtml } from '../ReportTable/reportTableUtils';

const markedInstance = new Marked({
  breaks: true,
  gfm: true,
});

markedInstance.use({
  renderer: {
    html({ text }: { text: string }) {
      return escapeHtml(text);
    },
  },
});

const FORBID_TAGS = [
  'script',
  'style',
  'iframe',
  'frame',
  'frameset',
  'form',
  'input',
  'button',
  'select',
  'textarea',
  'object',
  'embed',
  'base',
  'link',
  'meta',
];

// Scoped DOMPurify instance — adding hooks to the default export mutates a
// module-level singleton shared with emailUtils, EmailComposer, and
// useArtifactContent, which would silently rewrite their <a> tags.
const purify = DOMPurify(window);
purify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A') {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

// Backend sometimes serializes markdown through JSON twice; decode the common
// escapes so line breaks and quotes render correctly.
function unescapeJsonStringLiterals(s: string): string {
  return s.replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t');
}

export function renderMarkdownToSafeHtml(content: string): string {
  if (!content) return '';

  const normalizedContent =
    content.includes('\\n') || content.includes('\\t') || content.includes('\\"')
      ? unescapeJsonStringLiterals(content)
      : content;

  try {
    const raw = markedInstance.parse(normalizedContent) as string;
    return purify.sanitize(raw, { FORBID_TAGS }) as string;
  } catch {
    const escaped = escapeHtml(normalizedContent).replace(/\n/g, '<br>');
    return purify.sanitize(`<p>${escaped}</p>`, { FORBID_TAGS }) as string;
  }
}
