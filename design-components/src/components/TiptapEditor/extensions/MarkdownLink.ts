import Link from '@tiptap/extension-link';

interface MarkAttrs {
  href: string;
  title?: string;
}

interface Mark {
  attrs: MarkAttrs;
}

/**
 * MarkdownLink - Custom Link extension with proper markdown serialization
 *
 * Extends the default Link extension to always serialize links as [text](url)
 * instead of using the autolink format <url> for plain URLs.
 *
 * This ensures consistent markdown output that can be properly parsed by backends.
 */
export const MarkdownLink = Link.extend({
  addStorage() {
    return {
      markdown: {
        serialize: {
          open() {
            return '[';
          },
          close(_state: unknown, mark: Mark) {
            const href = mark.attrs.href || '';
            const title = mark.attrs.title;
            // Escape parentheses and quotes in URL for markdown compatibility
            const escapedHref = href.replace(/[()]/g, '\\$&').replace(/"/g, '\\"');
            const titlePart = title ? ` "${title.replace(/"/g, '\\"')}"` : '';
            return `](${escapedHref}${titlePart})`;
          },
          mixable: true,
        },
        parse: {
          // Parsing is handled by markdown-it via tiptap-markdown
        },
      },
    };
  },
});
