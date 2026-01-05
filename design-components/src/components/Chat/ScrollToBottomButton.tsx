import { memo } from 'react';
import { ArrowDownIcon } from './icons';

interface ScrollToBottomButtonProps {
  onClick: () => void;
  visible: boolean;
}

export const ScrollToBottomButton = memo<ScrollToBottomButtonProps>(({ onClick, visible }) => (
  <button
    onClick={onClick}
    className={`
        absolute bottom-24 left-1/2 -translate-x-1/2 z-10
        w-10 h-10 rounded-full
        bg-white border border-gray-200 shadow-sm
        flex items-center justify-center
        hover:bg-gray-50 hover:shadow-md
        transition-all duration-200
        cursor-pointer
        ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}
      `}
    aria-label="Scroll to bottom"
  >
    <ArrowDownIcon className="text-gray-600" size={20} />
  </button>
));

ScrollToBottomButton.displayName = 'ScrollToBottomButton';
