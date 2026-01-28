import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CallSearchUnionResult, CallSearchResult, CallMatchSource } from './types';

export interface CallSearchUnionRendererProps {
  /** The call search union result to render */
  result: CallSearchUnionResult;
}

/**
 * Configuration for each match source type
 */
const SOURCE_CONFIG: Record<
  CallMatchSource,
  {
    label: string;
    color: string;
    bgColor: string;
    icon: string;
    description: string;
  }
> = {
  crm_account: {
    label: 'CRM Account',
    color: 'text-green-700',
    bgColor: 'bg-green-50 border-green-200',
    icon: '🎯',
    description: 'Direct match on Account CRM Object ID',
  },
  crm_opportunity: {
    label: 'CRM Opportunity',
    color: 'text-green-700',
    bgColor: 'bg-green-50 border-green-200',
    icon: '💼',
    description: 'Match on Opportunity CRM Object ID',
  },
  crm_contact: {
    label: 'CRM Contact',
    color: 'text-green-700',
    bgColor: 'bg-green-50 border-green-200',
    icon: '👤',
    description: 'Match on Contact CRM Object ID',
  },
  email_external: {
    label: 'Email',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50 border-blue-200',
    icon: '✉️',
    description: 'Matched by external speaker email',
  },
  email_internal: {
    label: 'Internal Email',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50 border-blue-200',
    icon: '📧',
    description: 'Matched by internal speaker email',
  },
  email_domain: {
    label: 'Domain',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50 border-blue-200',
    icon: '🌐',
    description: 'Matched by email domain',
  },
  company_name: {
    label: 'Company',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50 border-purple-200',
    icon: '🏢',
    description: 'Matched by company name',
  },
  name_fuzzy: {
    label: 'Name Match',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50 border-orange-200',
    icon: '🔍',
    description: 'Fuzzy match on speaker names',
  },
  job_title: {
    label: 'Job Title',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50 border-orange-200',
    icon: '💼',
    description: 'Matched by job title',
  },
  keyword: {
    label: 'Keyword',
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-50 border-indigo-200',
    icon: '🔑',
    description: 'Matched by keyword/topic/action item',
  },
  topic: {
    label: 'Topic',
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-50 border-indigo-200',
    icon: '📋',
    description: 'Matched by conversation topic',
  },
  content: {
    label: 'Content',
    color: 'text-gray-700',
    bgColor: 'bg-gray-50 border-gray-200',
    icon: '📝',
    description: 'Matched in title/description/summary',
  },
};

/**
 * Source badge component
 */
const SourceBadge: React.FC<{
  source: CallMatchSource;
  count?: number;
  showCount?: boolean;
}> = ({ source, count, showCount = true }) => {
  const config = SOURCE_CONFIG[source] || {
    label: source,
    color: 'text-gray-700',
    bgColor: 'bg-gray-50 border-gray-200',
    icon: '📌',
    description: source,
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.color} border`}
      title={config.description}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
      {showCount && count !== undefined && count > 0 && (
        <span className="font-semibold">({count})</span>
      )}
    </span>
  );
};

/**
 * Summary header showing total results and source badges
 */
const SummaryHeader: React.FC<{ result: CallSearchUnionResult }> = ({ result }) => {
  const sourceCounts = result.summary.by_source_counts;
  const activeSources = Object.entries(sourceCounts).filter(([, count]) => count && count > 0) as [
    CallMatchSource,
    number,
  ][];

  return (
    <div className="flex flex-col gap-2 bg-gray-50 rounded-lg p-3 border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900">
            {result.summary.total_results} Call
            {result.summary.total_results !== 1 ? 's' : ''} Found
          </h3>
          <p className="text-xs text-gray-600">
            Searched {activeSources.length} matching{' '}
            {activeSources.length === 1 ? 'strategy' : 'strategies'}
          </p>
        </div>
        {result.union_query.execution_time_ms && (
          <span className="text-xs text-gray-500">{result.union_query.execution_time_ms}ms</span>
        )}
      </div>
      {activeSources.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {activeSources.map(([source, count]) => (
            <SourceBadge key={source} source={source} count={count} />
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Deduplication notice
 */
const DeduplicationNotice: React.FC<{
  deduplication: CallSearchUnionResult['deduplication'];
}> = ({ deduplication }) => {
  if (deduplication.duplicates_merged === 0) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs">
      <span className="text-amber-600">ℹ️</span>
      <span className="text-amber-800">
        {deduplication.duplicates_merged} duplicate
        {deduplication.duplicates_merged !== 1 ? 's' : ''} merged (found by multiple strategies)
      </span>
    </div>
  );
};

/**
 * Format duration in minutes
 */
const formatDuration = (minutes?: number): string => {
  if (!minutes) return '';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

/**
 * Format speakers for display
 */
const formatSpeakers = (speakers?: string | string[]): string => {
  if (!speakers) return '';
  if (Array.isArray(speakers)) return speakers.join(', ');
  return speakers;
};

/**
 * Individual call result card
 */
const CallResultCard: React.FC<{
  call: CallSearchResult;
  isExpanded: boolean;
  onToggleExpand: () => void;
}> = ({ call, isExpanded, onToggleExpand }) => {
  const formattedDate = call.call_date
    ? new Date(call.call_date).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      {/* Card Header */}
      <div
        className="flex items-start justify-between p-3 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggleExpand}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h4 className="font-medium text-gray-900 text-sm truncate max-w-[300px]">
              {call.call_title || 'Untitled Call'}
            </h4>
            <SourceBadge source={call.match_info.source} showCount={false} />
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-600 flex-wrap">
            {formattedDate && <span>📅 {formattedDate}</span>}
            {call.duration_minutes && <span>⏱️ {formatDuration(call.duration_minutes)}</span>}
            {call.external_speakers && (
              <span
                className="truncate max-w-[200px]"
                title={formatSpeakers(call.external_speakers)}
              >
                👥 {formatSpeakers(call.external_speakers)}
              </span>
            )}
            {call.provider && <span className="text-gray-400 capitalize">{call.provider}</span>}
          </div>
        </div>
        <span className="text-gray-400 ml-2">{isExpanded ? '▴' : '▾'}</span>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-gray-100 overflow-hidden"
          >
            <div className="p-3 space-y-2 bg-gray-50 text-xs">
              {/* Match Reason */}
              <div>
                <span className="font-medium text-gray-700">Match: </span>
                <span className="text-gray-600">{call.match_info.match_reason}</span>
                {call.match_info.matched_value && (
                  <span className="ml-1 px-1.5 py-0.5 bg-gray-200 rounded font-mono text-xs">
                    {call.match_info.matched_value}
                  </span>
                )}
              </div>

              {/* Summary */}
              {call.summary && (
                <div>
                  <span className="font-medium text-gray-700">Summary: </span>
                  <span className="text-gray-600 line-clamp-3">{call.summary}</span>
                </div>
              )}

              {/* Topics */}
              {call.topics && call.topics.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {call.topics.slice(0, 5).map((topic, i) => (
                    <span
                      key={i}
                      className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded"
                    >
                      {topic}
                    </span>
                  ))}
                  {call.topics.length > 5 && (
                    <span className="text-gray-400">+{call.topics.length - 5} more</span>
                  )}
                </div>
              )}

              {/* Engagement Score */}
              {call.engagement_score !== undefined && (
                <div>
                  <span className="font-medium text-gray-700">Engagement: </span>
                  <span className="text-gray-600">{call.engagement_score.toFixed(0)}%</span>
                </div>
              )}

              {/* Deep Link */}
              {(call.deep_link || call.meeting_url) && (
                <a
                  href={call.deep_link || call.meeting_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800"
                  onClick={(e) => e.stopPropagation()}
                >
                  View Recording →
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * Unified results view
 */
const UnifiedResultsView: React.FC<{
  results: CallSearchResult[];
  expandedCallId: string | null;
  onExpandCall: (id: string | null) => void;
}> = ({ results, expandedCallId, onExpandCall }) => {
  if (results.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500 text-sm">
        No calls found matching the search criteria.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {results.map((call) => (
        <CallResultCard
          key={call.call_id}
          call={call}
          isExpanded={expandedCallId === call.call_id}
          onToggleExpand={() => onExpandCall(expandedCallId === call.call_id ? null : call.call_id)}
        />
      ))}
    </div>
  );
};

/**
 * Union query details (expandable)
 */
const UnionQueryDetails: React.FC<{
  unionQuery: CallSearchUnionResult['union_query'];
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ unionQuery, isExpanded, onToggle }) => (
  <div className="border border-gray-200 rounded-lg overflow-hidden">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
    >
      <div className="flex items-center gap-2">
        <span className="text-gray-600">🔍</span>
        <span className="font-medium text-gray-700 text-sm">Query Details</span>
        <span className="text-xs text-gray-500">
          ({unionQuery.components.length} queries, {unionQuery.execution_time_ms}
          ms)
        </span>
      </div>
      <span className="text-gray-400">{isExpanded ? '▴' : '▾'}</span>
    </button>

    <AnimatePresence>
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="p-3 space-y-3 text-xs">
            {/* Individual Query Components */}
            <div className="space-y-2">
              {unionQuery.components.map((component, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <SourceBadge source={component.source} showCount={false} />
                      <span className="text-gray-700">{component.label}</span>
                    </div>
                    <span className="text-gray-500">
                      {component.result_count} result
                      {component.result_count !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <pre className="font-mono bg-gray-100 p-2 rounded overflow-x-auto text-xs text-gray-600 whitespace-pre-wrap">
                    {component.query}
                  </pre>
                </div>
              ))}
            </div>

            {/* Combined SQL */}
            {unionQuery.combined_sql && (
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-1">Combined UNION Query</h5>
                <pre className="font-mono bg-gray-900 text-green-400 p-2 rounded overflow-x-auto text-xs max-h-48 whitespace-pre-wrap">
                  {unionQuery.combined_sql}
                </pre>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

/**
 * CallSearchUnionRenderer Component
 *
 * Displays comprehensive call search results with:
 * - Match source badges on each result
 * - Expandable union query details
 * - Deduplication summary
 */
export const CallSearchUnionRenderer: React.FC<CallSearchUnionRendererProps> = ({ result }) => {
  const [showQueryDetails, setShowQueryDetails] = useState(false);
  const [expandedCallId, setExpandedCallId] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {/* Summary Header */}
      <SummaryHeader result={result} />

      {/* Deduplication Notice */}
      <DeduplicationNotice deduplication={result.deduplication} />

      {/* Results Display */}
      <UnifiedResultsView
        results={result.results}
        expandedCallId={expandedCallId}
        onExpandCall={setExpandedCallId}
      />

      {/* Union Query Details (Expandable) */}
      <UnionQueryDetails
        unionQuery={result.union_query}
        isExpanded={showQueryDetails}
        onToggle={() => setShowQueryDetails(!showQueryDetails)}
      />
    </div>
  );
};

export default CallSearchUnionRenderer;
