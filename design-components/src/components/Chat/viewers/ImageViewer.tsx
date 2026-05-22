/**
 * ImageViewer — Inline preview for image artifacts (PNG, JPG, JPEG, GIF, WEBP, SVG)
 *
 * SVG is rendered via <img> rather than inlined so embedded <script> tags
 * cannot execute. Browsers that don't natively render TIFF/BMP fall back to
 * a broken-image state — caller should provide a download fallback.
 *
 * Interactions:
 *  - Mouse wheel: zoom in/out (anchored at cursor)
 *  - Drag: pan when zoomed beyond fit
 *  - Toolbar (+/-/reset/fit) overlays top-right
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
  ArrowsOutIcon,
  ArrowCounterClockwiseIcon,
} from '@phosphor-icons/react';

interface ImageViewerProps {
  url: string;
  fileName?: string;
}

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 10;
const ZOOM_STEP = 1.25;

export const ImageViewer: React.FC<ImageViewerProps> = ({ url, fileName }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOriginRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  const clamp = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));

  const reset = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Reset transform whenever the image source changes
  useEffect(() => {
    reset();
  }, [url, reset]);

  // Zoom buttons — adjust pan so the image center stays put
  const zoomBy = useCallback((factor: number) => {
    setZoom((prev) => {
      const next = clamp(prev * factor);
      // Center-anchored: pan scales with zoom so the center stays in view
      setPan((p) => ({ x: (p.x * next) / prev, y: (p.y * next) / prev }));
      return next;
    });
  }, []);

  // Wheel zoom — anchored at cursor so the point under the cursor stays put
  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (!e.ctrlKey && !e.metaKey && Math.abs(e.deltaY) < 1) return;
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const cursorX = e.clientX - rect.left - rect.width / 2;
    const cursorY = e.clientY - rect.top - rect.height / 2;

    setZoom((prev) => {
      const factor = e.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP;
      const next = clamp(prev * factor);
      const ratio = next / prev;
      setPan((p) => ({
        x: cursorX - (cursorX - p.x) * ratio,
        y: cursorY - (cursorY - p.y) * ratio,
      }));
      return next;
    });
  }, []);

  // Drag pan — only active when zoomed in (cursor switches to grab/grabbing)
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (zoom <= 1) return;
      e.preventDefault();
      dragOriginRef.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
      setIsDragging(true);
    },
    [zoom, pan.x, pan.y]
  );

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e: MouseEvent) => {
      const origin = dragOriginRef.current;
      if (!origin) return;
      setPan({
        x: origin.panX + (e.clientX - origin.x),
        y: origin.panY + (e.clientY - origin.y),
      });
    };
    const handleUp = () => {
      setIsDragging(false);
      dragOriginRef.current = null;
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isDragging]);

  const cursor = zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default';

  return (
    <div className="flex-1 min-h-0 relative bg-gray-50 overflow-hidden">
      {/* Image stage */}
      <div
        ref={containerRef}
        className="absolute inset-0 flex items-center justify-center overflow-hidden select-none"
        style={{ cursor }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
      >
        <img
          src={url}
          alt={fileName ?? 'Image artifact'}
          draggable={false}
          className="max-w-full max-h-full object-contain transition-transform"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transitionDuration: isDragging ? '0ms' : '120ms',
          }}
        />
      </div>

      {/* Toolbar */}
      <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/95 border border-gray-200 rounded-lg shadow-sm px-1 py-1">
        <ZoomButton onClick={() => zoomBy(1 / ZOOM_STEP)} title="Zoom out" disabled={zoom <= MIN_ZOOM}>
          <MagnifyingGlassMinusIcon size={16} weight="regular" />
        </ZoomButton>
        <span className="text-xs text-gray-600 font-medium tabular-nums w-12 text-center">
          {Math.round(zoom * 100)}%
        </span>
        <ZoomButton onClick={() => zoomBy(ZOOM_STEP)} title="Zoom in" disabled={zoom >= MAX_ZOOM}>
          <MagnifyingGlassPlusIcon size={16} weight="regular" />
        </ZoomButton>
        <div className="w-px h-4 bg-gray-200 mx-1" />
        <ZoomButton onClick={reset} title="Fit to screen">
          <ArrowsOutIcon size={16} weight="regular" />
        </ZoomButton>
        <ZoomButton onClick={reset} title="Reset" disabled={zoom === 1 && pan.x === 0 && pan.y === 0}>
          <ArrowCounterClockwiseIcon size={16} weight="regular" />
        </ZoomButton>
      </div>
    </div>
  );
};

interface ZoomButtonProps {
  onClick: () => void;
  title: string;
  disabled?: boolean;
  children: React.ReactNode;
}

const ZoomButton: React.FC<ZoomButtonProps> = ({ onClick, title, disabled, children }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    disabled={disabled}
    className="w-7 h-7 flex items-center justify-center rounded text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
  >
    {children}
  </button>
);
