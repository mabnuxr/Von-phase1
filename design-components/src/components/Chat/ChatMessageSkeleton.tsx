import React from 'react';

export interface ChatMessageSkeletonProps {
  type?: 'user' | 'assistant';
}

/**
 * Simple skeleton loader for a single chat message.
 */
export const ChatMessageSkeleton: React.FC<ChatMessageSkeletonProps> = ({ type = 'assistant' }) => {
  const isUser = type === 'user';

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`
          max-w-[70%] rounded-2xl p-4 space-y-2
          ${isUser ? 'bg-gray-100' : 'bg-gray-50 border border-gray-200'}
        `}
      >
        <div className="h-3 bg-gray-200 rounded animate-pulse w-48" />
        <div className="h-3 bg-gray-200 rounded animate-pulse w-36" />
      </div>
    </div>
  );
};

export default ChatMessageSkeleton;
