import React from 'react';
import { SecondaryButton } from '../../forms/buttons';
import type { AutoEditMode } from './types';

export interface ModeSelectorProps {
  /**
   * Current mode
   * @default 'off'
   */
  mode: AutoEditMode;
  /**
   * Callback when mode changes
   */
  onModeChange: (mode: AutoEditMode) => void;
  /**
   * Whether the selector is disabled
   * @default false
   */
  disabled?: boolean;
}

/**
 * Get the display label for the current mode
 */
function getModeLabel(mode: AutoEditMode): string {
  switch (mode) {
    case 'off':
      return 'Auto edits: off';
    case 'on':
      return 'Auto edits: on';
    case 'plan':
      return 'Plan Mode';
    default:
      return 'Auto edits: off';
  }
}

/**
 * Get the next mode in the cycle
 */
function getNextMode(currentMode: AutoEditMode): AutoEditMode {
  switch (currentMode) {
    case 'off':
      return 'on';
    case 'on':
      return 'plan';
    case 'plan':
      return 'off';
    default:
      return 'off';
  }
}

/**
 * ModeSelector - A button that cycles through Auto edits modes
 *
 * Cycle: off -> on -> plan -> off
 *
 * Features:
 * - Shows current mode state
 * - Cycles through modes on click
 * - Uses SecondaryButton styling
 */
export const ModeSelector: React.FC<ModeSelectorProps> = ({
  mode = 'off',
  onModeChange,
  disabled = false,
}) => {
  const handleClick = () => {
    if (!disabled) {
      onModeChange(getNextMode(mode));
    }
  };

  return (
    <SecondaryButton
      onClick={handleClick}
      disabled={disabled}
      className="text-[13px] px-2.5 py-1.5 rounded-xl whitespace-nowrap"
    >
      {getModeLabel(mode)}
    </SecondaryButton>
  );
};

export default ModeSelector;
