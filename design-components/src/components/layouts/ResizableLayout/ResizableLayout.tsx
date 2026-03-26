import React, { createContext, useContext, useMemo, Children } from 'react';
import { usePanelResize } from './usePanelResize';
import type { PanelConstraint, UsePanelResizeReturn } from './usePanelResize';

// ============================================================================
// Context
// ============================================================================

interface ResizableLayoutContextValue extends UsePanelResizeReturn {
  direction: 'horizontal' | 'vertical';
  slotCount: number;
}

const ResizableLayoutContext = createContext<ResizableLayoutContextValue | null>(null);

function useResizableLayout() {
  const ctx = useContext(ResizableLayoutContext);
  if (!ctx)
    throw new Error('ResizableLayout compound components must be used within <ResizableLayout>');
  return ctx;
}

// ============================================================================
// Root
// ============================================================================

export interface ResizableLayoutProps {
  /**
   * Default ratios for each slot. Must sum to 1.
   * Length determines the number of expected slots.
   * @example [0.4, 0.6]
   */
  defaultRatios: number[];
  /**
   * Per-slot min/max constraints (array indices correspond to slot order).
   */
  constraints?: PanelConstraint[];
  /** Resize direction. @default 'horizontal' */
  direction?: 'horizontal' | 'vertical';
  /** localStorage key for persisting ratios. */
  storageKey?: string;
  /** Extra class names on the container div. */
  className?: string;
  /** Extra inline styles on the container div. */
  style?: React.CSSProperties;
  children: React.ReactNode;
}

/**
 * ResizableLayout — Declarative resizable split layout.
 *
 * Place `<ResizableLayout.Slot>` children inside to define each panel.
 * Resize handles are rendered automatically between slots.
 *
 * @example
 * ```tsx
 * <ResizableLayout
 *   defaultRatios={[0.4, 0.6]}
 *   constraints={[{ min: 0.4, max: 0.6 }, { min: 0.4, max: 0.6 }]}
 *   storageKey="chat-dashboard-split"
 *   className="h-full w-full"
 * >
 *   <ResizableLayout.Slot className="min-w-0">
 *     <ChatPanel />
 *   </ResizableLayout.Slot>
 *   <ResizableLayout.Slot className="min-w-0">
 *     <DashboardPanel />
 *   </ResizableLayout.Slot>
 * </ResizableLayout>
 * ```
 */
function ResizableLayoutRoot({
  defaultRatios,
  constraints,
  direction = 'horizontal',
  storageKey,
  className,
  style,
  children,
}: ResizableLayoutProps) {
  const resize = usePanelResize({
    defaultRatios,
    constraints,
    direction,
    storageKey,
  });

  // Count Slot children
  const slots = Children.toArray(children).filter(
    (child) => React.isValidElement(child) && (child.type as any).__resizableSlot
  );

  const ctx = useMemo<ResizableLayoutContextValue>(
    () => ({
      ...resize,
      direction,
      slotCount: slots.length,
    }),
    [resize, direction, slots.length]
  );

  const isHorizontal = direction === 'horizontal';
  const containerClass = [isHorizontal ? 'flex flex-row' : 'flex flex-col', className]
    .filter(Boolean)
    .join(' ');

  // Interleave Slot elements with resize handles
  const elements: React.ReactNode[] = [];
  let slotIndex = 0;

  Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;

    if ((child.type as any).__resizableSlot) {
      // Clone Slot with its index injected
      elements.push(
        React.cloneElement(child as React.ReactElement<any>, { __slotIndex: slotIndex })
      );

      // Insert handle between slots (not after the last one)
      if (slotIndex < slots.length - 1) {
        elements.push(<Handle key={`handle-${slotIndex}`} index={slotIndex} />);
      }
      slotIndex++;
    } else {
      // Pass through non-Slot children as-is
      elements.push(child);
    }
  });

  return (
    <ResizableLayoutContext.Provider value={ctx}>
      <div ref={resize.containerRef} className={containerClass} style={style}>
        {elements}
      </div>
    </ResizableLayoutContext.Provider>
  );
}

// ============================================================================
// Slot
// ============================================================================

export interface SlotProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  /** @internal Injected by ResizableLayoutRoot */
  __slotIndex?: number;
}

function Slot({ children, className, style, __slotIndex = 0 }: SlotProps) {
  const { ratios, direction } = useResizableLayout();
  const isHorizontal = direction === 'horizontal';
  const sizeProperty = isHorizontal ? 'width' : 'height';

  return (
    <div
      className={['flex-shrink-0', className].filter(Boolean).join(' ')}
      style={{
        [sizeProperty]: `${ratios[__slotIndex] * 100}%`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// Tag Slot so the Root can identify it among children
(Slot as any).__resizableSlot = true;

// ============================================================================
// Handle (auto-inserted between slots)
// ============================================================================

interface HandleInternalProps {
  index: number;
}

function Handle({ index }: HandleInternalProps) {
  const { getHandleProps, direction } = useResizableLayout();
  const isHorizontal = direction === 'horizontal';
  const props = getHandleProps(index);

  return (
    <div
      {...props}
      className={[
        'flex-shrink-0 flex items-center justify-center group transition-colors rounded',
        isHorizontal
          ? 'w-1.5 cursor-ew-resize hover:bg-blue-100 active:bg-blue-200'
          : 'h-1.5 cursor-ns-resize hover:bg-blue-100 active:bg-blue-200',
      ].join(' ')}
    >
      <div
        className={[
          'rounded-full transition-colors',
          isHorizontal
            ? 'w-0.5 h-8 bg-gray-300 group-hover:bg-blue-400 group-active:bg-blue-500'
            : 'h-0.5 w-8 bg-gray-300 group-hover:bg-blue-400 group-active:bg-blue-500',
        ].join(' ')}
      />
    </div>
  );
}

// ============================================================================
// Compound export
// ============================================================================

export const ResizableLayout = Object.assign(ResizableLayoutRoot, {
  Slot,
});
