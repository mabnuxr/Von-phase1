import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MagnifyingGlass as MagnifyingGlassIcon } from '@phosphor-icons/react';
import { ReportTable } from '../../ReportTable';
import type { ReportColumn } from '../../ReportTable/ReportTable';

/**
 * IQ Query result for Deep Research tab
 * Uses ReportColumn (with AI column support) instead of QueryColumn
 */
export interface IQQueryResult {
  id: string;
  name: string;
  description?: string;
  columns: ReportColumn[];
  data: Record<string, unknown>[];
  rowCount: number;
}

export interface IQDataTabContentProps {
  queries: IQQueryResult[];
  activeQueryId?: string;
  onQuerySelect?: (queryId: string) => void;
}

/**
 * IQQueryTab - Tab button for IQ query selection
 */
const IQQueryTab = React.memo<{
  query: IQQueryResult;
  isActive: boolean;
  onClick: () => void;
}>(({ query, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`
      flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium
      whitespace-nowrap transition-colors shrink-0 cursor-pointer
      ${
        isActive
          ? 'bg-gray-900 text-white'
          : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
      }
    `}
  >
    <span>{query.name}</span>
    {query.description && (
      <span className={isActive ? 'text-gray-300' : 'text-gray-400'}>{query.description}</span>
    )}
  </button>
));

IQQueryTab.displayName = 'IQQueryTab';

/**
 * IQDataTabContent - Renders the Deep Research tab with IQ artifacts
 *
 * Features:
 * - Pill-shaped navigation for multiple IQ results
 * - ReportTable display with AI column styling
 * - All columns marked as AI-generated
 */
export const IQDataTabContent = React.memo<IQDataTabContentProps>(
  ({ queries, activeQueryId: controlledActiveQueryId, onQuerySelect }) => {
    // Support both controlled and uncontrolled modes
    const [internalActiveQueryId, setInternalActiveQueryId] = useState<string>(
      queries[0]?.id || ''
    );

    const activeQueryId = controlledActiveQueryId ?? internalActiveQueryId;

    // Update internal state when queries change and current selection is invalid
    useEffect(() => {
      if (queries.length > 0 && !queries.find((q) => q.id === activeQueryId)) {
        const newId = queries[0].id;
        setInternalActiveQueryId(newId);
        if (controlledActiveQueryId === undefined) {
          onQuerySelect?.(newId);
        }
      }
    }, [queries, activeQueryId, controlledActiveQueryId, onQuerySelect]);

    const activeQuery = useMemo(
      () => queries.find((q) => q.id === activeQueryId),
      [queries, activeQueryId]
    );

    const handleQuerySelect = useCallback(
      (queryId: string) => {
        if (controlledActiveQueryId === undefined) {
          setInternalActiveQueryId(queryId);
        }
        onQuerySelect?.(queryId);
      },
      [controlledActiveQueryId, onQuerySelect]
    );

    // Empty state
    if (queries.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-6">
          <MagnifyingGlassIcon size={48} weight="duotone" className="text-gray-300 mb-3" />
          <p className="text-sm text-gray-500">No deep research results</p>
        </div>
      );
    }

    return (
      <>
        {/* Query Pills Navigation */}
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 shrink-0">
          <div
            className="flex items-center gap-2 overflow-x-auto"
            style={{ scrollbarWidth: 'none' }}
          >
            {queries.map((query) => (
              <IQQueryTab
                key={query.id}
                query={query}
                isActive={query.id === activeQueryId}
                onClick={() => handleQuerySelect(query.id)}
              />
            ))}
          </div>
        </div>

        {/* Query Content - ReportTable with AI columns */}
        <div className="flex-1 overflow-hidden">
          {activeQuery && (
            <motion.div
              key={activeQuery.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
              className="h-full p-4 overflow-auto"
            >
              <ReportTable
                columns={activeQuery.columns}
                data={activeQuery.data}
                pageSize={10}
                showPagination={true}
                aiReasoningKey="_aiReasoning"
                showRowActions={false}
                frozenColumns={1}
              />
            </motion.div>
          )}
        </div>
      </>
    );
  }
);

IQDataTabContent.displayName = 'IQDataTabContent';
