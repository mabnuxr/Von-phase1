import React from 'react';
import { VonIcon } from './VonIcon';

export interface AddToChatButtonProps {
  onClick: () => void;
  className?: string;
  variant?: 'icon' | 'pill';
}

export const AddToChatButton: React.FC<AddToChatButtonProps> = ({
  onClick,
  className,
  variant = 'icon',
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onClick();
  };

  if (variant === 'pill') {
    return (
      <button
        onClick={handleClick}
        className={[
          'opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0',
          'transition-[opacity,transform] duration-150 ease-out',
          'inline-flex items-center gap-1.5 h-7 pl-1.5 pr-2.5',
          'bg-white text-gray-900 text-xs font-medium',
          'rounded-full border border-gray-200/80',
          'shadow-[0_1px_2px_rgba(17,24,39,0.04),0_4px_12px_rgba(17,24,39,0.06)]',
          'hover:bg-gray-50 hover:border-gray-300 cursor-pointer whitespace-nowrap',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        title="Ask Von"
        aria-label="Ask Von about this widget"
      >
        <VonIcon variant="badge" size={14} />
        Ask Von
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
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
