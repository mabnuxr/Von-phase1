import React, { useState } from 'react';
import { Streamdown } from 'streamdown';
import { CopyIcon, CheckCircleIcon, ChevronDownIcon } from './icons';

export interface JsonBlockProps {
  /**
   * JSON data to display
   */
  data: unknown;

  /**
   * Optional label for the JSON block
   * @default 'JSON Response'
   */
  label?: string;
}

/**
 * JsonBlock component for displaying formatted JSON with syntax highlighting
 * Uses Streamdown for beautiful code highlighting
 */
export const JsonBlock: React.FC<JsonBlockProps> = ({ data, label = 'JSON Response' }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const jsonString = JSON.stringify(data, null, 2);
  const isLarge = jsonString.length > 500;

  const copyJson = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex justify-between items-center">
        <span className="text-xs font-medium text-gray-600">{label}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={copyJson}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title="Copy JSON"
          >
            {copied ? (
              <CheckCircleIcon className="w-3.5 h-3.5 text-green-600" />
            ) : (
              <CopyIcon className="w-3.5 h-3.5 text-gray-500" />
            )}
          </button>
          {isLarge && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              <ChevronDownIcon
                className={`w-4 h-4 text-gray-400 transition-transform ${
                  isExpanded ? 'rotate-180' : ''
                }`}
              />
            </button>
          )}
        </div>
      </div>

      {/* JSON content */}
      <div className={isLarge && !isExpanded ? 'relative' : ''}>
        <div className={isLarge && !isExpanded ? 'max-h-48 overflow-hidden' : ''}>
          <Streamdown parseIncompleteMarkdown={false}>
            {`\`\`\`json\n${jsonString}\n\`\`\``}
          </Streamdown>
        </div>

        {/* Expand prompt for large JSON */}
        {isLarge && !isExpanded && (
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white via-white/80 to-transparent flex items-end justify-center pb-3">
            <button
              onClick={() => setIsExpanded(true)}
              className="text-xs text-purple-600 hover:text-purple-700 font-medium px-3 py-1.5 bg-white rounded-md shadow-sm border border-gray-200 hover:border-purple-300 transition-colors"
            >
              Show full JSON
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default JsonBlock;
