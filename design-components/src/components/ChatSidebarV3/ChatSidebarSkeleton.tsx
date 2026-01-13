import React from 'react';

/**
 * Loading skeleton for ChatSidebarV3
 * Shows animated placeholder items while sidebar data is loading
 */
export const ChatSidebarSkeleton: React.FC = () => {
  return (
    <div className="space-y-4 py-2">
      {/* Chats section skeleton */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-2 py-1.5">
          <div className="h-3 w-12 bg-gray-200 rounded animate-pulse" />
          <div className="h-3 w-6 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="pl-4 space-y-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2.5 px-2 py-1.5">
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
              <div
                className="h-4 flex-1 bg-gray-200 rounded animate-pulse"
                style={{ maxWidth: `${60 + i * 15}%` }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Dashboards section skeleton */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-2 py-1.5">
          <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
          <div className="h-3 w-6 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="pl-4 space-y-1">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center gap-2.5 px-2 py-1.5">
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
              <div
                className="h-4 flex-1 bg-gray-200 rounded animate-pulse"
                style={{ maxWidth: `${50 + i * 20}%` }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChatSidebarSkeleton;
