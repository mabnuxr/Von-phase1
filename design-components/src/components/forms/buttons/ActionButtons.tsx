import React from 'react';
import { PlusIcon } from '@phosphor-icons/react';

// ============================================================================
// Base Types
// ============================================================================

interface BaseButtonProps {
  /**
   * Button content
   */
  children: React.ReactNode;
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
   * HTML button type
   * @default 'button'
   */
  type?: 'button' | 'submit' | 'reset';
  /**
   * Additional CSS class name
   */
  className?: string;
  /**
   * Whether the button should take full width
   * @default false
   */
  fullWidth?: boolean;
}

// ============================================================================
// HeroButton - Primary CTA with orange-amber gradient (like "New chat")
// The most prominent button in the UI, used for main CTAs
// ============================================================================

export interface HeroButtonProps extends Omit<BaseButtonProps, 'fullWidth'> {
  /**
   * Icon to display before the text
   */
  icon?: React.ReactNode;
}

/**
 * HeroButton - Primary CTA button with orange-amber gradient
 *
 * Used for the most important actions like "New chat" button.
 * This is the highest hierarchy button in the system.
 */
export const HeroButton: React.FC<HeroButtonProps> = ({
  children,
  onClick,
  disabled = false,
  type = 'button',
  className = '',
  icon,
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        flex items-center gap-1 px-3 py-1.5 text-[13px] font-medium
        bg-gradient-to-bl from-orange-600 via-orange-500 via-amber-400 to-amber-400
        text-white rounded-[10px] shadow-xs
        hover:opacity-90 transition-colors cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {icon}
      {children}
    </button>
  );
};

// ============================================================================
// HeroIconButton - Icon-only variant of HeroButton (collapsed state)
// ============================================================================

export interface HeroIconButtonProps {
  /**
   * Icon to display
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

/**
 * HeroIconButton - Icon-only gradient button for collapsed states
 */
export const HeroIconButton: React.FC<HeroIconButtonProps> = ({
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
        w-8 h-8 flex items-center justify-center rounded-[10px]
        bg-gradient-to-bl from-orange-600 via-orange-500 via-amber-400 to-amber-400
        text-white hover:opacity-90 transition-colors cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {icon}
    </button>
  );
};

// ============================================================================
// PrimaryButton - Dark solid button (the "Save" button style)
// Used for primary actions within forms and dialogs
// ============================================================================

export type PrimaryButtonProps = BaseButtonProps;

/**
 * PrimaryButton - Dark solid action button
 *
 * Used for primary actions like "Save", "Confirm", "Submit".
 * Second highest hierarchy after HeroButton.
 */
export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  children,
  onClick,
  disabled = false,
  type = 'button',
  className = '',
  fullWidth = false,
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        px-3 py-2 text-[13px] font-medium text-white bg-gray-900 rounded-xl
        hover:bg-gray-800 transition-colors cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed
        ${fullWidth ? 'flex-1 w-full' : ''}
        ${className}
      `}
    >
      {children}
    </button>
  );
};

// ============================================================================
// SecondaryButton - Transparent background with border
// Used for secondary actions that need visibility but less emphasis
// ============================================================================

export type SecondaryButtonProps = BaseButtonProps;

/**
 * SecondaryButton - Outlined button with transparent background
 *
 * Used for secondary actions that need visibility but less emphasis than primary.
 * Has a border and transparent background.
 */
export const SecondaryButton: React.FC<SecondaryButtonProps> = ({
  children,
  onClick,
  disabled = false,
  type = 'button',
  className = '',
  fullWidth = false,
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        px-3 py-2 text-[13px] font-medium text-gray-900 bg-transparent border border-gray-200 rounded-xl
        hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed
        ${fullWidth ? 'flex-1 w-full' : ''}
        ${className}
      `}
    >
      {children}
    </button>
  );
};

// ============================================================================
// GhostButton - Subtle button with gray background (the "Discard" style)
// Used for cancel/dismiss actions or tertiary actions
// ============================================================================

export type GhostButtonProps = BaseButtonProps;

/**
 * GhostButton - Subtle button with gray background
 *
 * Used for cancel/dismiss actions like "Discard", "Cancel".
 * Lowest hierarchy for actions that shouldn't draw attention.
 */
export const GhostButton: React.FC<GhostButtonProps> = ({
  children,
  onClick,
  disabled = false,
  type = 'button',
  className = '',
  fullWidth = false,
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        px-3 py-2 text-[13px] font-medium text-gray-800 bg-gray-50 border border-gray-200 rounded-xl
        hover:bg-gray-100 hover:border-gray-300 transition-colors cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed
        ${fullWidth ? 'flex-1 w-full' : ''}
        ${className}
      `}
    >
      {children}
    </button>
  );
};

// ============================================================================
// PillButton - Small rounded-full button for inline actions (like "Add Filter")
// Used for small inline actions in section headers
// ============================================================================

export interface PillButtonProps extends Omit<BaseButtonProps, 'fullWidth'> {
  /**
   * Icon to display before the text
   */
  icon?: React.ReactNode;
}

/**
 * PillButton - Small pill-shaped button for inline actions
 *
 * Used in section headers and inline actions like "Add Filter", "Add new".
 * Compact size with rounded-full styling.
 */
export const PillButton: React.FC<PillButtonProps> = ({
  children,
  onClick,
  disabled = false,
  type = 'button',
  className = '',
  icon,
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-white bg-gray-900 rounded-full
        hover:bg-gray-800 transition-all cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {icon}
      {children}
    </button>
  );
};

// ============================================================================
// AddButton - Convenience wrapper for PillButton with plus icon
// ============================================================================

export interface AddButtonProps extends Omit<PillButtonProps, 'icon'> {
  /**
   * Size of the plus icon
   * @default 10
   */
  iconSize?: number;
}

/**
 * AddButton - PillButton with a plus icon, for adding new items
 */
export const AddButton: React.FC<AddButtonProps> = ({ children, iconSize = 10, ...props }) => {
  return (
    <PillButton {...props} icon={<PlusIcon size={iconSize} weight="bold" />}>
      {children}
    </PillButton>
  );
};

// ============================================================================
// ActionButtonGroup - Primary/Ghost button pair (Save/Discard)
// ============================================================================

export interface ActionButtonGroupProps {
  /**
   * Primary button label
   * @default 'Save'
   */
  primaryLabel?: string;
  /**
   * Ghost button label
   * @default 'Discard'
   */
  ghostLabel?: string;
  /**
   * Called when primary button is clicked
   */
  onPrimaryClick?: () => void;
  /**
   * Called when ghost button is clicked
   */
  onGhostClick?: () => void;
  /**
   * Whether primary button is disabled
   * @default false
   */
  primaryDisabled?: boolean;
  /**
   * Whether ghost button is disabled
   * @default false
   */
  ghostDisabled?: boolean;
  /**
   * Additional CSS class name for the container
   */
  className?: string;
}

/**
 * ActionButtonGroup - Pre-composed Primary/Ghost button pair
 *
 * @deprecated Use individual PrimaryButton and GhostButton components instead for more flexibility
 */
export const ActionButtonGroup: React.FC<ActionButtonGroupProps> = ({
  primaryLabel = 'Save',
  ghostLabel = 'Discard',
  onPrimaryClick,
  onGhostClick,
  primaryDisabled = false,
  ghostDisabled = false,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <GhostButton onClick={onGhostClick} disabled={ghostDisabled} fullWidth>
        {ghostLabel}
      </GhostButton>
      <PrimaryButton onClick={onPrimaryClick} disabled={primaryDisabled} fullWidth>
        {primaryLabel}
      </PrimaryButton>
    </div>
  );
};

// ============================================================================
// TransparentButton - Button with transparent background, fill on hover
// Used inside SelectionPopover for menu options
// ============================================================================

export interface TransparentButtonProps extends Omit<BaseButtonProps, 'fullWidth'> {
  /**
   * Icon to display before the text
   */
  icon?: React.ReactNode;
  /**
   * Whether the item is in an "active" or "selected" state
   * @default false
   */
  active?: boolean;
  /**
   * Right-side content (e.g., checkmark icon for selected state)
   */
  rightContent?: React.ReactNode;
  /**
   * Variant for styling
   * @default 'default'
   */
  variant?: 'default' | 'danger';
}

/**
 * TransparentButton - Button with transparent background and fill on hover
 *
 * Used for menu items in SelectionPopover and similar dropdown contexts.
 * Supports active state and danger variant for destructive actions.
 */
export const TransparentButton: React.FC<TransparentButtonProps> = ({
  children,
  onClick,
  disabled = false,
  type = 'button',
  className = '',
  icon,
  active = false,
  rightContent,
  variant = 'default',
}) => {
  const baseClasses =
    'w-full rounded-xl flex items-center justify-between px-3 py-2 text-[13px] transition-colors cursor-pointer text-left';

  const variantClasses = {
    default: active
      ? 'bg-green-50 text-green-800'
      : 'text-gray-900 bg-transparent hover:bg-gray-50',
    danger: 'text-red-600 bg-transparent hover:bg-red-50',
  };

  // Default icon color classes (apply to icon wrapper)
  const iconColorClass = variant === 'danger' ? '' : active ? 'text-green-600' : 'text-gray-800';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      <div className="flex items-center gap-2.5">
        {icon && <span className={iconColorClass}>{icon}</span>}
        {children}
      </div>
      {rightContent}
    </button>
  );
};

// ============================================================================
// Legacy exports for backward compatibility
// These will be removed in a future version
// ============================================================================

/** @deprecated Use HeroButton instead */
export const GradientButton = HeroButton;
/** @deprecated Use HeroButtonProps instead */
export type GradientButtonProps = HeroButtonProps;

/** @deprecated Use HeroIconButton instead */
export const GradientIconButton = HeroIconButton;
/** @deprecated Use HeroIconButtonProps instead */
export type GradientIconButtonProps = HeroIconButtonProps;

/** @deprecated Use PrimaryButton instead */
export const SaveButton = PrimaryButton;
/** @deprecated Use PrimaryButtonProps instead */
export type SaveButtonProps = PrimaryButtonProps;

/** @deprecated Use GhostButton instead */
export const DiscardButton = GhostButton;
/** @deprecated Use GhostButtonProps instead */
export type DiscardButtonProps = GhostButtonProps;

export default {
  HeroButton,
  HeroIconButton,
  PrimaryButton,
  SecondaryButton,
  GhostButton,
  PillButton,
  AddButton,
  ActionButtonGroup,
  // Legacy
  GradientButton,
  GradientIconButton,
  SaveButton,
  DiscardButton,
};
