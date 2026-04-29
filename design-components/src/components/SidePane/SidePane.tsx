import React, { useEffect, useRef, useState } from 'react';
import { XIcon } from '@phosphor-icons/react';

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
      // Validate saved value before using it
      if (saved && saved.trim() !== '' && !saved.includes('NaN')) {
        return saved;
      }
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
      // Only save valid width values
      if (currentWidth && !currentWidth.includes('NaN') && !currentWidth.includes('Infinity')) {
        try {
          localStorage.setItem(storageKey, currentWidth);
        } catch (error) {
          console.warn('Failed to save SidePane width to localStorage:', error);
        }
      }
    }
  }, [currentWidth, storageKey, width]);

  // Handle drag start
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!resizable || isMobile) return;

    e.preventDefault();
    setIsDragging(true);
    dragStartX.current = e.clientX;

    // Get current panel width in pixels - safely parse
    let currentWidthPx = panelRef.current?.offsetWidth;
    if (!currentWidthPx) {
      // Fallback: extract numeric value from currentWidth string
      const numericValue = parseInt(currentWidth.replace(/[^0-9]/g, ''), 10);
      currentWidthPx = isNaN(numericValue) ? minWidth : numericValue;
    }
    dragStartWidth.current = currentWidthPx;
  };

  // Handle drag move
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Calculate delta (negative because we're dragging from right edge)
      const deltaX = dragStartX.current - e.clientX;
      const newWidthPx = dragStartWidth.current + deltaX;

      // Calculate max width in pixels - safely parse
      let maxWidthPx: number;
      if (maxWidth === '90vw') {
        maxWidthPx = window.innerWidth * 0.9;
      } else {
        // Extract numeric value safely
        const numericValue = parseInt(maxWidth.replace(/[^0-9]/g, ''), 10);
        maxWidthPx = isNaN(numericValue) ? window.innerWidth * 0.9 : numericValue;
      }

      // Enforce constraints and ensure valid number
      const constrainedWidth = Math.max(minWidth, Math.min(newWidthPx, maxWidthPx));

      // Only update if we have a valid number
      if (!isNaN(constrainedWidth) && isFinite(constrainedWidth)) {
        setCurrentWidth(`${Math.round(constrainedWidth)}px`);
      }
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

      {/* Side Panel Wrapper */}
      <div
        ref={panelRef}
        className={`fixed top-0 right-0 h-full pr-2 py-2 z-50 transform transition-transform duration-300 ease-in-out ${
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
            className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-indigo-600 transition-colors group z-10"
            onMouseDown={handleMouseDown}
          >
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-12 bg-gray-300 group-hover:bg-indigo-600 transition-colors rounded-r" />
          </div>
        )}

        {/* Inner Container */}
        <div className="h-full flex flex-col bg-white rounded-xl border border-gray-200 shadow-xs">
          {/* Header */}
          <div className="px-5 py-3 border-b border-gray-200 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                {typeof title === 'string' ? (
                  <h2 className="text-lg font-semibold text-gray-900 m-0">{title}</h2>
                ) : (
                  title
                )}
              </div>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <XIcon size={20} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>

          {/* Footer (optional) */}
          {footer && <div className="px-6 py-4 border-t border-gray-200 shrink-0">{footer}</div>}
        </div>
      </div>
    </>
  );
};
