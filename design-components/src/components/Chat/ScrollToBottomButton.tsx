import { memo } from 'react';

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
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      className="text-gray-600"
    >
      <path
        d="M12 5v14M5 12l7 7 7-7"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </button>
));

ScrollToBottomButton.displayName = 'ScrollToBottomButton';
