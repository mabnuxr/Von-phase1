/**
 * DocxViewer — Renders DOCX files using docx-preview
 *
 * Takes a raw ArrayBuffer and renders it into a container via renderAsync.
 * Preserves styles, tables, images, and page layout better than mammoth.
 */

import React, { useRef, useEffect } from 'react';

interface DocxViewerProps {
  buffer: ArrayBuffer;
}

// CSS overrides to constrain docx-preview output to container width
const DOCX_STYLE_OVERRIDES = `
  .docx-preview-wrapper {
    background: transparent !important;
    padding: 0 !important;
  }
  .docx-preview-wrapper > section.docx-preview {
    width: 100% !important;
    min-width: 0 !important;
    max-width: 100% !important;
    padding: 24px !important;
    margin: 0 !important;
    box-shadow: none !important;
    box-sizing: border-box !important;
    overflow-wrap: break-word;
    word-wrap: break-word;
  }
  .docx-preview-wrapper table {
    width: 100% !important;
    max-width: 100% !important;
    table-layout: fixed;
  }
  .docx-preview-wrapper table col {
    width: auto !important;
  }
`;

export const DocxViewer: React.FC<DocxViewerProps> = ({ buffer }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = '';

    // Inject style overrides
    const styleEl = document.createElement('style');
    styleEl.textContent = DOCX_STYLE_OVERRIDES;
    container.appendChild(styleEl);

    import('docx-preview').then(({ renderAsync }) => {
      renderAsync(buffer, container, undefined, {
        className: 'docx-preview',
        inWrapper: true,
        ignoreWidth: true,
        ignoreHeight: true,
        ignoreFonts: false,
        breakPages: false,
        trimXmlDeclaration: true,
        debug: false,
      });
    });
  }, [buffer]);

  return <div ref={containerRef} className="flex-1 overflow-auto bg-white settings-scrollbar" />;
};
