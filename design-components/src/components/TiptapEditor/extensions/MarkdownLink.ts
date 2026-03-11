import Link from '@tiptap/extension-link';
import { Plugin, PluginKey } from '@tiptap/pm/state';

interface MarkAttrs {
  href: string;
  title?: string;
}

interface Mark {
  attrs: MarkAttrs;
}

const linkBleedPluginKey = new PluginKey('linkBleedPrevention');

/**
 * MarkdownLink - Custom Link extension with proper markdown serialization
 *
 * Extends the default Link extension to always serialize links as [text](url)
 * instead of using the autolink format <url> for plain URLs.
 *
 * This ensures consistent markdown output that can be properly parsed by backends.
 */
export const MarkdownLink = Link.extend({
  // Ensure the link mark does not extend into newly typed text
  inclusive() {
    return false;
  },

  addProseMirrorPlugins() {
    const parentPlugins = this.parent?.() ?? [];
    const linkType = this.editor.schema.marks.link;

    return [
      ...parentPlugins,
      new Plugin({
        key: linkBleedPluginKey,
        // After every transaction that changes the doc, check whether the link
        // mark has bled into text that is clearly not part of the URL.
        appendTransaction(_transactions, oldState, newState) {
          if (oldState.doc.eq(newState.doc)) return null;

          const { $from, empty } = newState.selection;
          if (!empty || !$from.parent.isTextblock) return null;

          // Check if cursor sits inside a link mark
          const linkMark = $from.marks().find((m) => m.type === linkType);
          if (!linkMark) return null;

          const href = linkMark.attrs.href;
          if (!href) return null;

          // Find the contiguous range of this link mark in the parent node
          const parent = $from.parent;
          const parentStart = $from.start(); // absolute pos of parent content start
          let linkFrom = -1;
          let linkTo = -1;

          parent.forEach((node, offset) => {
            if (node.isText) {
              const hasThisLink = node.marks.some(
                (m) => m.type === linkType && m.attrs.href === href
              );
              if (hasThisLink) {
                if (linkFrom === -1) linkFrom = offset;
                linkTo = offset + node.nodeSize;
              }
            }
          });

          if (linkFrom === -1 || linkTo === -1) return null;

          const linkText = parent.textBetween(linkFrom, linkTo, '');

          // For autolinks the visible text matches the href. If the text has
          // grown beyond the href it means the user typed extra characters that
          // should not be part of the link.
          if (linkText.length > href.length && linkText.startsWith(href)) {
            const extra = linkText.substring(href.length);
            // Only strip when the extra clearly is not a URL continuation:
            // whitespace, closing parens/brackets, commas, semicolons
            if (/^[\s)\]>,;]/.test(extra)) {
              const tr = newState.tr;
              tr.removeMark(parentStart + linkFrom + href.length, parentStart + linkTo, linkType);
              return tr;
            }
          }

          return null;
        },
      }),
    ];
  },

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
