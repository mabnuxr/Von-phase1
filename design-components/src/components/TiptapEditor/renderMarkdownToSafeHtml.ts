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

// Single-line strings that look like an unordered-list marker (`-`, `*`, `+`)
// or empty ordered-list marker (`1.`) — in tabular data these are placeholder
// values, not list intent. Marked + GFM would otherwise emit `<ul><li></li></ul>`.
const BARE_LIST_MARKER = /^[\s]*[-*+](\s*$)|^[\s]*\d+\.\s*$/;

// Characters allowed in a URL per RFC 3986 (unreserved + reserved + `%`).
// Anything outside this set must be percent-encoded for `marked` to recognize
// the link target. Existing `%xx` escapes pass through unchanged because `%`
// itself is in the allowed set.
const URL_ALLOWED_CHAR = /[A-Za-z0-9\-._~:/?#[\]@!$&'()*+,;=%]/;

function encodeUrlUnsafeChars(url: string): string {
  let out = '';
  for (const ch of url) {
    out += URL_ALLOWED_CHAR.test(ch) ? ch : encodeURIComponent(ch);
  }
  return out;
}

// Match inline markdown link / image destinations: `[text](url)` or
// `![alt](url)`. Skip URLs already wrapped in angle brackets — CommonMark
// permits spaces there and `marked` parses them correctly.
const INLINE_LINK_DEST = /(!?\[[^\]]*\]\()(?!<)([^)\s][^)]*)(\))/g;

// Trailing `"..."` or `'...'` title segment within a link destination.
const LINK_TITLE_SUFFIX = /(\s+)(("[^"]*")|('[^']*'))$/;

function encodeMarkdownLinkUrls(markdown: string): string {
  return markdown.replace(INLINE_LINK_DEST, (_match, open, inner, close) => {
    const titleMatch = inner.match(LINK_TITLE_SUFFIX);
    if (titleMatch) {
      const url = inner.slice(0, inner.length - titleMatch[0].length);
      return `${open}${encodeUrlUnsafeChars(url)}${titleMatch[0]}${close}`;
    }
    return `${open}${encodeUrlUnsafeChars(inner)}${close}`;
  });
}

/** Sanitize an HTML string with the same DOMPurify config used for markdown
 *  output (forbid tags, force `target="_blank" rel="noopener"` on links).
 *  Use this when the input is already HTML and shouldn't be parsed as
 *  markdown — e.g. backend cells that bake `<a href="...">name</a>` into
 *  the value, where running through marked would escape the tags. */
export function sanitizeHtml(content: string): string {
  return purify.sanitize(content, { FORBID_TAGS }) as string;
}

export function renderMarkdownToSafeHtml(content: string): string {
  if (!content) return '';

  const normalizedContent = encodeMarkdownLinkUrls(
    content.includes('\\n') || content.includes('\\t') || content.includes('\\"')
      ? unescapeJsonStringLiterals(content)
      : content
  );

  // Short-circuit values that consist of only a list marker — render as
  // escaped plain text so a single "-" stays a literal dash, not a bullet.
  if (!normalizedContent.includes('\n') && BARE_LIST_MARKER.test(normalizedContent)) {
    return purify.sanitize(`<p>${escapeHtml(normalizedContent)}</p>`, {
      FORBID_TAGS,
    }) as string;
  }

  try {
    const raw = markedInstance.parse(normalizedContent) as string;
    return purify.sanitize(raw, { FORBID_TAGS }) as string;
  } catch {
    const escaped = escapeHtml(normalizedContent).replace(/\n/g, '<br>');
    return purify.sanitize(`<p>${escaped}</p>`, { FORBID_TAGS }) as string;
  }
}
