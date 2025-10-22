import React, { useState } from 'react';
import { Panel, Badge } from 'rsuite';
import { Streamdown } from 'streamdown';
import {
  DatabaseIcon,
  SearchIcon,
  CalculatorIcon,
  ToolIcon,
  LoaderIcon,
  CheckCircleIcon,
  XCircleIcon,
} from './icons';
import { ToolResultRenderer } from './ToolResultRenderer';
import type { ToolCall } from './types';

export interface ToolCallBlockProps {
  /**
   * Tool call to display
   */
  toolCall: ToolCall;

  /**
   * Whether this is the default expanded state
   * @default true
   */
  defaultExpanded?: boolean;
}

/**
 * Get appropriate icon for tool based on its name
 */
function getToolIcon(toolName: string, className?: string) {
  const iconClass = className || 'w-4 h-4';
  const lowerName = toolName.toLowerCase();

  if (lowerName.startsWith('sql_') || lowerName.includes('database')) {
    return <DatabaseIcon className={iconClass} />;
  }
  if (lowerName.startsWith('search_') || lowerName.includes('search')) {
    return <SearchIcon className={iconClass} />;
  }
  if (lowerName.startsWith('calculate_') || lowerName.includes('calc')) {
    return <CalculatorIcon className={iconClass} />;
  }

  return <ToolIcon className={iconClass} />;
}

/**
 * Status badge component
 */
function StatusBadge({ status }: { status: ToolCall['status'] }) {
  switch (status) {
    case 'running':
      return (
        <Badge
          content={
            <div className="flex items-center gap-1">
              <LoaderIcon className="w-3 h-3" />
              <span>Running</span>
            </div>
          }
          className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full"
        />
      );

    case 'success':
      return (
        <Badge
          content={
            <div className="flex items-center gap-1">
              <CheckCircleIcon className="w-3 h-3" />
              <span>Success</span>
            </div>
          }
          className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full"
        />
      );

    case 'error':
      return (
        <Badge
          content={
            <div className="flex items-center gap-1">
              <XCircleIcon className="w-3 h-3" />
              <span>Error</span>
            </div>
          }
          className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full"
        />
      );

    case 'pending':
    default:
      return (
        <Badge
          content="Pending"
          className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full"
        />
      );
  }
}

/**
 * ToolCallBlock component displays a tool invocation with arguments and results
 * Features collapsible UI, status indicators, and smart result rendering
 */
export const ToolCallBlock: React.FC<ToolCallBlockProps> = ({
  toolCall,
  defaultExpanded = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <Panel
      bordered
      collapsible
      expanded={isExpanded}
      onSelect={() => setIsExpanded(!isExpanded)}
      className="my-3 border-purple-200 bg-purple-50/20 hover:bg-purple-50/30 transition-colors"
      header={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            {/* Tool icon */}
            <div className="p-1.5 rounded-lg bg-purple-100">
              {getToolIcon(toolCall.name, 'w-4 h-4 text-purple-700')}
            </div>

            {/* Tool name */}
            <span className="font-medium text-purple-900 text-sm">{toolCall.name}</span>

            {/* Status badge */}
            <StatusBadge status={toolCall.status} />
          </div>

          {/* Execution time */}
          {toolCall.executionTime && (
            <span className="text-xs text-gray-500">{toolCall.executionTime}ms</span>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        {/* Arguments Section */}
        {Object.keys(toolCall.arguments).length > 0 && (
          <div>
            <div className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
              Arguments
            </div>
            <Streamdown parseIncompleteMarkdown={false}>
              {`\`\`\`json\n${JSON.stringify(toolCall.arguments, null, 2)}\n\`\`\``}
            </Streamdown>
          </div>
        )}

        {/* Result Section */}
        {toolCall.result && (
          <div>
            <div className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
              Result
            </div>
            <ToolResultRenderer result={toolCall.result} />
          </div>
        )}

        {/* Loading state */}
        {toolCall.status === 'running' && !toolCall.result && (
          <div className="flex items-center gap-2 text-sm text-gray-600 py-4">
            <LoaderIcon className="w-4 h-4" />
            <span>Executing...</span>
          </div>
        )}

        {/* Error state */}
        {toolCall.status === 'error' && !toolCall.result && (
          <div className="flex items-center gap-2 text-sm text-red-600 py-2 px-3 bg-red-50 rounded-md">
            <XCircleIcon className="w-4 h-4" />
            <span>Tool execution failed</span>
          </div>
        )}
      </div>
    </Panel>
  );
};

export default ToolCallBlock;
