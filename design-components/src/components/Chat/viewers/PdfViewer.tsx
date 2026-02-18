/**
 * PdfViewer — Renders PDF pages as canvas via react-pdf (PDF.js)
 *
 * Replaces native browser iframe to provide consistent cross-browser
 * rendering without the browser's built-in toolbar (print, download, etc).
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Worker must be configured in the same module that uses <Document>/<Page>
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  url: string;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({ url }) => {
  const [numPages, setNumPages] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Track container width so pages fill the available space
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      if (width > 0) setContainerWidth(width);
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const onLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  }, []);

  // Subtract padding (24px each side) so pages don't touch the edges
  const pageWidth = containerWidth > 0 ? containerWidth - 48 : undefined;

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto bg-gray-50/80 py-4 settings-scrollbar"
    >
      <Document
        file={url}
        onLoadSuccess={onLoadSuccess}
        loading={null}
        error={
          <div className="flex items-center justify-center h-32 text-sm text-gray-500">
            Failed to load PDF
          </div>
        }
      >
        {pageWidth &&
          Array.from({ length: numPages }, (_, i) => (
            <div
              key={i}
              className="mx-auto mb-4 last:mb-0 shadow-sm border border-gray-200 rounded-sm"
              style={{ width: 'fit-content' }}
            >
              <Page
                pageNumber={i + 1}
                width={pageWidth}
                renderTextLayer={true}
                renderAnnotationLayer={true}
              />
            </div>
          ))}
      </Document>
    </div>
  );
};
