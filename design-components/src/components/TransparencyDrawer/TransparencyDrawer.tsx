import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, DatabaseIcon, PhoneIcon } from '@phosphor-icons/react';
import type { TransparencyDrawerProps, TopLevelTab, TabConfig } from './types';
import {
  DrawerBackdrop,
  QueryTab,
  QueryContent,
  CallsTabContent,
  TabNavigation,
} from './components';

// ============================================================================
// Main Component
// ============================================================================

/**
 * TransparencyDrawer - Shows the data sources and call recordings used by the AI
 *
 * Features:
 * - Slide-in drawer from the right
 * - Two top-level tabs: Data and Calls
 * - Data tab: Pill-shaped navigation for query results with expandable SQL and tables
 * - Calls tab: Timeline view of call recordings with expandable details
 */
export const TransparencyDrawer: React.FC<TransparencyDrawerProps> = ({
  isOpen,
  onClose,
  queries = [],
  calls = [],
  title = 'Sources',
  isLoading = false,
  onQuerySelect,
}) => {
  const [activeTopTab, setActiveTopTab] = useState<TopLevelTab>('data');
  const [activeQueryId, setActiveQueryId] = useState<string>(queries[0]?.id || '');

  // Update active query when queries change
  useEffect(() => {
    if (queries.length > 0 && !queries.find((q) => q.id === activeQueryId)) {
      setActiveQueryId(queries[0].id);
    }
  }, [queries, activeQueryId]);

  const activeQuery = useMemo(
    () => queries.find((q) => q.id === activeQueryId),
    [queries, activeQueryId]
  );

  const topTabs: TabConfig[] = useMemo(
    () => [
      {
        id: 'data' as TopLevelTab,
        label: 'Data',
        icon: <DatabaseIcon size={14} weight="regular" />,
        count: queries.length,
      },
      {
        id: 'calls' as TopLevelTab,
        label: 'Calls',
        icon: <PhoneIcon size={14} weight="regular" />,
        count: calls.length,
      },
    ],
    [queries.length, calls.length]
  );

  const handleTabChange = useCallback((tab: TopLevelTab) => {
    setActiveTopTab(tab);
  }, []);

  const handleQuerySelect = useCallback(
    (queryId: string) => {
      setActiveQueryId(queryId);
      // Notify parent for lazy loading
      onQuerySelect?.(queryId);
    },
    [onQuerySelect]
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <DrawerBackdrop onClose={onClose} />

          {/* Drawer Wrapper - with margins like SidePane */}
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
                    <h2 className="text-base font-semibold text-gray-900">{title}</h2>
                    <p className="text-xs text-gray-500">
                      {queries.length} {queries.length === 1 ? 'query' : 'queries'}, {calls.length}{' '}
                      {calls.length === 1 ? 'call' : 'calls'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                >
                  <XIcon size={18} weight="bold" />
                </button>
              </div>

              {/* Top-Level Tab Navigation */}
              <div className="px-5 py-3 border-b border-gray-100 shrink-0">
                <TabNavigation
                  tabs={topTabs}
                  activeTab={activeTopTab}
                  onTabChange={handleTabChange}
                />
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-hidden flex flex-col">
                <AnimatePresence mode="wait">
                  {activeTopTab === 'data' && (
                    <motion.div
                      key="data"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.15 }}
                      className="flex-1 flex flex-col overflow-hidden"
                    >
                      {/* Query Pills Navigation */}
                      {queries.length > 0 && (
                        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 shrink-0">
                          <div
                            className="flex items-center gap-2 overflow-x-auto"
                            style={{ scrollbarWidth: 'none' }}
                          >
                            {queries.map((query) => (
                              <QueryTab
                                key={query.id}
                                query={query}
                                isActive={query.id === activeQueryId}
                                onClick={() => handleQuerySelect(query.id)}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Query Content */}
                      <div className="flex-1 overflow-hidden">
                        {isLoading ? (
                          <div className="flex flex-col h-full">
                            {/* Shimmer for Query Pills */}
                            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50">
                              <div className="flex items-center gap-2">
                                {[1, 2, 3].map((i) => (
                                  <div
                                    key={i}
                                    className="h-7 bg-gray-200 rounded-full animate-pulse"
                                    style={{ width: `${60 + i * 20}px` }}
                                  />
                                ))}
                              </div>
                            </div>

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
                        ) : queries.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full text-center p-6">
                            <DatabaseIcon
                              size={48}
                              weight="duotone"
                              className="text-gray-300 mb-3"
                            />
                            <p className="text-sm text-gray-500">No data queries executed</p>
                          </div>
                        ) : activeQuery ? (
                          <motion.div
                            key={activeQuery.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.15 }}
                            className="h-full"
                          >
                            <QueryContent query={activeQuery} />
                          </motion.div>
                        ) : null}
                      </div>
                    </motion.div>
                  )}

                  {activeTopTab === 'calls' && (
                    <motion.div
                      key="calls"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.15 }}
                      className="flex-1 overflow-hidden"
                    >
                      <CallsTabContent calls={calls} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default TransparencyDrawer;
