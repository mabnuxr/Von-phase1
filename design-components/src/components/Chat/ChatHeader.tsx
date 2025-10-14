import React from 'react';

export interface ChatHeaderProps {
  /**
   * Title displayed in the header
   * @default 'Chat'
   */
  title?: string;

  /**
   * Callback when add button is clicked
   */
  onAddClick?: () => void;

  /**
   * Callback when refresh button is clicked
   */
  onRefreshClick?: () => void;

  /**
   * Callback when close button is clicked (for fixed variant)
   */
  onClose?: () => void;

  /**
   * Whether to show the close button
   * @default false
   */
  showClose?: boolean;
}

/**
 * Chat header component with title and action icons
 */
export const ChatHeader: React.FC<ChatHeaderProps> = ({
  title = 'Chat',
  onRefreshClick,
  onClose,
  showClose = false,
}) => {
  return (
    <div className="flex items-center justify-between py-4 px-5 border-b border-gray-200 bg-white">
      <div className="text-lg leading-7 font-semibold text-gray-900 font-sf tracking-tight antialiased">
        {title}
      </div>
      <div className="flex gap-1 items-center">
        {!showClose && (
          <>
            <button
              className="w-9 h-9 rounded-lg border-0 bg-transparent cursor-pointer flex items-center justify-center text-xl text-gray-600 transition-all duration-150 hover:bg-gray-100 hover:text-gray-900"
              onClick={onRefreshClick}
              aria-label="Refresh"
            >
              ↻
            </button>
          </>
        )}
        {showClose && (
          <button
            className="w-9 h-9 rounded-lg border-0 bg-transparent cursor-pointer flex items-center justify-center text-xl text-gray-600 transition-all duration-150 hover:bg-gray-100 hover:text-gray-900"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatHeader;
