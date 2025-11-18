import React from 'react';
import { AlertCircleIcon } from './icons';

export interface MessageAreaErrorProps {
  /**
   * Error message to display
   */
  message: string;
}

/**
 * MessageAreaError - Displays error in assistant message area (like ChatGPT)
 *
 * Clean, minimal error display.
 * Matches ChatGPT's polished error aesthetic.
 */
export const MessageAreaError: React.FC<MessageAreaErrorProps> = ({ message }) => {
  return (
    <div className="max-w-fit flex items-start gap-3 py-3 px-4 bg-red-50/50 border border-red-100 rounded-lg">
      {/* Error Icon - Subtle, not too large */}
      <div className="flex-shrink-0 mt-0.5">
        <AlertCircleIcon className="w-5 h-5 text-red-500" size={20} />
      </div>

      {/* Error Message - Clean and direct */}
      <p className="text-sm text-gray-800 font-sf leading-relaxed flex-1">{message}</p>
    </div>
  );
};

export default MessageAreaError;
