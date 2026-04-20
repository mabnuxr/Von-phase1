import React from 'react';
import { VonIcon } from './VonIcon';

export interface AddToChatButtonProps {
  onClick: () => void;
  className?: string;
}

export const AddToChatButton: React.FC<AddToChatButtonProps> = ({ onClick, className }) => {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={[
        'opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center w-7 h-7 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 cursor-pointer shrink-0',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      title="Add to chat"
      aria-label="Add widget to chat"
    >
      <VonIcon variant="badge" size={14} />
    </button>
  );
};
