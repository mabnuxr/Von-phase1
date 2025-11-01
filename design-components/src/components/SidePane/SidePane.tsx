import React, { useEffect, useRef, useState } from 'react';

export interface SidePaneProps {
  isOpen: boolean;
  onClose: () => void;
  title: string | React.ReactNode;
  width?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  /**
   * Enable horizontal resizing (defaults to true on desktop, false on mobile)
   */
  resizable?: boolean;
  /**
   * Minimum width for resizing (default: 400px)
   */
  minWidth?: number;
  /**
   * Maximum width for resizing (default: 90vw)
   */
  maxWidth?: string;
  /**
   * LocalStorage key for persisting width (default: 'sidepane-width')
   */
  storageKey?: string;
}

export const SidePane: React.FC<SidePaneProps> = ({
  isOpen,
  onClose,
  title,
  width = '480px',
  children,
  footer,
  className = '',
  resizable = true,
  minWidth = 400,
  maxWidth = '90vw',
  storageKey = 'sidepane-width',
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(0);

  // Load saved width from localStorage on mount
  const [currentWidth, setCurrentWidth] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(storageKey);
      return saved || width;
    }
    return width;
  });

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Save width to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && currentWidth !== width) {
      localStorage.setItem(storageKey, currentWidth);
    }
  }, [currentWidth, storageKey, width]);

  // Handle drag start
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!resizable || isMobile) return;

    e.preventDefault();
    setIsDragging(true);
    dragStartX.current = e.clientX;

    // Get current panel width in pixels
    const currentWidthPx = panelRef.current?.offsetWidth || parseInt(currentWidth);
    dragStartWidth.current = currentWidthPx;
  };

  // Handle drag move
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Calculate delta (negative because we're dragging from right edge)
      const deltaX = dragStartX.current - e.clientX;
      const newWidthPx = dragStartWidth.current + deltaX;

      // Calculate max width in pixels
      const maxWidthPx = maxWidth === '90vw' ? window.innerWidth * 0.9 : parseInt(maxWidth);

      // Enforce constraints
      const constrainedWidth = Math.max(minWidth, Math.min(newWidthPx, maxWidthPx));
      setCurrentWidth(`${constrainedWidth}px`);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, minWidth, maxWidth]);

  // Determine if resize should be enabled
  const enableResize = resizable && !isMobile;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/20 transition-opacity duration-300 z-40 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Side Panel */}
      <div
        ref={panelRef}
        className={`fixed right-0 top-0 h-full bg-white shadow-xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } ${className} ${isDragging ? 'select-none' : ''}`}
        style={{
          width: currentWidth,
          maxWidth: maxWidth,
          minWidth: enableResize ? `${minWidth}px` : undefined,
        }}
      >
        {/* Resize handle - only visible on desktop when resizable */}
        {enableResize && (
          <div
            className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-purple-600 transition-colors group z-10"
            onMouseDown={handleMouseDown}
          >
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-12 bg-gray-300 group-hover:bg-purple-600 transition-colors rounded-r" />
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex-1">
            {typeof title === 'string' ? (
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            ) : (
              title
            )}
          </div>
          <button
            onClick={onClose}
            className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>

        {/* Footer (optional) */}
        {footer && <div className="border-t border-gray-200 px-6 py-4">{footer}</div>}
      </div>
    </>
  );
};
