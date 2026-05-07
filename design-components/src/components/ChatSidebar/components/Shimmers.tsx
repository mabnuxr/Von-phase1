import React from 'react';

/**
 * One placeholder row matched to `ConversationItem`'s outer dimensions
 * (32px tall, 8px horizontal padding) so the list doesn't reflow when
 * shimmers swap to real rows.
 */
export const RowShimmer: React.FC = () => (
  <div className="flex items-center gap-2 px-2 h-8 rounded-md">
    <div className="h-3.5 flex-1 bg-gray-100 rounded animate-pulse" style={{ maxWidth: '70%' }} />
  </div>
);

/** Render `count` row shimmers in a row. */
export const RowShimmers: React.FC<{ count: number }> = ({ count }) => (
  <>
    {Array.from({ length: count }, (_, i) => (
      <RowShimmer key={i} />
    ))}
  </>
);
