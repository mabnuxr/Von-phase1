import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  XIcon,
  DatabaseIcon,
  PhoneIcon,
  EnvelopeIcon,
  ChatCircleDotsIcon,
  Brain as BrainIcon,
} from '@phosphor-icons/react';
import { ArtifactContentViewer } from './components';
import { useHorizontalResize } from './hooks';
import type {
  QueryColumn,
  CallTranscript,
  EmailTranscript,
  SlackTranscript,
} from '../TransparencyDrawer/types';
import {
  CallsTabContent,
  EmailsTabContent,
  SlackTabContent,
} from '../TransparencyDrawer/components';
import { getToolDisplayName } from '../Chat/utils/toolNameFormatter';
import { MemoryResultRenderer } from '../Chat/MemoryResultRenderer';
import type { MemoryResultData } from '../Chat/types';
import { ReportTable, buildGridOptions } from '../ReportTable';
import type { ReportColumn } from '../ReportTable/ReportTable';

// ============================================================================
// Types
// ============================================================================

/** View mode for the artifact drawer */
export type ArtifactViewMode = 'data' | 'calls' | 'memory' | 'iq' | 'conversations';

/** Base props shared by all view modes */
interface BaseDrawerProps {
  /** Whether the drawer is open */
  isOpen: boolean;
  /** Callback when the drawer should close */
  onClose: () => void;
  /** Tool name (used for title fallback) */
  toolName: string;
  /** Human-readable query name (takes precedence over toolName for title) */
  queryName?: string;
  /** Whether the content is loading */
  isLoading?: boolean;
  /** Error message if loading failed */
  error?: string | null;
}

/** Props for data/table view mode */
export interface DataViewProps extends BaseDrawerProps {
  /** View mode: 'data' for table view */
  viewMode: 'data';
  /** SQL query string (if applicable) */
  query?: string;
  /** Column definitions for the data table */
  columns: QueryColumn[];
  /** Data rows */
  rows: Record<string, string | number>[];
  /** Query execution duration in ms */
  duration?: number;
  /** Called when the user downloads the query result as CSV */
  onCSVDownloaded?: (rowCount: number) => void;
}

/** Props for calls/timeline view mode */
export interface CallsViewProps extends BaseDrawerProps {
  /** View mode: 'calls' for timeline view */
  viewMode: 'calls';
  /** Call transcripts */
  calls: CallTranscript[];
}

/** Props for memory view mode */
export interface MemoryViewProps extends BaseDrawerProps {
  /** View mode: 'memory' for memory artifact view */
  viewMode: 'memory';
  /** Memory operation data */
  memoryData: MemoryResultData;
}

/** Props for IQ/Deep Research view mode */
export interface IQViewProps extends BaseDrawerProps {
  /** View mode: 'iq' for IQ artifact view with ReportTable */
  viewMode: 'iq';
  /** Column definitions for ReportTable */
  columns: ReportColumn[];
  /** Data rows */
  data: Record<string, unknown>[];
  /** Total row count */
  rowCount: number;
}

/** Props for conversations view mode - shows calls, emails, and Slack with tabs */
export interface ConversationsViewProps extends BaseDrawerProps {
  /** View mode: 'conversations' for tabbed calls + emails + slack view */
  viewMode: 'conversations';
  /** Call transcripts */
  calls: CallTranscript[];
  /** Email transcripts */
  emails: EmailTranscript[];
  /** Slack messages/threads. Omit or empty array when slack search isn't gated on. */
  slack?: SlackTranscript[];
}

/** Props for markdown view mode - renders agent-friendly markdown payloads (e.g. unwrapped MCP tool responses). */
export interface MarkdownViewProps extends BaseDrawerProps {
  viewMode: 'markdown';
  markdown: string;
}

/** Discriminated union: props depend on viewMode */
export type SingleArtifactDrawerProps =
  | DataViewProps
  | CallsViewProps
  | MemoryViewProps
  | IQViewProps
  | ConversationsViewProps
  | MarkdownViewProps;

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
    className="fixed inset-0 bg-black/20 z-9998"
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
 * CallsEmptyState - Empty state when no calls data
 */
function CallsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-6">
      <PhoneIcon size={48} weight="duotone" className="text-gray-300 mb-3" />
      <p className="text-sm text-gray-500">No call recordings available</p>
    </div>
  );
}

/**
 * SingleArtifactDrawer - Drawer for displaying a single artifact
 *
 * Supports two view modes:
 * - 'data': Table view for SQL queries and other data artifacts
 * - 'calls': Timeline view for RAG/conversation search artifacts
 *
 * Similar UI to TransparencyDrawer but without:
 * - Multiple artifact selection (pill tabs)
 * - Data/Calls tab navigation
 *
 * Used when clicking on artifact from thinking process steps.
 */
export const SingleArtifactDrawer: React.FC<SingleArtifactDrawerProps> = (props) => {
  const { isOpen, onClose, toolName, queryName, viewMode, isLoading = false, error = null } = props;

  // Tab state for conversations view
  const [activeTab, setActiveTab] = useState<'calls' | 'emails' | 'slack'>('calls');

  // Horizontal resize functionality - larger default for data tables
  const { width, handleProps } = useHorizontalResize({
    initialWidth: 800,
    minWidth: 500,
    storageKey: 'artifact-drawer-width',
  });

  // Use queryName if provided, otherwise fall back to tool display name
  const displayTitle = queryName || getToolDisplayName(toolName);
  const isCallsView = viewMode === 'calls';
  const isMemoryView = viewMode === 'memory';
  const isIQView = viewMode === 'iq';
  const isConversationsView = viewMode === 'conversations';
  const isMarkdownView = viewMode === 'markdown';

  // Slack pill visibility — only render when there's data to show. Hoisted to
  // component scope so the effect below can keep `activeTab` in sync; the
  // render branch reads the same value.
  const slackRowsForTab = isConversationsView
    ? ((props as ConversationsViewProps).slack ?? [])
    : [];
  const showSlackTab = slackRowsForTab.length > 0;

  // If the Slack pill disappears (e.g. on data refresh) while it's selected,
  // snap back to Calls so the visible content matches the highlighted pill.
  useEffect(() => {
    if (!showSlackTab && activeTab === 'slack') {
      setActiveTab('calls');
    }
  }, [showSlackTab, activeTab]);

  // Determine if there's data based on view mode
  const hasData = isConversationsView
    ? ((props as ConversationsViewProps).calls?.length ?? 0) > 0 ||
      ((props as ConversationsViewProps).emails?.length ?? 0) > 0 ||
      ((props as ConversationsViewProps).slack?.length ?? 0) > 0
    : isCallsView
      ? ((props as CallsViewProps).calls?.length ?? 0) > 0
      : isMemoryView
        ? true // Memory always has data if we got here
        : isMarkdownView
          ? ((props as MarkdownViewProps).markdown?.length ?? 0) > 0
          : isIQView
            ? ((props as IQViewProps).data?.length ?? 0) > 0
            : ((props as DataViewProps).rows?.length ?? 0) > 0;

  // Header icon based on view mode
  const HeaderIcon = isMemoryView ? BrainIcon : isCallsView ? PhoneIcon : DatabaseIcon;

  // Memoize grid options for IQ view to avoid rebuilding on every render
  const iqColumns = isIQView ? (props as IQViewProps).columns : undefined;
  const iqData = isIQView ? (props as IQViewProps).data : undefined;
  const iqGridOptions = useMemo(
    () =>
      iqColumns && iqData
        ? buildGridOptions(iqColumns, iqData, { pageSize: 10, showPagination: true })
        : null,
    [iqColumns, iqData]
  );

  // Render content based on view mode
  const renderContent = () => {
    if (isLoading) {
      return <LoadingState />;
    }

    // For data view with error, still show query but with error message in table area
    if (error && !isCallsView && !isMemoryView && !isIQView) {
      const { query, duration } = props as DataViewProps;
      return (
        <ArtifactContentViewer
          query={query}
          columns={[]}
          rows={[]}
          duration={duration}
          errorMessage={error}
        />
      );
    }

    if (error) {
      return <ErrorState message={error} />;
    }

    // For calls and IQ views, show empty state if no data
    // For data view, let ArtifactContentViewer handle empty state (it shows the query section)
    if (!hasData) {
      if (isCallsView) {
        return <CallsEmptyState />;
      }
      if (isIQView) {
        return <EmptyState />;
      }
      // For data view, fall through to ArtifactContentViewer which handles empty state with query
    }

    if (isMemoryView) {
      const { memoryData } = props as MemoryViewProps;
      return (
        <div className="p-4 overflow-auto flex-1 min-h-0">
          <MemoryResultRenderer result={{ type: 'memory', memory: memoryData, raw: {} }} />
        </div>
      );
    }

    if (isMarkdownView) {
      const { markdown } = props as MarkdownViewProps;
      return (
        <div className="p-4 overflow-auto flex-1 min-h-0">
          <div className="markdown-content text-sm text-gray-900 leading-relaxed">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
          </div>
        </div>
      );
    }

    if (isConversationsView) {
      const { calls, emails } = props as ConversationsViewProps;
      const slackRows = slackRowsForTab;
      return (
        <div className="flex flex-col h-full">
          {/* Pill Tabs */}
          <div className="flex gap-2 px-4 pt-4 pb-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('calls')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeTab === 'calls'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <PhoneIcon size={14} weight="regular" className="inline mr-1.5" />
              Calls ({calls.length})
            </button>
            <button
              onClick={() => setActiveTab('emails')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeTab === 'emails'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <EnvelopeIcon size={14} weight="regular" className="inline mr-1.5" />
              Emails ({emails.length})
            </button>
            {showSlackTab && (
              <button
                onClick={() => setActiveTab('slack')}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeTab === 'slack'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <ChatCircleDotsIcon size={14} weight="regular" className="inline mr-1.5" />
                Slack ({slackRows.length})
              </button>
            )}
          </div>

          {/* Tab Content */}
          <div className="flex-1 min-h-0">
            {activeTab === 'slack' && showSlackTab ? (
              <SlackTabContent slack={slackRows} />
            ) : activeTab === 'emails' ? (
              <EmailsTabContent emails={emails} />
            ) : (
              <CallsTabContent calls={calls} />
            )}
          </div>
        </div>
      );
    }

    if (isCallsView) {
      const { calls } = props as CallsViewProps;
      return <CallsTabContent calls={calls} />;
    }

    if (isIQView && iqGridOptions) {
      return (
        <div className="flex-1 min-h-0 p-4 overflow-auto">
          <ReportTable options={iqGridOptions} />
        </div>
      );
    }

    const { query, columns, rows, duration, onCSVDownloaded } = props as DataViewProps;
    return (
      <ArtifactContentViewer
        query={query}
        columns={columns}
        rows={rows}
        duration={duration}
        onCSVDownloaded={onCSVDownloaded}
      />
    );
  };

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
            style={{ width: `${width}px` }}
            className="fixed right-0 top-0 h-full max-w-[90vw] pr-2 py-2 z-9999"
          >
            {/* Resize Handle - transparent, wider hit area for easier dragging */}
            <div
              {...handleProps}
              className="absolute left-0 top-0 bottom-0 w-3 z-10 cursor-ew-resize"
            />

            {/* Inner Container */}
            <div className="h-full flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-50">
                    <HeaderIcon size={18} weight="duotone" className="text-indigo-600" />
                  </div>
                  <h2 className="text-base font-semibold text-gray-900">{displayTitle}</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                >
                  <XIcon size={18} weight="bold" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 min-h-0 flex flex-col">{renderContent()}</div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SingleArtifactDrawer;
