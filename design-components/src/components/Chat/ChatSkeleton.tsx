import React from 'react';

export interface ChatSkeletonProps {
  messageCount?: number;
  showInput?: boolean;
}

/**
 * Chat loading skeleton that matches the actual Chat layout with messages.
 */
export const ChatSkeleton: React.FC<ChatSkeletonProps> = ({ messageCount = 2 }) => {
  return (
    <div className="flex flex-col h-full w-full bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        {Array.from({ length: messageCount }).map((_, i) => {
          const isUser = i % 2 === 0;
          return (
            <div key={i} className="w-full py-6 bg-white">
              <div className="px-8">
                <div className={`max-w-4xl mx-auto ${isUser ? 'flex justify-end' : ''}`}>
                  <div className={isUser ? 'max-w-3xl' : 'w-full'}>
                    {/* Avatar + Content row */}
                    <div
                      className={`flex gap-4 ${
                        isUser
                          ? 'flex-row-reverse bg-gray-100 border border-gray-200 rounded-2xl p-2 items-center'
                          : 'items-start'
                      }`}
                    >
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        <div
                          className={`w-7 h-7 rounded-full animate-pulse ${
                            isUser ? 'bg-gray-300' : 'bg-gray-200'
                          }`}
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-2">
                        {isUser ? (
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-48" />
                        ) : (
                          <>
                            <div className="h-4 bg-gray-200 rounded animate-pulse w-full max-w-2xl" />
                            <div className="h-4 bg-gray-200 rounded animate-pulse w-11/12 max-w-xl" />
                            <div className="h-4 bg-gray-200 rounded animate-pulse w-4/5 max-w-lg" />
                            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4 max-w-md" />
                            <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3 max-w-sm" />
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChatSkeleton;
