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
 *
 * Note: We always run content through marked because:
 * 1. marked passes HTML through untouched, so legacy HTML content still works
 * 2. Trying to detect HTML with regex causes false positives (e.g. markdown autolinks
 *    like <https://example.com> get misclassified and stripped by DOMPurify)
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

    // Run through marked - it handles both markdown and HTML content
    // (HTML passes through untouched, markdown gets converted)
    let rawHtml: string;
    try {
      rawHtml = markedInstance.parse(normalizedContent) as string;
    } catch {
      // Fallback: wrap plain text in paragraph
      rawHtml = `<p>${normalizedContent.replace(/\n/g, '<br>')}</p>`;
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
