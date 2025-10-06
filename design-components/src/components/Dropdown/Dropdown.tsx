import React, { useRef, useEffect } from 'react';
import { Menu } from '../Menu';
import type { MenuItem } from '../Menu';
import { spacing } from '../../theme';

// Re-export MenuItem as DropdownItem for backward compatibility
export type DropdownItem = MenuItem;

export interface DropdownProps {
  /**
   * Trigger element (usually a button or avatar)
   */
  trigger: React.ReactNode;

  /**
   * Menu items
   */
  items: DropdownItem[];

  /**
   * Position of the dropdown menu
   * @default 'bottom-right'
   */
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';

  /**
   * Additional CSS class name
   */
  className?: string;
}

/**
 * Dropdown component - A convenience molecule combining a trigger and Menu atom
 *
 * **MOLECULE** - This component composes:
 * - A trigger element (any ReactNode - button, avatar, etc.)
 * - `Menu` atom - for displaying menu items
 *
 * **State Management:**
 * - Manages menu open/close state internally
 * - Handles click-outside detection to close menu
 * - Handles Escape key to close menu
 * - Provides automatic positioning
 *
 * **Dependencies:**
 * - Menu atom (../Menu)
 * - Theme tokens (spacing)
 *
 * **Use Case:**
 * This component is useful when you want a quick dropdown with automatic positioning
 * and state management. For more control, use Avatar + Menu independently (see Header organism).
 *
 * @example
 * ```tsx
 * // With Button trigger
 * <Dropdown
 *   trigger={<Button>Options</Button>}
 *   items={[
 *     { key: 'edit', label: 'Edit', onClick: () => {} },
 *     { key: 'delete', label: 'Delete', onClick: () => {} }
 *   ]}
 *   position="bottom-right"
 * />
 *
 * // With Avatar trigger
 * <Dropdown
 *   trigger={<Avatar fallback="JD" />}
 *   items={menuItems}
 * />
 * ```
 */
export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  items,
  position = 'bottom-right',
  className,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleTriggerClick = () => {
    setIsOpen(!isOpen);
  };

  // Position styles
  const positionStyles: Record<string, React.CSSProperties> = {
    'bottom-left': {
      top: '100%',
      left: 0,
      marginTop: spacing[1],
    },
    'bottom-right': {
      top: '100%',
      right: 0,
      marginTop: spacing[1],
    },
    'top-left': {
      bottom: '100%',
      left: 0,
      marginBottom: spacing[1],
    },
    'top-right': {
      bottom: '100%',
      right: 0,
      marginBottom: spacing[1],
    },
  };

  const containerStyles: React.CSSProperties = {
    position: 'relative',
    display: 'inline-block',
  };

  const menuWrapperStyles: React.CSSProperties = {
    position: 'absolute',
    ...positionStyles[position],
    zIndex: 1000,
  };

  return (
    <div ref={dropdownRef} className={className} style={containerStyles}>
      <div onClick={handleTriggerClick} style={{ cursor: 'pointer', display: 'inline-block' }}>
        {trigger}
      </div>

      <div style={menuWrapperStyles}>
        <Menu items={items} isOpen={isOpen} onClose={() => setIsOpen(false)} />
      </div>
    </div>
  );
};

export default Dropdown;
