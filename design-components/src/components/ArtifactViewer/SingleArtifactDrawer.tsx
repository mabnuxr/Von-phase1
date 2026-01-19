import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, DatabaseIcon } from '@phosphor-icons/react';
import { ArtifactContentViewer } from './components';
import type { QueryColumn } from '../TransparencyDrawer/types';
import { getToolDisplayName } from '../Chat/utils/toolNameFormatter';

// ============================================================================
// Types
// ============================================================================

export interface SingleArtifactDrawerProps {
  /** Whether the drawer is open */
  isOpen: boolean;
  /** Callback when the drawer should close */
  onClose: () => void;
  /** Tool name (used for title) */
  toolName: string;
  /** Artifact display name */
  name: string;
  /** Optional description */
  description?: string;
  /** SQL query string (if applicable) */
  query?: string;
  /** Column definitions for the data table */
  columns: QueryColumn[];
  /** Data rows */
  rows: Record<string, string | number>[];
  /** Query execution duration in ms */
  duration?: number;
  /** Whether the content is loading */
  isLoading?: boolean;
  /** Error message if loading failed */
  error?: string | null;
}

// ============================================================================
// Subcomponents
// ============================================================================

/**
 * DrawerBackdrop - Semi-transparent backdrop for drawer overlays
 */
const DrawerBackdrop = React.memo<{ onClose: () => void }>(({ onClose }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.2 }}
    className="fixed inset-0 bg-black/20 z-[9998]"
    onClick={onClose}
  />
));

DrawerBackdrop.displayName = 'DrawerBackdrop';

/**
 * LoadingState - Loading skeleton for the drawer content
 */
function LoadingState() {
  return (
    <div className="flex flex-col h-full">
      {/* Shimmer for SQL Section */}
      <div className="mx-4 mt-4 mb-3 rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-3 py-2 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-200 rounded animate-pulse" />
            <div className="w-16 h-3 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="w-10 h-3 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>

      {/* Shimmer for Query Info */}
      <div className="px-4 pb-2 flex items-center gap-2">
        <div className="w-4 h-4 bg-gray-200 rounded-full animate-pulse" />
        <div className="w-24 h-4 bg-gray-200 rounded animate-pulse" />
        <div className="w-32 h-3 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* Shimmer for Data Table */}
      <div className="flex-1 overflow-hidden mx-4 border border-gray-200 rounded-lg">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {[1, 2, 3, 4].map((i) => (
                <th key={i} className="px-3 py-2">
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-16" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((row) => (
              <tr key={row} className="border-b border-gray-100">
                {[1, 2, 3, 4].map((col) => (
                  <td key={col} className="px-3 py-2">
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Shimmer for Pagination */}
      <div className="px-4 py-3">
        <div className="w-32 h-3 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  );
}

/**
 * ErrorState - Error display for the drawer
 */
function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-6">
      <svg
        className="w-12 h-12 text-red-500 mb-4"
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
        <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <h4 className="text-lg font-semibold text-gray-900 mb-2">Failed to load artifact</h4>
      <p className="text-sm text-gray-600">{message}</p>
    </div>
  );
}

/**
 * EmptyState - Empty state when no data
 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-6">
      <DatabaseIcon size={48} weight="duotone" className="text-gray-300 mb-3" />
      <p className="text-sm text-gray-500">No data available</p>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * SingleArtifactDrawer - Drawer for displaying a single artifact
 *
 * Similar UI to TransparencyDrawer but without:
 * - Multiple artifact selection (pill tabs)
 * - Data/Calls tab navigation
 *
 * Used when clicking on artifact from thinking process steps.
 */
export const SingleArtifactDrawer: React.FC<SingleArtifactDrawerProps> = ({
  isOpen,
  onClose,
  toolName,
  name,
  description,
  query,
  columns,
  rows,
  duration,
  isLoading = false,
  error = null,
}) => {
  const displayTitle = getToolDisplayName(toolName);
  const hasData = columns.length > 0 && rows.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <DrawerBackdrop onClose={onClose} />

          {/* Drawer Wrapper - matches TransparencyDrawer styling */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed right-0 top-0 h-full w-[680px] max-w-[90vw] pr-2 py-2 z-[9999]"
          >
            {/* Inner Container */}
            <div className="h-full flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-50">
                    <DatabaseIcon size={18} weight="duotone" className="text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">{displayTitle}</h2>
                    {!isLoading && !error && hasData && (
                      <p className="text-xs text-gray-500">
                        {rows.length} {rows.length === 1 ? 'row' : 'rows'}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                >
                  <XIcon size={18} weight="bold" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-hidden flex flex-col">
                {isLoading ? (
                  <LoadingState />
                ) : error ? (
                  <ErrorState message={error} />
                ) : !hasData ? (
                  <EmptyState />
                ) : (
                  <ArtifactContentViewer
                    id={toolName}
                    name={name}
                    description={description}
                    query={query}
                    columns={columns}
                    rows={rows}
                    duration={duration}
                  />
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SingleArtifactDrawer;
