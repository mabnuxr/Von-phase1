import { memo } from 'react';
import { ArrowDownIcon } from './icons';

interface ScrollToBottomButtonProps {
  onClick: () => void;
  visible: boolean;
}

export const ScrollToBottomButton = memo<ScrollToBottomButtonProps>(({ onClick, visible }) => (
  <div className="sticky bottom-4 flex justify-center pointer-events-none">
    <button
      onClick={onClick}
      className={`
        w-10 h-10 rounded-full
        bg-white border border-gray-200 shadow-sm
        flex items-center justify-center
        hover:bg-gray-50 hover:shadow-md
        transition-all duration-200
        cursor-pointer
        pointer-events-auto
        ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}
      `}
      aria-label="Scroll to bottom"
    >
      <ArrowDownIcon className="text-gray-600" size={20} />
    </button>
  </div>
));

ScrollToBottomButton.displayName = 'ScrollToBottomButton';
