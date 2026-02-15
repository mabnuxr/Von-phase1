import React from 'react';

/**
 * Loading skeleton for ChatSidebarV2
 * Mirrors the real sidebar layout: Folders section + Chats section
 */
export const ChatSidebarSkeleton: React.FC = () => {
  return (
    <div className="py-2">
      {/* Folders section skeleton */}
      <div className="mb-3">
        {/* SectionHeader placeholder */}
        <div className="flex items-center px-2 py-1.5">
          <div className="h-3 w-14 bg-gray-200 rounded animate-pulse" />
        </div>
        {/* "New folder" row placeholder */}
        <div className="flex items-center gap-1.5 px-2 h-8">
          <div className="h-4 w-4 bg-gray-200 rounded animate-pulse flex-shrink-0" />
          <div className="h-3.5 w-20 bg-gray-200 rounded animate-pulse" />
        </div>
        {/* Folder rows */}
        {[75, 55].map((width, i) => (
          <div key={i} className="flex items-center gap-1.5 px-2 h-8">
            <div className="h-4 w-4 bg-gray-200 rounded animate-pulse flex-shrink-0" />
            <div
              className="h-3.5 bg-gray-200 rounded animate-pulse"
              style={{ width: `${width}%` }}
            />
          </div>
        ))}
      </div>

      {/* Chats section skeleton */}
      <div className="mb-2">
        {/* SectionHeader placeholder */}
        <div className="flex items-center px-2 py-1.5">
          <div className="h-3 w-10 bg-gray-200 rounded animate-pulse" />
        </div>
        {/* Conversation rows */}
        {[85, 60, 70, 45, 80].map((width, i) => (
          <div key={i} className="flex items-center gap-2.5 px-2 h-8">
            <div
              className="h-3.5 bg-gray-200 rounded animate-pulse"
              style={{ width: `${width}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatSidebarSkeleton;
