import React, { useMemo } from 'react';
import { Marked } from 'marked';
import DOMPurify from 'dompurify';

export interface TiptapViewerProps {
  /** Content to display (markdown or HTML from TiptapEditor) */
  content: string;
  /** Additional className for the wrapper */
  className?: string;
}

// Create a marked instance with our configuration (avoids global state mutation)
const markedInstance = new Marked({
  breaks: true, // Convert \n to <br>
  gfm: true, // GitHub Flavored Markdown
});

/**
 * TiptapViewer - A read-only viewer for content created with TiptapEditor
 *
 * Renders markdown or HTML content with the same styling as the editor.
 * Used for displaying user messages that were composed with TiptapEditor.
 */
export const TiptapViewer: React.FC<TiptapViewerProps> = ({ content, className = '' }) => {
  const htmlContent = useMemo(() => {
    if (!content) return '';

    // Check if content is already HTML (has HTML tags)
    const isHtml = /<[a-z][\s\S]*>/i.test(content);

    let rawHtml: string;

    if (isHtml) {
      // Already HTML, use as-is (will be sanitized below)
      rawHtml = content;
    } else {
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

      // Content is markdown or plain text - convert to HTML
      try {
        rawHtml = markedInstance.parse(normalizedContent) as string;
      } catch {
        // Fallback: wrap plain text in paragraph
        rawHtml = `<p>${normalizedContent.replace(/\n/g, '<br>')}</p>`;
      }
    }

    // Sanitize HTML to prevent XSS attacks
    return DOMPurify.sanitize(rawHtml);
  }, [content]);

  return (
    <div
      className={`tiptap-viewer ${className}`}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};

export default TiptapViewer;
