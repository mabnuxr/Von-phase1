import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TransparentButton } from '../forms/buttons';
import { Tooltip } from '../Tooltip';

// ============================================================================
// Types
// ============================================================================

export interface ContextMenuItem {
  /**
   * Unique identifier for the item
   */
  id: string;
  /**
   * Display label for the item
   */
  label: string;
  /**
   * Icon to display before the label
   */
  icon?: React.ReactNode;
  /**
   * Whether this item is in an active/selected state
   * @default false
   */
  active?: boolean;
  /**
   * Right-side content (e.g., checkmark icon)
   */
  rightContent?: React.ReactNode;
  /**
   * Variant for styling (default or danger for destructive actions)
   * @default 'default'
   */
  variant?: 'default' | 'danger';
  /**
   * Whether this item is disabled
   * @default false
   */
  disabled?: boolean;
  /**
   * Native tooltip text — useful for explaining why a disabled item can't
   * be used. Rendered via the `title` attribute on the row wrapper.
   */
  tooltip?: string;
}

export type ContextMenuPosition =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'
  | 'right'
  | 'right-start'
  | 'right-end';

export interface ContextMenuProps {
  /**
   * Whether the popover is open
   */
  isOpen: boolean;

  /**
   * Callback when popover should close
   */
  onClose: () => void;

  /**
   * Menu items to display
   */
  items: ContextMenuItem[];

  /**
   * Callback when an item is clicked
   */
  onItemClick?: (item: ContextMenuItem) => void;

  /**
   * Position relative to anchor element (when using anchorRef)
   * @default 'bottom-start'
   */
  position?: ContextMenuPosition;

  /**
   * Reference to the anchor element for positioning
   * When provided, popover will be positioned relative to this element
   */
  anchorRef?: React.RefObject<HTMLElement | null>;

  /**
   * Fixed position override (when not using anchorRef)
   * Use this for mouse-position-based popovers (context menus)
   */
  fixedPosition?: { top?: number; right?: number; left?: number; bottom?: number };

  /**
   * Offset from the anchor element in pixels
   * @default 8
   */
  offset?: number;

  /**
   * Width of the popover
   * @default 'auto'
   */
  width?: number | 'auto';

  /**
   * Optional header content
   */
  header?: React.ReactNode;

  /**
   * Optional footer content
   */
  footer?: React.ReactNode;

  /**
   * Additional CSS class name for the popover container
   */
  className?: string;

  /**
   * Whether to show a backdrop (invisible click-away layer)
   * @default true
   */
  showBackdrop?: boolean;
}

// ============================================================================
// Animation variants based on position
// ============================================================================

const getAnimationVariants = (position: ContextMenuPosition) => {
  const baseVariants = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  };

  // Add directional offset based on position
  if (position.startsWith('top')) {
    return {
      initial: { ...baseVariants.initial, y: 8 },
      animate: { ...baseVariants.animate, y: 0 },
      exit: { ...baseVariants.exit, y: 8 },
    };
  }
  if (position.startsWith('bottom')) {
    return {
      initial: { ...baseVariants.initial, y: -8 },
      animate: { ...baseVariants.animate, y: 0 },
      exit: { ...baseVariants.exit, y: -8 },
    };
  }
  if (position.startsWith('left')) {
    return {
      initial: { ...baseVariants.initial, x: 8 },
      animate: { ...baseVariants.animate, x: 0 },
      exit: { ...baseVariants.exit, x: 8 },
    };
  }
  if (position.startsWith('right')) {
    return {
      initial: { ...baseVariants.initial, x: -8 },
      animate: { ...baseVariants.animate, x: 0 },
      exit: { ...baseVariants.exit, x: -8 },
    };
  }

  return baseVariants;
};

// ============================================================================
// Position calculation
// ============================================================================

const calculatePosition = (
  anchorRect: DOMRect,
  popoverRect: { width: number; height: number },
  position: ContextMenuPosition,
  offset: number
): { top?: number; left?: number; bottom?: number; right?: number } => {
  const { top, left, right, bottom, width, height } = anchorRect;

  switch (position) {
    case 'top':
      return {
        bottom: window.innerHeight - top + offset,
        left: left + width / 2 - popoverRect.width / 2,
      };
    case 'top-start':
      return {
        bottom: window.innerHeight - top + offset,
        left: left,
      };
    case 'top-end':
      return {
        bottom: window.innerHeight - top + offset,
        left: right - popoverRect.width,
      };
    case 'bottom':
      return {
        top: bottom + offset,
        left: left + width / 2 - popoverRect.width / 2,
      };
    case 'bottom-start':
      return {
        top: bottom + offset,
        left: left,
      };
    case 'bottom-end':
      return {
        top: bottom + offset,
        left: right - popoverRect.width,
      };
    case 'left':
      return {
        top: top + height / 2 - popoverRect.height / 2,
        right: window.innerWidth - left + offset,
      };
    case 'left-start':
      return {
        top: top,
        right: window.innerWidth - left + offset,
      };
    case 'left-end':
      return {
        top: bottom - popoverRect.height,
        right: window.innerWidth - left + offset,
      };
    case 'right':
      return {
        top: top + height / 2 - popoverRect.height / 2,
        left: right + offset,
      };
    case 'right-start':
      return {
        top: top,
        left: right + offset,
      };
    case 'right-end':
      return {
        top: bottom - popoverRect.height,
        left: right + offset,
      };
    default:
      return { top: bottom + offset, left: left };
  }
};

// ============================================================================
// Component
// ============================================================================

/**
 * ContextMenu - A unified context menu/popover component for menus and selection lists
 *
 * Features:
 * - Flexible positioning (12 positions around anchor element)
 * - Support for fixed position (context menus at mouse position)
 * - Animated entrance/exit based on position
 * - Uses TransparentButton for consistent item styling
 * - Optional header and footer sections
 * - Click-away backdrop to close
 */
export const ContextMenu: React.FC<ContextMenuProps> = ({
  isOpen,
  onClose,
  items,
  onItemClick,
  position = 'bottom-start',
  anchorRef,
  fixedPosition,
  offset = 8,
  width = 'auto',
  header,
  footer,
  className = '',
  showBackdrop = true,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [calculatedPosition, setCalculatedPosition] = React.useState<{
    top?: number;
    left?: number;
    bottom?: number;
    right?: number;
  }>({});

  // Calculate position when open and anchor is available
  useEffect(() => {
    if (isOpen && anchorRef?.current && popoverRef.current) {
      const anchorRect = anchorRef.current.getBoundingClientRect();
      const popoverRect = popoverRef.current.getBoundingClientRect();

      const pos = calculatePosition(
        anchorRect,
        { width: popoverRect.width, height: popoverRect.height },
        position,
        offset
      );

      setCalculatedPosition(pos);
    }
  }, [isOpen, anchorRef, position, offset]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const handleItemClick = (item: ContextMenuItem) => {
    if (item.disabled) return;
    onItemClick?.(item);
  };

  const animationVariants = getAnimationVariants(position);

  // Use fixed position if provided, otherwise use calculated position
  const positionStyle = fixedPosition || calculatedPosition;

  const widthStyle = width === 'auto' ? {} : { width };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop for click-away */}
          {showBackdrop && <div className="fixed inset-0 z-[9998]" onClick={onClose} />}

          {/* Popover */}
          <motion.div
            ref={popoverRef}
            initial={animationVariants.initial}
            animate={animationVariants.animate}
            exit={animationVariants.exit}
            transition={{ duration: 0.1 }}
            className={`
              fixed bg-white rounded-2xl shadow-lg border border-gray-100 p-1 z-[9999]
              ${className}
            `}
            style={{
              ...positionStyle,
              ...widthStyle,
              minWidth: width === 'auto' ? '8rem' : undefined,
            }}
          >
            {/* Optional header */}
            {header && <div className="px-3 py-2 border-b border-gray-100">{header}</div>}

            {/* Menu items */}
            <div className="py-0.5">
              {items.map((item) => (
                <Tooltip
                  key={item.id}
                  content={item.tooltip}
                  enabled={!!item.tooltip}
                  wrapperClassName="block"
                >
                  <TransparentButton
                    onClick={() => handleItemClick(item)}
                    icon={item.icon}
                    active={item.active}
                    rightContent={item.rightContent}
                    variant={item.variant}
                    disabled={item.disabled}
                  >
                    {item.label}
                  </TransparentButton>
                </Tooltip>
              ))}
            </div>

            {/* Optional footer */}
            {footer && <div className="px-3 py-2 border-t border-gray-100">{footer}</div>}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ContextMenu;
