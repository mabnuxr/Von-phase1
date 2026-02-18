/**
 * DocxViewer — Renders DOCX files using docx-preview
 *
 * Takes a raw ArrayBuffer and renders it into a container via renderAsync.
 * Preserves styles, tables, images, and page layout better than mammoth.
 *
 * Style overrides are injected AFTER renderAsync because the library
 * clears bodyContainer.innerHTML before rendering — any styles injected
 * beforehand get destroyed.
 */

import React, { useRef, useEffect } from 'react';

interface DocxViewerProps {
  buffer: ArrayBuffer;
}

// Overrides for docx-preview's generated wrapper + section styles.
// The wrapper class is `${className}-wrapper` = "docx-preview-wrapper".
const DOCX_STYLE_OVERRIDES = `
  .docx-preview-wrapper {
    background: rgba(249, 250, 251, 0.8) !important;
    padding: 16px !important;
  }
  .docx-preview-wrapper > section.docx-preview {
    width: 100% !important;
    min-width: 0 !important;
    max-width: 100% !important;
    padding: 24px !important;
    margin: 0 0 16px !important;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05) !important;
    border: 1px solid #e5e7eb !important;
    border-radius: 2px !important;
    box-sizing: border-box !important;
    overflow: hidden !important;
    overflow-wrap: break-word;
    word-wrap: break-word;
  }
  .docx-preview-wrapper > section.docx-preview:last-child {
    margin-bottom: 0 !important;
  }
  .docx-preview-wrapper table {
    width: 100% !important;
    max-width: 100% !important;
    table-layout: fixed;
  }
  .docx-preview-wrapper table col {
    width: auto !important;
  }
  .docx-preview-wrapper img {
    max-width: 100% !important;
    height: auto !important;
  }
`;

export const DocxViewer: React.FC<DocxViewerProps> = ({ buffer }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    container.innerHTML = '';
    let cancelled = false;

    import('docx-preview').then(({ renderAsync }) => {
      if (cancelled) return;
      renderAsync(buffer, container, undefined, {
        className: 'docx-preview',
        inWrapper: true,
        ignoreWidth: true,
        ignoreHeight: true,
        ignoreFonts: false,
        breakPages: false,
        trimXmlDeclaration: true,
        debug: false,
      }).then(() => {
        if (cancelled) return;
        // Inject AFTER render — renderAsync clears innerHTML before rendering
        const styleEl = document.createElement('style');
        styleEl.textContent = DOCX_STYLE_OVERRIDES;
        container.appendChild(styleEl);
      });
    });

    return () => {
      cancelled = true;
    };
  }, [buffer]);

  return <div ref={containerRef} className="flex-1 overflow-auto settings-scrollbar" />;
};
