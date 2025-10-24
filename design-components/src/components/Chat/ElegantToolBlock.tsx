import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EnhancedResultRenderer } from './EnhancedResultRenderer';
import { getToolDisplayInfo, generateToolSummary } from './utils/toolFormatting';
import {
  CheckCircleIcon,
  XCircleIcon,
  LoaderIcon,
  ClockIcon,
  ZapIcon,
  ChevronDownIcon,
} from './icons';
import type { ToolCall } from './types';

interface ElegantToolBlockProps {
  toolCall: ToolCall;
}

/**
 * World-class tool call block with professional design
 * - SVG icons (no emoji)
 * - Auto-expand on results, auto-collapse after 5s
 * - Smooth animations and gradients
 */
export const ElegantToolBlock: React.FC<ElegantToolBlockProps> = ({ toolCall }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [userManuallyExpanded, setUserManuallyExpanded] = useState(false);
  const autoCollapseTimer = useRef<NodeJS.Timeout | null>(null);

  const { name: displayName, IconComponent } = getToolDisplayInfo(toolCall.name);
  const toolArgs = toolCall.args || toolCall.arguments || {};
  const summary = generateToolSummary(toolCall.name, toolArgs);

  // Calculate execution time
  const executionTime =
    toolCall.startTime && toolCall.endTime
      ? ((toolCall.endTime - toolCall.startTime) / 1000).toFixed(1)
      : null;

  // Auto-expand when results arrive
  useEffect(() => {
    if (toolCall.result && toolCall.status === 'success' && !userManuallyExpanded) {
      setIsExpanded(true);

      // Auto-collapse after 5 seconds
      autoCollapseTimer.current = setTimeout(() => {
        if (!userManuallyExpanded) {
          setIsExpanded(false);
        }
      }, 5000);

      return () => {
        if (autoCollapseTimer.current) {
          clearTimeout(autoCollapseTimer.current);
        }
      };
    }
  }, [toolCall.result, toolCall.status, userManuallyExpanded]);

  // Manual toggle
  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    setUserManuallyExpanded(true);
    if (autoCollapseTimer.current) {
      clearTimeout(autoCollapseTimer.current);
    }
  };

  // Status-based styling
  const getStatusStyles = () => {
    switch (toolCall.status) {
      case 'running':
        return {
          border: 'border-purple-200',
          bg: 'bg-gradient-to-r from-purple-50 to-indigo-50',
          pulse: 'animate-pulse',
        };
      case 'success':
        return {
          border: 'border-emerald-200',
          bg: 'bg-gradient-to-r from-emerald-50 to-teal-50',
          pulse: '',
        };
      case 'error':
        return {
          border: 'border-rose-200',
          bg: 'bg-gradient-to-r from-rose-50 to-red-50',
          pulse: '',
        };
      default:
        return {
          border: 'border-slate-200',
          bg: 'bg-gradient-to-r from-slate-50 to-gray-50',
          pulse: '',
        };
    }
  };

  const statusStyles = getStatusStyles();

  // Get result preview for collapsed state
  const getResultPreview = () => {
    if (!toolCall.result) return null;

    switch (toolCall.result.type) {
      case 'values':
        return `${toolCall.result.values?.length || 0} values found`;
      case 'table':
        return `${toolCall.result.table?.rowCount || 0} rows returned`;
      case 'metrics':
        return `${toolCall.result.metrics?.length || 0} metrics`;
      default:
        return 'View result';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="my-2"
    >
      <div
        className={`
          rounded-xl border-2 ${statusStyles.border} ${statusStyles.bg}
          shadow-sm hover:shadow-lg transition-all duration-200 ease-out
          overflow-hidden
          ${statusStyles.pulse}
        `}
      >
        {/* Header */}
        <button
          onClick={handleToggle}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-black/5 transition-colors cursor-pointer"
        >
          {/* Left side: Icon, name, and summary */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <IconComponent className="flex-shrink-0 text-gray-700" size={20} />
            <div className="flex flex-col items-start min-w-0">
              <span className="text-sm font-semibold text-gray-900">{displayName}</span>
              {summary && (
                <span className="text-xs font-normal text-gray-600 truncate max-w-full">
                  {summary}
                </span>
              )}
              {/* Result preview when collapsed */}
              {!isExpanded && toolCall.result && (
                <span className="text-xs font-medium text-purple-600 mt-0.5">
                  {getResultPreview()}
                </span>
              )}
            </div>
          </div>

          {/* Right side: Status badge, execution time, chevron */}
          <div className="flex items-center gap-2 flex-shrink-0 ml-3">
            {executionTime && (
              <div className="flex items-center gap-1 text-gray-500">
                <ZapIcon className="text-amber-500" size={14} />
                <span className="text-xs font-mono tracking-tight">{executionTime}s</span>
              </div>
            )}
            <StatusBadge status={toolCall.status} />
            <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDownIcon className="text-gray-500" size={16} />
            </motion.div>
          </div>
        </button>

        {/* Expandable content */}
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <div className="px-5 py-4 border-t border-gray-200/50">
                {/* Arguments section - only show if arguments exist */}
                {toolArgs && Object.keys(toolArgs).length > 0 && (
                  <div className="mb-4 p-3 bg-gray-50/50 rounded-lg border border-gray-200/50">
                    <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                      Arguments
                    </div>
                    <dl className="space-y-1.5">
                      {Object.entries(toolArgs).map(([key, value]) => (
                        <div key={key} className="flex text-xs">
                          <dt className="font-medium text-gray-600 min-w-[120px] flex-shrink-0">
                            {formatArgKey(key)}:
                          </dt>
                          <dd className="text-gray-800 font-mono break-all">
                            {formatArgValue(value)}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}

                {/* Render the result beautifully */}
                {toolCall.result ? (
                  <EnhancedResultRenderer result={toolCall.result} />
                ) : toolCall.status === 'error' ? (
                  <div className="text-sm text-red-700 bg-red-100/50 p-4 rounded-lg border border-red-200 flex items-start gap-3">
                    <XCircleIcon className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
                    <div>
                      <div className="font-semibold mb-1">Execution Error</div>
                      <div className="text-xs">An error occurred while executing this tool</div>
                    </div>
                  </div>
                ) : null}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

/**
 * Professional status badge with SVG icons
 */
const StatusBadge: React.FC<{ status: ToolCall['status'] }> = ({ status }) => {
  const config = {
    pending: {
      label: 'Pending',
      className: 'bg-slate-100 text-slate-700 border-slate-300',
      Icon: ClockIcon,
    },
    running: {
      label: 'Running',
      className: 'bg-purple-100 text-purple-700 border-purple-300',
      Icon: LoaderIcon,
    },
    success: {
      label: 'Success',
      className: 'bg-emerald-100 text-emerald-700 border-emerald-300',
      Icon: CheckCircleIcon,
    },
    error: {
      label: 'Error',
      className: 'bg-rose-100 text-rose-700 border-rose-300',
      Icon: XCircleIcon,
    },
  };

  const { label, className, Icon } = config[status] || config.pending;

  return (
    <div
      className={`
        px-3 py-1.5 rounded-full text-xs font-medium border
        flex items-center gap-1.5 shadow-sm
        ${className}
      `}
    >
      <Icon size={12} />
      <span>{label}</span>
    </div>
  );
};

/**
 * Format argument key from snake_case to Title Case
 */
function formatArgKey(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

/**
 * Format argument value for display
 * Handles different types: strings, numbers, booleans, arrays, objects
 */
function formatArgValue(value: any): string {
  if (value === null || value === undefined) {
    return 'null';
  }

  if (typeof value === 'boolean') {
    return String(value);
  }

  if (typeof value === 'number') {
    return String(value);
  }

  if (typeof value === 'string') {
    // Truncate very long strings
    if (value.length > 150) {
      return value.substring(0, 147) + '...';
    }
    return value;
  }

  if (Array.isArray(value)) {
    return `[${value.length} items]`;
  }

  if (typeof value === 'object') {
    // Pretty print objects
    try {
      const json = JSON.stringify(value, null, 2);
      if (json.length > 150) {
        return JSON.stringify(value); // Single line if too long
      }
      return json;
    } catch {
      return '[Object]';
    }
  }

  return String(value);
}

export default ElegantToolBlock;
