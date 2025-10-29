import React from 'react';

/**
 * Get user initials from name or email
 */
function getUserInitials(name?: string, email?: string): string {
  // Try to get initials from name first
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);

    if (parts.length >= 2) {
      // First and last name
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    } else if (parts.length === 1 && parts[0].length > 0) {
      // Single name, take first character
      return parts[0][0].toUpperCase();
    }
  }

  // Fallback to email
  if (email && email.trim()) {
    const emailUsername = email.split('@')[0];
    if (emailUsername.length >= 2) {
      return emailUsername.substring(0, 2).toUpperCase();
    } else if (emailUsername.length === 1) {
      return emailUsername[0].toUpperCase();
    }
  }

  // Final fallback
  return 'U';
}

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

  /**
   * User's name (for user profile icon)
   */
  userName?: string;

  /**
   * User's email (for user profile icon)
   */
  userEmail?: string;
}

/**
 * Chat header component with title and action icons
 */
export const ChatHeader: React.FC<ChatHeaderProps> = ({
  title = 'Chat',
  onRefreshClick,
  onClose,
  showClose = false,
  userName,
  userEmail,
}) => {
  const userInitials = getUserInitials(userName, userEmail);

  return (
    <div className="flex items-center justify-between py-4 px-5 border-b border-gray-200 bg-white">
      <div className="text-lg leading-7 font-semibold text-gray-900 font-sf tracking-tight antialiased">
        {title}
      </div>
      <div className="flex gap-2 items-center">
        {/* User profile icon */}
        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white text-xs font-semibold">
          {userInitials}
        </div>
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
