import React from 'react';
import { CheckCircle, XCircle, Brain } from '@phosphor-icons/react';
import { Streamdown } from 'streamdown';
import type { ToolResult } from './types';

interface MemoryResultRendererProps {
  result: ToolResult;
}

export const MemoryResultRenderer: React.FC<MemoryResultRendererProps> = ({ result }) => {
  if (!result.memory) return null;

  const { operation, success, key, value, char_count, appended, error } = result.memory;

  // Operation labels
  const operationLabels = {
    retrieve: 'Retrieved',
    save: 'Saved',
    update: appended ? 'Appended to' : 'Updated',
  };

  const operationLabel = operationLabels[operation];
  const Icon = success ? CheckCircle : XCircle;
  const iconColor = success ? 'text-gray-500' : 'text-red-600';

  return (
    <div className="mb-4 space-y-4">
      {/* Header with operation type */}
      <div className="flex items-center gap-2 mb-3">
        <Brain className="text-purple-600" size={16} weight="duotone" />
        <span className="text-sm font-medium text-gray-700">{operationLabel} Memory</span>
        <Icon className={iconColor} size={14} weight="fill" />
      </div>

      {/* Key name */}
      <div className="pl-6">
        <div className="text-sm font-semibold text-gray-900">{key}</div>
      </div>

      {/* Value (for retrieve operation) */}
      {success && operation === 'retrieve' && value && (
        <div className="pl-6 space-y-2">
          <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
            <div className="text-sm [&>*]:text-sm [&>*]:leading-relaxed">
              <Streamdown parseIncompleteMarkdown={false}>{value}</Streamdown>
            </div>
          </div>
          {char_count !== undefined && (
            <div className="flex justify-end">
              <span className="text-xs text-gray-500">
                {char_count.toLocaleString()} characters
              </span>
            </div>
          )}
        </div>
      )}

      {/* Success confirmation (for save/update) - show value content */}
      {success && operation !== 'retrieve' && value && (
        <div className="pl-6 space-y-2">
          <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
            <div className="text-sm [&>*]:text-sm [&>*]:leading-relaxed">
              <Streamdown parseIncompleteMarkdown={true}>{value}</Streamdown>
            </div>
          </div>
          {char_count !== undefined && (
            <div className="flex justify-end">
              <span className="text-xs text-gray-500">
                {char_count.toLocaleString()} characters
              </span>
            </div>
          )}
        </div>
      )}

      {/* Error message */}
      {!success && error && (
        <div className="pl-6 flex items-center gap-2 text-sm text-red-700">
          <XCircle className="text-red-600 flex-shrink-0" size={14} weight="fill" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default MemoryResultRenderer;
