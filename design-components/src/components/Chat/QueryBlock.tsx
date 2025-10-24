import React, { useState } from 'react';
import { Streamdown } from 'streamdown';
import { CopyIcon, CheckCircleIcon, ChevronDownIcon } from './icons';
import type { QueryInfo } from './types';

export interface QueryBlockProps {
  /**
   * Queries to display
   */
  queries: QueryInfo[];
}

/**
 * QueryBlock component for displaying SQL queries with syntax highlighting
 * Uses Streamdown for beautiful code highlighting
 */
export const QueryBlock: React.FC<QueryBlockProps> = ({ queries }) => {
  const [expandedQueries, setExpandedQueries] = useState<Set<number>>(new Set());
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const toggleQuery = (index: number) => {
    setExpandedQueries((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const copyQuery = (statement: string, index: number) => {
    navigator.clipboard.writeText(statement);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (!queries || queries.length === 0) {
    return null;
  }

  return (
    <div className="border-t border-gray-200">
      {queries.map((query, idx) => (
        <div key={idx} className="bg-gray-50/50">
          {/* Query header - clickable to expand/collapse */}
          <button
            onClick={() => toggleQuery(idx)}
            className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-purple-700">{query.label || 'Query'}</span>
              <span className="text-xs text-gray-500 px-2 py-0.5 rounded bg-gray-200 font-mono">
                {query.dialect}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  copyQuery(query.statement, idx);
                }}
                className="p-1 hover:bg-gray-200 rounded transition-colors cursor-pointer"
                title="Copy query"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    copyQuery(query.statement, idx);
                  }
                }}
              >
                {copiedIndex === idx ? (
                  <CheckCircleIcon className="w-3.5 h-3.5 text-green-600" />
                ) : (
                  <CopyIcon className="w-3.5 h-3.5 text-gray-500" />
                )}
              </div>
              <ChevronDownIcon
                className={`w-4 h-4 text-gray-400 transition-transform ${
                  expandedQueries.has(idx) ? 'rotate-180' : ''
                }`}
              />
            </div>
          </button>

          {/* Query content - collapsible */}
          {expandedQueries.has(idx) && (
            <div className="px-3 pb-3">
              <Streamdown parseIncompleteMarkdown={false}>
                {`\`\`\`${query.dialect}\n${query.statement}\n\`\`\``}
              </Streamdown>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default QueryBlock;
