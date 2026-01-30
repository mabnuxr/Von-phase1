import React, { useState, useRef, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowsOutIcon, DotsThreeIcon, GridFourIcon, XIcon } from '@phosphor-icons/react';
import { Streamdown } from 'streamdown';
import type { DeepResearchResultsProps } from './types';
import { ReportModal } from './ReportModal';

/**
 * DeepResearchResults Component
 *
 * Displays deep research results with streaming support and action buttons.
 * Uses Streamdown for markdown rendering with animation support.
 */
export const DeepResearchResults: React.FC<DeepResearchResultsProps> = ({
  state,
  title,
  showExpand = true,
  onExpand,
  onBuildDashboard,
  className = '',
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Derive display title from metadata or prop
  const displayTitle = title || state.metadata?.plan_name || 'Research Results';

  // Close menu when clicking outside
  useLayoutEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBuildDashboard = () => {
    onBuildDashboard?.();
    setShowMenu(false);
    setShowReportModal(false);
  };

  const handleExpand = () => {
    if (onExpand) {
      onExpand();
    } else {
      setShowReportModal(true);
    }
  };

  const isStreaming = state.status === 'streaming';
  const hasContent = state.content.length > 0;

  // Don't render if no content and not streaming
  if (!hasContent && !isStreaming) {
    return null;
  }

  return (
    <div
      className={`bg-white rounded-xl border border-gray-100 overflow-hidden hover:border-gray-200 transition-colors ${className}`}
    >
      {/* Header */}
      <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900">{displayTitle}</span>
          {isStreaming && (
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-gray-500">Streaming...</span>
            </span>
          )}
          {state.status === 'completed' && state.metadata?.status === 'partial_failure' && (
            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
              Partial
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {showExpand && (
            <button
              onClick={handleExpand}
              className="p-1.5 text-gray-800 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
              title="Expand"
            >
              <ArrowsOutIcon size={16} />
            </button>
          )}
          {onBuildDashboard && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 text-gray-800 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
              >
                <DotsThreeIcon size={16} weight="bold" />
              </button>
              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.1 }}
                    className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-sm border border-gray-100 py-1 z-50"
                  >
                    <button
                      onClick={handleBuildDashboard}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-[13px] text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer text-left"
                    >
                      <GridFourIcon size={14} className="text-gray-700" />
                      Build Dashboard
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Content - scrollable */}
      <div className="px-4 py-3 min-h-[100px] max-h-[50vh] overflow-y-auto">
        <div className="prose-sm markdown-body max-w-none">
          <Streamdown
            parseIncompleteMarkdown={isStreaming}
            isAnimating={isStreaming}
            controls={{ table: true }}
          >
            {state.content}
          </Streamdown>
        </div>
      </div>

      {/* Error state */}
      {state.status === 'error' && state.error && (
        <div className="px-4 py-3 bg-red-50 border-t border-red-100">
          <div className="flex items-start gap-2">
            <XIcon size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{state.error}</p>
          </div>
        </div>
      )}

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        title={displayTitle}
        content={state.content}
        onBuildDashboard={onBuildDashboard}
      />
    </div>
  );
};

export default DeepResearchResults;
