import React, { useState } from 'react';
import { Streamdown } from 'streamdown';

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
export const JsonBlock: React.FC<JsonBlockProps> = ({ data }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const jsonString = JSON.stringify(data, null, 2);
  const isLarge = jsonString.length > 500;

  return (
    <div className="my-3 overflow-hidden">
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
