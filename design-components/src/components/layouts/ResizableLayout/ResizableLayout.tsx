import React, { createContext, useContext, useMemo, Children } from 'react';
import { usePanelResize } from './usePanelResize';
import type { PanelConstraint, UsePanelResizeReturn } from './usePanelResize';

// ============================================================================
// Constants
// ============================================================================

/** Handle thickness in px — used by Slot to subtract from flex-basis. */
const HANDLE_SIZE_PX = 6; // w-1.5 = 0.375rem = 6px at default font size

// ============================================================================
// Context
// ============================================================================

interface ResizableLayoutContextValue extends UsePanelResizeReturn {
  direction: 'horizontal' | 'vertical';
  slotCount: number;
  handleCount: number;
}

const ResizableLayoutContext = createContext<ResizableLayoutContextValue | null>(null);

function useResizableLayout() {
  const ctx = useContext(ResizableLayoutContext);
  if (!ctx)
    throw new Error('ResizableLayout compound components must be used within <ResizableLayout>');
  return ctx;
}

// ============================================================================
// Slot
// ============================================================================

export interface SlotProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  /** @internal Injected by ResizableLayoutRoot — do not set manually. */
  __slotIndex?: number;
}

function Slot({ children, className, style, __slotIndex = 0 }: SlotProps) {
  const { ratios, direction, handleCount } = useResizableLayout();
  const isHorizontal = direction === 'horizontal';
  const sizeProperty = isHorizontal ? 'width' : 'height';

  // Guard: if index is out of bounds, fall back to equal distribution
  const ratio = ratios[__slotIndex] ?? (ratios.length > 0 ? 1 / ratios.length : 0);

  // Subtract proportional share of handle widths so slots + handles = 100%
  const handleOffset = handleCount > 0 ? HANDLE_SIZE_PX * handleCount : 0;

  return (
    <div
      className={className}
      style={{
        flex: `0 0 calc(${ratio * 100}% - ${handleOffset * ratio}px)`,
        [sizeProperty === 'width' ? 'minWidth' : 'minHeight']: 0,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

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
// Helper — type-safe child identification
// ============================================================================

function isSlotElement(child: React.ReactNode): child is React.ReactElement<SlotProps> {
  return React.isValidElement(child) && child.type === Slot;
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
  className,
  style,
  children,
}: ResizableLayoutProps) {
  const resize = usePanelResize({
    defaultRatios,
    constraints,
    direction,
  });

  // Count Slot children
  const slots = Children.toArray(children).filter(isSlotElement);
  const handleCount = Math.max(0, slots.length - 1);

  // Runtime guard: slot count must match defaultRatios length
  if (process.env.NODE_ENV !== 'production' && slots.length !== defaultRatios.length) {
    console.warn(
      `[ResizableLayout] Slot count (${slots.length}) does not match defaultRatios length (${defaultRatios.length}). ` +
        'Ratios may not apply correctly.'
    );
  }

  const ctx = useMemo<ResizableLayoutContextValue>(
    () => ({
      ...resize,
      direction,
      slotCount: slots.length,
      handleCount,
    }),
    [resize, direction, slots.length, handleCount]
  );

  const isHorizontal = direction === 'horizontal';
  const containerClass = [isHorizontal ? 'flex flex-row' : 'flex flex-col', className]
    .filter(Boolean)
    .join(' ');

  // Interleave Slot elements with resize handles
  const elements: React.ReactNode[] = [];
  let slotIndex = 0;

  Children.forEach(children, (child) => {
    if (isSlotElement(child)) {
      // Clone Slot with its index injected
      elements.push(
        React.cloneElement(child, { key: `slot-${slotIndex}`, __slotIndex: slotIndex })
      );

      // Insert handle between slots (not after the last one)
      if (slotIndex < slots.length - 1) {
        elements.push(<Handle key={`handle-${slotIndex}`} index={slotIndex} />);
      }
      slotIndex++;
    } else if (React.isValidElement(child)) {
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
// Compound export
// ============================================================================

export const ResizableLayout = Object.assign(ResizableLayoutRoot, {
  Slot,
});
