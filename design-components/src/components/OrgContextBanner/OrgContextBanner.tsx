import React from 'react';
import { X } from '@phosphor-icons/react';

export interface OrgContextBannerProps {
  /**
   * Callback when "View Org Context" is clicked
   */
  onViewOrgContext?: () => void;
  /**
   * Callback when dismiss is clicked
   */
  onDismiss?: () => void;
}

/**
 * Banner to display at top of chat empty state indicating org context is indexed
 */
export const OrgContextBanner: React.FC<OrgContextBannerProps> = ({
  onViewOrgContext,
  onDismiss,
}) => {
  return (
    <div
      className="relative flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-indigo-100"
      style={{
        background:
          'linear-gradient(135deg, rgba(255, 243, 235, 0.4) 0%, rgba(255, 144, 66, 0.15) 26%, rgba(133, 79, 255, 0.15) 100%)',
      }}
    >
      <div className="flex items-center gap-3">
        <span className="text-lg">🧠</span>
        <p className="text-sm text-gray-700">
          Von has indexed all your <span className="font-medium">Org Context</span>
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onViewOrgContext}
          className="px-3 py-1.5 text-xs font-medium text-indigo-700 bg-white/80 hover:bg-white border border-indigo-200 rounded-lg transition-colors cursor-pointer"
        >
          View Org Context
        </button>
        <button
          onClick={onDismiss}
          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded transition-colors cursor-pointer"
          aria-label="Dismiss"
        >
          <X size={16} weight="bold" />
        </button>
      </div>
    </div>
  );
};

export default OrgContextBanner;
