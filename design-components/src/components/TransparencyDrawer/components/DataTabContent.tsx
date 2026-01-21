import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { DatabaseIcon } from '@phosphor-icons/react';
import type { DataTabContentProps } from '../types';
import { QueryTab } from './QueryTab';
import { QueryContent } from './QueryContent';

/**
 * DataTabContent - Renders the Data tab with query pill navigation and content
 *
 * Features:
 * - Pill-shaped navigation for multiple queries
 * - Expandable SQL query display
 * - Data table with pagination
 */
export const DataTabContent = React.memo<DataTabContentProps>(
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
          <DatabaseIcon size={48} weight="duotone" className="text-gray-300 mb-3" />
          <p className="text-sm text-gray-500">No data queries executed</p>
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
              <QueryTab
                key={query.id}
                query={query}
                isActive={query.id === activeQueryId}
                onClick={() => handleQuerySelect(query.id)}
              />
            ))}
          </div>
        </div>

        {/* Query Content */}
        <div className="flex-1 overflow-hidden">
          {activeQuery && (
            <motion.div
              key={activeQuery.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              <QueryContent query={activeQuery} />
            </motion.div>
          )}
        </div>
      </>
    );
  }
);

DataTabContent.displayName = 'DataTabContent';
