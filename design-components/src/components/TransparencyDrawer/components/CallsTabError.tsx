import React from 'react';
import { WarningCircleIcon } from '@phosphor-icons/react';

export interface CallsTabErrorProps {
  /**
   * Error message to display
   */
  message?: string;
}

/**
 * CallsTabError - Error state for the Calls tab
 *
 * Displays a friendly error message when call data fails to load.
 */
export const CallsTabError: React.FC<CallsTabErrorProps> = ({
  message = 'An error occurred while fetching call data',
}) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-6">
      <WarningCircleIcon size={48} weight="duotone" className="text-red-300 mb-3" />
      <p className="text-sm text-gray-700 font-medium mb-1">Failed to load calls</p>
      <p className="text-xs text-gray-500">{message}</p>
    </div>
  );
};

CallsTabError.displayName = 'CallsTabError';
