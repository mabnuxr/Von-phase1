import React, { useMemo } from 'react';
import { Marked } from 'marked';
import DOMPurify from 'dompurify';

export interface TiptapViewerProps {
  /** Content to display (markdown from TiptapEditor) */
  content: string;
  /** Additional className for the wrapper */
  className?: string;
}

// Escape helper — converts HTML special chars to entities
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Create a marked instance with our configuration (avoids global state mutation).
// The html renderer is overridden to escape raw HTML tags instead of passing them
// through — this prevents user-typed HTML (e.g. <h1>, <script>, <form>) from
// being rendered as actual DOM elements.
const markedInstance = new Marked({
  breaks: true, // Convert \n to <br>
  gfm: true, // GitHub Flavored Markdown
});

markedInstance.use({
  renderer: {
    html({ text }: { text: string }) {
      return escapeHtml(text);
    },
  },
});

/**
 * TiptapViewer - A read-only viewer for content created with TiptapEditor
 *
 * Renders markdown content with the same styling as the editor.
 * Used for displaying user messages that were composed with TiptapEditor.
 */
export const TiptapViewer: React.FC<TiptapViewerProps> = ({ content, className = '' }) => {
  const htmlContent = useMemo(() => {
    if (!content) return '';

    // If content appears to be JSON-escaped (has literal \n sequences),
    // try to parse it as a JSON string to unescape it properly
    let normalizedContent = content;
    if (content.includes('\\n') || content.includes('\\t') || content.includes('\\"')) {
      try {
        // Wrap in quotes and parse to unescape JSON escape sequences
        // First escape any existing quotes, then wrap
        const escaped = content.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        normalizedContent = JSON.parse(`"${escaped}"`);
      } catch {
        // If parsing fails, try a simpler approach - just replace literal sequences
        normalizedContent = content
          .replace(/\\n/g, '\n')
          .replace(/\\t/g, '\t')
          .replace(/\\"/g, '"');
      }
    }

    // Run through marked to convert markdown to HTML, then sanitize to prevent XSS.
    // DOMPurify strips scripts, event handlers, form elements, and other dangerous tags
    // while preserving safe markdown-rendered HTML (headings, links, code, tables, etc.).
    const forbidTags = [
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
    try {
      const raw = markedInstance.parse(normalizedContent) as string;
      return DOMPurify.sanitize(raw, { FORBID_TAGS: forbidTags }) as string;
    } catch {
      // Fallback: escape plain text before wrapping in a paragraph tag
      const escaped = normalizedContent
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
        .replace(/\n/g, '<br>');
      return DOMPurify.sanitize(`<p>${escaped}</p>`, { FORBID_TAGS: forbidTags }) as string;
    }
  }, [content]);

  return (
    <div
      className={`tiptap-viewer ${className}`}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};

export default TiptapViewer;
