import React from 'react';
import { motion } from 'framer-motion';

export interface ChatMessageSkeletonProps {
  /**
   * Type of message skeleton
   */
  type?: 'user' | 'assistant';
}

/**
 * Skeleton loader for chat messages with shimmer animation
 */
export const ChatMessageSkeleton: React.FC<ChatMessageSkeletonProps> = ({ type = 'assistant' }) => {
  const isUser = type === 'user';

  return (
    <motion.div
      className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
    >
      <div
        className={`
          max-w-[85%] rounded-2xl overflow-hidden
          ${isUser ? 'bg-primary-50 border border-primary-100' : 'bg-white border border-gray-200'}
        `}
      >
        {/* Skeleton tabs for assistant */}
        {!isUser && (
          <div className="flex gap-4 px-4 py-2 border-b border-gray-200">
            <div className="h-5 w-16 bg-gray-200 rounded animate-pulse" />
            <div className="h-5 w-20 bg-gray-200 rounded animate-pulse" />
            <div className="h-5 w-20 bg-gray-200 rounded animate-pulse" />
          </div>
        )}

        {/* Skeleton content with shimmer */}
        <div className="px-4 py-3 space-y-2 relative overflow-hidden">
          {/* Shimmer overlay */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
            animate={{ x: ['-100%', '200%'] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'linear',
            }}
          />

          {/* Skeleton lines */}
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
          <div className="h-4 bg-gray-200 rounded w-4/6" />
        </div>
      </div>
    </motion.div>
  );
};

export default ChatMessageSkeleton;
