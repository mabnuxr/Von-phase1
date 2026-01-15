import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XIcon,
  TableIcon,
  CheckCircleIcon,
  CaretRightIcon,
  CaretDownIcon,
  DatabaseIcon,
  CaretLeftIcon,
  PhoneIcon,
  ClockIcon,
  UsersIcon,
  ArrowSquareOutIcon,
  SmileyIcon,
  SmileySadIcon,
  SmileyMehIcon,
} from '@phosphor-icons/react';

const ROWS_PER_PAGE = 10;

// ============================================================================
// Types
// ============================================================================

export interface QueryColumn {
  key: string;
  label: string;
  type?: 'string' | 'number' | 'currency' | 'date' | 'percentage';
}

export interface QueryResult {
  id: string;
  name: string;
  description?: string;
  query?: string;
  columns: QueryColumn[];
  rows: Record<string, string | number>[];
  executedAt?: Date;
  duration?: number; // in ms
}

export type SentimentType = 'positive' | 'negative' | 'neutral';

export interface CallTranscript {
  id: string;
  title: string;
  date: string;
  duration?: string;
  timeRange?: string;
  participants?: string[];
  sourceUrl?: string;
  accountName?: string;
  opportunityName?: string;
  sentiment?: SentimentType;
  summary?: string;
}

export type TopLevelTab = 'data' | 'calls';

export interface TransparencyDrawerProps {
  /**
   * Whether the drawer is open
   */
  isOpen: boolean;

  /**
   * Callback when the drawer should close
   */
  onClose: () => void;

  /**
   * List of query results to display in the Data tab
   */
  queries: QueryResult[];

  /**
   * List of call transcripts to display in the Calls tab
   */
  calls?: CallTranscript[];

  /**
   * Title of the drawer
   */
  title?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

const groupCallsByMonth = (calls: CallTranscript[]): Record<string, CallTranscript[]> => {
  const groups: Record<string, CallTranscript[]> = {};
  calls.forEach((call) => {
    const date = new Date(call.date);
    const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    if (!groups[monthYear]) {
      groups[monthYear] = [];
    }
    groups[monthYear].push(call);
  });
  return groups;
};

const getSentimentIcon = (sentiment?: SentimentType) => {
  switch (sentiment) {
    case 'positive':
      return <SmileyIcon size={14} weight="duotone" className="text-emerald-600" />;
    case 'negative':
      return <SmileySadIcon size={14} weight="duotone" className="text-red-500" />;
    case 'neutral':
    default:
      return <SmileyMehIcon size={14} weight="duotone" className="text-gray-500" />;
  }
};

const getSentimentLabel = (sentiment?: SentimentType) => {
  switch (sentiment) {
    case 'positive':
      return 'Positive';
    case 'negative':
      return 'Negative';
    case 'neutral':
    default:
      return 'Neutral';
  }
};

// ============================================================================
// Sub-components - Data Tab
// ============================================================================

interface QueryTabProps {
  query: QueryResult;
  isActive: boolean;
  onClick: () => void;
}

const QueryTab: React.FC<QueryTabProps> = ({ query, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-3 py-1.5 text-[13px] font-medium rounded-full
        transition-colors duration-150 cursor-pointer whitespace-nowrap border
        ${
          isActive
            ? 'bg-gray-900 text-white border-gray-900'
            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900'
        }
      `}
    >
      <TableIcon size={14} weight={isActive ? 'fill' : 'regular'} className={isActive ? 'text-white' : 'text-gray-500'} />
      <span className="truncate max-w-[120px]">{query.name}</span>
      <span className={`text-[11px] ${isActive ? 'text-gray-300' : 'text-gray-400'}`}>({query.rows.length})</span>
    </button>
  );
};

interface QueryContentProps {
  query: QueryResult;
}

const QueryContent: React.FC<QueryContentProps> = ({ query }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [isQueryExpanded, setIsQueryExpanded] = useState(false);

  const formatValue = (value: string | number, type?: QueryColumn['type']): string => {
    if (value === null || value === undefined) return '-';

    switch (type) {
      case 'currency':
        return typeof value === 'number'
          ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
          : String(value);
      case 'percentage':
        return typeof value === 'number' ? `${value.toFixed(1)}%` : String(value);
      case 'number':
        return typeof value === 'number'
          ? new Intl.NumberFormat('en-US').format(value)
          : String(value);
      case 'date':
        if (typeof value === 'string' || typeof value === 'number') {
          const date = new Date(value);
          return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
        }
        return String(value);
      default:
        return String(value);
    }
  };

  // Pagination
  const totalRows = query.rows.length;
  const totalPages = Math.ceil(totalRows / ROWS_PER_PAGE);
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const endIndex = Math.min(startIndex + ROWS_PER_PAGE, totalRows);
  const currentRows = query.rows.slice(startIndex, endIndex);

  return (
    <div className="flex flex-col h-full">
      {/* SQL Query Section - Collapsible, collapsed by default */}
      {query.query && (
        <div className="mx-4 mt-4 mb-3 rounded-lg border border-gray-200 overflow-hidden">
          <button
            onClick={() => setIsQueryExpanded(!isQueryExpanded)}
            className="w-full px-3 py-2 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              {isQueryExpanded ? (
                <CaretDownIcon size={12} weight="bold" className="text-gray-500" />
              ) : (
                <CaretRightIcon size={12} weight="bold" className="text-gray-500" />
              )}
              <span className="text-xs font-medium text-gray-700 uppercase tracking-wide">SQL Query</span>
            </div>
            {query.duration && (
              <span className="text-[11px] text-gray-500 tabular-nums">{query.duration}ms</span>
            )}
          </button>
          <AnimatePresence>
            {isQueryExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden border-t border-gray-200"
              >
                <pre className="px-3 py-3 text-xs text-gray-800 font-mono bg-white overflow-x-auto whitespace-pre-wrap leading-relaxed">
                  {query.query}
                </pre>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Query Info */}
      <div className="px-4 pb-2 flex items-center gap-2">
        <CheckCircleIcon size={14} weight="fill" className="text-emerald-600" />
        <span className="text-[13px] font-medium text-gray-900">{query.name}</span>
        {query.description && (
          <span className="text-[11px] text-gray-500">— {query.description}</span>
        )}
      </div>

      {/* Data Table */}
      <div className="flex-1 overflow-auto mx-4 border border-gray-200 rounded-lg">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="bg-gray-50 border-b border-gray-200">
              {query.columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap bg-gray-50 ${
                    col.type === 'number' || col.type === 'currency' || col.type === 'percentage'
                      ? 'text-right'
                      : ''
                  }`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentRows.map((row, rowIndex) => (
              <tr
                key={startIndex + rowIndex}
                className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors"
              >
                {query.columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-3 py-2 text-[13px] whitespace-nowrap ${
                      col.type === 'number' || col.type === 'currency' || col.type === 'percentage'
                        ? 'text-right tabular-nums'
                        : 'text-left'
                    } text-gray-700`}
                  >
                    {formatValue(row[col.key], col.type)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-4 py-3 flex items-center justify-between">
        <span className="text-[11px] text-gray-500">
          Showing {startIndex + 1}–{endIndex} of {totalRows} {totalRows === 1 ? 'row' : 'rows'}
        </span>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <CaretLeftIcon size={14} weight="bold" />
            </button>
            <span className="text-[11px] text-gray-600 px-2 tabular-nums">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <CaretRightIcon size={14} weight="bold" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// Sub-components - Calls Tab
// ============================================================================

interface CallsTabContentProps {
  calls: CallTranscript[];
}

const CallsTabContent: React.FC<CallsTabContentProps> = ({ calls }) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set([calls[0]?.id]));

  const toggleExpanded = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (calls.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <PhoneIcon size={48} weight="duotone" className="text-gray-300 mb-3" />
        <p className="text-sm text-gray-500">No call recordings available</p>
      </div>
    );
  }

  const grouped = groupCallsByMonth(calls);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      {Object.entries(grouped).map(([monthYear, monthCalls]) => (
        <div key={monthYear} className="mb-6 last:mb-0">
          {/* Month Header */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">{monthYear}</h3>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <PhoneIcon size={12} weight="regular" />
              <span>{monthCalls.length}</span>
            </div>
          </div>

          {/* Timeline Items */}
          <div className="relative">
            {monthCalls.map((call, idx) => {
              const isExpanded = expandedItems.has(call.id);
              const isLast = idx === monthCalls.length - 1;

              return (
                <div key={call.id} className="relative flex gap-3">
                  {/* Timeline line and icon */}
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => toggleExpanded(call.id)}
                      className={`
                        relative z-10 w-7 h-7 flex items-center justify-center rounded-full border bg-white
                        cursor-pointer transition-colors duration-150
                        ${isExpanded
                          ? 'border-indigo-300 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }
                      `}
                    >
                      <PhoneIcon
                        size={14}
                        weight={isExpanded ? 'duotone' : 'regular'}
                        className={isExpanded ? 'text-indigo-600' : 'text-gray-600'}
                      />
                    </button>
                    {!isLast && (
                      <div className="w-px flex-1 bg-gray-200 min-h-[16px]" />
                    )}
                  </div>

                  {/* Content */}
                  <div className={`flex-1 ${isLast ? 'pb-0' : 'pb-4'}`}>
                    {/* Header row */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900 flex-1 truncate">
                        {call.title}
                      </span>
                      {call.sourceUrl && (
                        <a
                          href={call.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-indigo-600 flex-shrink-0 transition-colors"
                        >
                          <ArrowSquareOutIcon size={14} />
                        </a>
                      )}
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {new Date(call.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>

                    {/* Expanded content */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.15 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-2">
                            {/* Time and Duration */}
                            {(call.timeRange || call.duration) && (
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <ClockIcon size={12} className="text-gray-500" />
                                <span>
                                  {call.timeRange && call.timeRange}
                                  {call.timeRange && call.duration && ' · '}
                                  {call.duration && call.duration}
                                </span>
                              </div>
                            )}

                            {/* Participants */}
                            {call.participants && call.participants.length > 0 && (
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <UsersIcon size={12} className="text-gray-500" />
                                <span>{call.participants.join(', ')}</span>
                              </div>
                            )}

                            {/* Account / Opportunity */}
                            {(call.accountName || call.opportunityName) && (
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <TableIcon size={12} className="text-gray-500" />
                                <span>
                                  {call.accountName}
                                  {call.accountName && call.opportunityName && ' · '}
                                  {call.opportunityName}
                                </span>
                              </div>
                            )}

                            {/* Sentiment */}
                            {call.sentiment && (
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                {getSentimentIcon(call.sentiment)}
                                <span>{getSentimentLabel(call.sentiment)} sentiment</span>
                              </div>
                            )}

                            {/* Summary */}
                            {call.summary && (
                              <div className="pt-2 mt-2 border-t border-gray-200">
                                <p className="text-xs text-gray-700 leading-relaxed">
                                  {call.summary}
                                </p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

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
  queries,
  calls = [],
  title = 'Sources',
}) => {
  const [activeTopTab, setActiveTopTab] = useState<TopLevelTab>('data');
  const [activeQueryId, setActiveQueryId] = useState<string>(queries[0]?.id || '');

  // Update active query when queries change
  React.useEffect(() => {
    if (queries.length > 0 && !queries.find(q => q.id === activeQueryId)) {
      setActiveQueryId(queries[0].id);
    }
  }, [queries, activeQueryId]);

  const activeQuery = queries.find(q => q.id === activeQueryId);

  const topTabs: { id: TopLevelTab; label: string; icon: React.ReactNode; count: number }[] = [
    {
      id: 'data',
      label: 'Data',
      icon: <DatabaseIcon size={14} weight="regular" />,
      count: queries.length,
    },
    {
      id: 'calls',
      label: 'Calls',
      icon: <PhoneIcon size={14} weight="regular" />,
      count: calls.length,
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/20 z-[9998]"
            onClick={onClose}
          />

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
                      {queries.length} {queries.length === 1 ? 'query' : 'queries'}, {calls.length} {calls.length === 1 ? 'call' : 'calls'}
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
                <div className="flex items-center gap-1">
                  {topTabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTopTab(tab.id)}
                      className={`
                        flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium
                        transition-colors duration-150 cursor-pointer
                        ${activeTopTab === tab.id
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}
                      `}
                    >
                      {tab.icon}
                      {tab.label}
                      {tab.count > 0 && (
                        <span className={`text-[11px] px-1.5 py-0.5 rounded-md ${
                          activeTopTab === tab.id
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {tab.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
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
                          <div className="flex items-center gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                            {queries.map((query) => (
                              <QueryTab
                                key={query.id}
                                query={query}
                                isActive={query.id === activeQueryId}
                                onClick={() => setActiveQueryId(query.id)}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Query Content */}
                      <div className="flex-1 overflow-hidden">
                        {queries.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full text-center p-6">
                            <DatabaseIcon size={48} weight="duotone" className="text-gray-300 mb-3" />
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
