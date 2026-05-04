import React, { useMemo } from 'react';
import { renderMarkdownToSafeHtml } from './renderMarkdownToSafeHtml';

export interface TiptapViewerProps {
  /** Content to display (markdown from TiptapEditor) */
  content: string;
  /** Additional className for the wrapper */
  className?: string;
}

/**
 * TiptapViewer - A read-only viewer for content created with TiptapEditor
 *
 * Renders markdown content with the same styling as the editor.
 * Used for displaying user messages that were composed with TiptapEditor.
 */
export const TiptapViewer: React.FC<TiptapViewerProps> = ({ content, className = '' }) => {
  const htmlContent = useMemo(() => renderMarkdownToSafeHtml(content), [content]);

  return (
    <div
      className={`tiptap-viewer ${className}`}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};

export default TiptapViewer;
