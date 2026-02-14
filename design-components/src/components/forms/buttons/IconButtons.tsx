import React from 'react';

// ============================================================================
// Base Types
// ============================================================================

interface BaseIconButtonProps {
  /**
   * Icon element to display
   */
  icon: React.ReactNode;
  /**
   * Click handler
   */
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  /**
   * Whether the button is disabled
   * @default false
   */
  disabled?: boolean;
  /**
   * Tooltip/title text
   */
  title?: string;
  /**
   * Additional CSS class name
   */
  className?: string;
}

// ============================================================================
// IconButton - Base icon button with hover state
// ============================================================================

export interface IconButtonProps extends BaseIconButtonProps {
  /**
   * Size variant
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large';
  /**
   * Visual variant
   * @default 'ghost'
   */
  variant?: 'ghost' | 'bordered' | 'filled';
}

const sizeClasses = {
  small: 'w-6 h-6',
  medium: 'w-7 h-7',
  large: 'w-8 h-8',
};

const variantClasses = {
  ghost: 'text-gray-800 hover:bg-gray-50',
  bordered: 'text-gray-800 border border-gray-100 hover:bg-gray-50',
  filled: 'text-white bg-gray-800 hover:bg-gray-700',
};

/**
 * IconButton - Standard icon button with configurable size and variant
 *
 * Used throughout the app for icon-only actions like collapse, expand, etc.
 */
export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onClick,
  disabled = false,
  title,
  className = '',
  size = 'medium',
  variant = 'ghost',
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        flex items-center justify-center rounded-lg transition-colors cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {icon}
    </button>
  );
};

// ============================================================================
// SidebarToggleButton - Toggle button for expanding/collapsing sidebar
// ============================================================================

export type SidebarToggleButtonProps = BaseIconButtonProps;

/**
 * SidebarToggleButton - Button for toggling sidebar collapse state
 */
export const SidebarToggleButton: React.FC<SidebarToggleButtonProps> = ({
  icon,
  onClick,
  disabled = false,
  title,
  className = '',
}) => {
  return (
    <IconButton
      icon={icon}
      onClick={onClick}
      disabled={disabled}
      title={title}
      variant="ghost"
      size="medium"
      className={className}
    />
  );
};

// ============================================================================
// CollapseAllButton - Button with border for collapsing all sections
// ============================================================================

export type CollapseAllButtonProps = BaseIconButtonProps;

/**
 * CollapseAllButton - Bordered button for collapse all action
 */
export const CollapseAllButton: React.FC<CollapseAllButtonProps> = ({
  icon,
  onClick,
  disabled = false,
  title = 'Collapse all',
  className = '',
}) => {
  return (
    <IconButton
      icon={icon}
      onClick={onClick}
      disabled={disabled}
      title={title}
      variant="bordered"
      size="medium"
      className={className}
    />
  );
};

// ============================================================================
// MoreOptionsButton - Hover-reveal button for context menu trigger
// ============================================================================

export interface MoreOptionsButtonProps extends BaseIconButtonProps {
  /**
   * Whether the button is visible (controlled externally based on hover state)
   * @default true
   */
  visible?: boolean;
}

/**
 * MoreOptionsButton - Dark filled button for more options, typically hover-reveal
 */
export const MoreOptionsButton: React.FC<MoreOptionsButtonProps> = ({
  icon,
  onClick,
  disabled = false,
  title,
  className = '',
  visible = true,
}) => {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
      }}
      disabled={disabled}
      title={title}
      className={`
        p-0.5 rounded-md transition-opacity duration-150 cursor-pointer z-10
        text-gray-900 bg-gray-300 hover:bg-gray-400
        disabled:opacity-50 disabled:cursor-not-allowed
        ${visible ? 'opacity-100' : 'opacity-0'}
        ${className}
      `}
    >
      {icon}
    </button>
  );
};

// ============================================================================
// PrimaryIconButton - Highest prominence icon button (dark filled)
// ============================================================================

export interface PrimaryIconButtonProps extends BaseIconButtonProps {
  /**
   * Whether the button is visible (controlled externally based on hover state)
   * @default true
   */
  visible?: boolean;
  /**
   * Size variant
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large';
}

/**
 * PrimaryIconButton - Dark filled icon button for highest prominence actions
 *
 * Use for: More options menu trigger, primary icon actions
 */
export const PrimaryIconButton: React.FC<PrimaryIconButtonProps> = ({
  icon,
  onClick,
  disabled = false,
  title,
  className = '',
  visible = true,
  size = 'medium',
}) => {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
      }}
      disabled={disabled}
      title={title}
      className={`
        ${sizeClasses[size]} flex items-center justify-center rounded-lg
        text-gray-900 bg-gray-300 hover:bg-gray-400
        transition-all duration-150 cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed
        ${visible ? 'opacity-100' : 'opacity-0'}
        ${className}
      `}
    >
      {icon}
    </button>
  );
};

// ============================================================================
// SecondaryIconButton - Medium prominence icon button (bordered)
// ============================================================================

export interface SecondaryIconButtonProps extends BaseIconButtonProps {
  /**
   * Size variant
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large';
}

/**
 * SecondaryIconButton - Bordered icon button for medium prominence actions
 *
 * Use for: Collapse all sections, secondary icon actions
 */
export const SecondaryIconButton: React.FC<SecondaryIconButtonProps> = ({
  icon,
  onClick,
  disabled = false,
  title,
  className = '',
  size = 'medium',
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        ${sizeClasses[size]} flex items-center justify-center rounded-lg
        text-gray-800 border border-gray-100 hover:bg-gray-50
        transition-colors cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {icon}
    </button>
  );
};

// ============================================================================
// TertiaryIconButton - Lowest prominence icon button (ghost)
// ============================================================================

export interface TertiaryIconButtonProps extends BaseIconButtonProps {
  /**
   * Size variant
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large';
}

/**
 * TertiaryIconButton - Ghost icon button for lowest prominence actions
 *
 * Use for: Sidebar toggle, back navigation, subtle actions
 */
export const TertiaryIconButton: React.FC<TertiaryIconButtonProps> = ({
  icon,
  onClick,
  disabled = false,
  title,
  className = '',
  size = 'medium',
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        ${sizeClasses[size]} flex items-center justify-center rounded-lg
        text-gray-800 hover:bg-gray-50
        transition-colors cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {icon}
    </button>
  );
};

// ============================================================================
// BackButton - Arrow button for navigation back
// ============================================================================

export type BackButtonProps = BaseIconButtonProps;

/**
 * BackButton - Ghost button for navigation back
 */
export const BackButton: React.FC<BackButtonProps> = ({
  icon,
  onClick,
  disabled = false,
  title,
  className = '',
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        p-1.5 text-gray-800 hover:bg-gray-100 rounded-lg
        transition-colors cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {icon}
    </button>
  );
};

// ============================================================================
// RemoveButton - X button for removing items (hover-reveal style)
// ============================================================================

export interface RemoveButtonProps {
  /**
   * Click handler
   */
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  /**
   * Whether the button is visible (controlled externally based on hover state)
   * @default true
   */
  visible?: boolean;
  /**
   * Icon element to display
   */
  icon: React.ReactNode;
  /**
   * Tooltip/title text
   */
  title?: string;
  /**
   * Additional CSS class name
   */
  className?: string;
}

/**
 * RemoveButton - Subtle X button for removing items, typically hover-reveal
 */
export const RemoveButton: React.FC<RemoveButtonProps> = ({
  onClick,
  visible = true,
  icon,
  title = 'Remove',
  className = '',
}) => {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
      }}
      title={title}
      className={`
        p-1 text-gray-800 hover:bg-gray-100 rounded-lg
        transition-all duration-150 cursor-pointer flex-shrink-0
        ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        ${className}
      `}
    >
      {icon}
    </button>
  );
};

export default {
  IconButton,
  SidebarToggleButton,
  CollapseAllButton,
  MoreOptionsButton,
  BackButton,
  RemoveButton,
};
