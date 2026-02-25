import { useState, useRef, useCallback } from 'react';

export interface UseFileDropOptions {
  /** Called with the dropped files when a valid drop occurs */
  onDrop: (files: File[]) => void;
  /** When true, drag events are ignored entirely */
  disabled?: boolean;
}

export interface UseFileDropReturn {
  /** True while a file is being dragged over the drop zone */
  isDragOver: boolean;
  /** Spread these onto the element you want to act as the drop zone */
  dragHandlers: {
    onDragEnter: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
  };
}

/**
 * Encapsulates file drag-and-drop state for a single drop zone.
 *
 * Uses an enter-counter ref to prevent the overlay from flickering when
 * the cursor moves over child elements (which fire their own enter/leave
 * events against the parent).
 *
 * Usage:
 * ```tsx
 * const { isDragOver, dragHandlers } = useFileDrop({ onDrop: handleFiles });
 * <div {...dragHandlers} className="relative">
 *   {isDragOver && <DropOverlay />}
 *   {children}
 * </div>
 * ```
 */
export function useFileDrop({ onDrop, disabled = false }: UseFileDropOptions): UseFileDropReturn {
  const [isDragOver, setIsDragOver] = useState(false);
  // Tracks the net enter-depth so a single leave from a child doesn't hide the overlay
  const dragCounterRef = useRef(0);

  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (disabled || !e.dataTransfer.types.includes('Files')) return;
      dragCounterRef.current += 1;
      if (dragCounterRef.current === 1) setIsDragOver(true);
    },
    [disabled]
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (disabled) return;
      dragCounterRef.current -= 1;
      if (dragCounterRef.current === 0) setIsDragOver(false);
    },
    [disabled]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (disabled) return;
      e.dataTransfer.dropEffect = 'copy';
    },
    [disabled]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      dragCounterRef.current = 0;
      setIsDragOver(false);
      if (disabled) return;
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) onDrop(files);
    },
    [disabled, onDrop]
  );

  return {
    isDragOver,
    dragHandlers: {
      onDragEnter: handleDragEnter,
      onDragLeave: handleDragLeave,
      onDragOver: handleDragOver,
      onDrop: handleDrop,
    },
  };
}
