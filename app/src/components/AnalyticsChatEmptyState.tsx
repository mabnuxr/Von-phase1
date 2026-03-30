/**
 * AnalyticsChatEmptyState - Simple empty state for the analytics chat panel.
 * Shows a muted Von logo icon and "Start a conversation" prompt.
 * Used as ChatSession.EmptyState override in the dashboard chat pane.
 */

export function AnalyticsChatEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-8">
      <div className="text-gray-300 mb-2">
        <svg
          width="48"
          height="48"
          viewBox="0 0 28 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0 8C0 3.58172 3.58172 0 8 0H20C24.4183 0 28 3.58172 28 8V20C28 24.4183 24.4183 28 20 28H8C3.58172 28 0 24.4183 0 20V8Z"
            fill="currentColor"
          />
          <path
            d="M15.937 11.1501C17.7702 12.4452 19.151 13.9556 19.9152 15.3235C20.7057 16.7385 20.7316 17.7813 20.3233 18.3594C19.9149 18.9375 18.9234 19.2616 17.3256 18.9894C15.7809 18.7262 13.8959 17.9296 12.0627 16.6345C10.2294 15.3394 8.84791 13.8285 8.08365 12.4605C7.29337 11.0458 7.26805 10.0032 7.67638 9.42519C8.08475 8.84721 9.07582 8.52262 10.6733 8.7947C12.2181 9.05788 14.1037 9.855 15.937 11.1501Z"
            stroke="white"
            strokeWidth="1.33"
          />
          <circle
            cx="13.9932"
            cy="14"
            r="7.835"
            stroke="white"
            strokeWidth="1.33"
          />
        </svg>
      </div>
      <p className="text-sm text-gray-500">Start a conversation</p>
    </div>
  );
}
