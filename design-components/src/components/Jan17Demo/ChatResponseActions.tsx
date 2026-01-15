import React, { useState } from 'react';
import { ThumbsUpIcon, DownloadSimpleIcon, GitBranchIcon, CopyIcon, CheckIcon } from '@phosphor-icons/react';

export interface ChatResponseActionsProps {
  /**
   * Callback when upvote is clicked
   */
  onUpvote?: () => void;

  /**
   * Callback when download is clicked
   */
  onDownload?: () => void;

  /**
   * Callback when transparency (git branch) button is clicked
   */
  onTransparencyClick?: () => void;

  /**
   * Callback when copy is clicked
   */
  onCopy?: () => void;

  /**
   * Whether the response is upvoted
   */
  isUpvoted?: boolean;

  /**
   * Whether to show the copy button
   */
  showCopy?: boolean;

  /**
   * Whether to show the download button
   */
  showDownload?: boolean;

  /**
   * Whether to show the transparency button
   */
  showTransparency?: boolean;
}

/**
 * ChatResponseActions - Action buttons below a chat response
 *
 * Features:
 * - Upvote button (toggleable)
 * - Download button
 * - Transparency button (git branch icon) for viewing data sources
 * - Copy button with success state
 */
export const ChatResponseActions: React.FC<ChatResponseActionsProps> = ({
  onUpvote,
  onDownload,
  onTransparencyClick,
  onCopy,
  isUpvoted = false,
  showCopy = true,
  showDownload = true,
  showTransparency = true,
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const [internalUpvoted, setInternalUpvoted] = useState(isUpvoted);

  const handleCopy = () => {
    onCopy?.();
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleUpvote = () => {
    setInternalUpvoted(!internalUpvoted);
    onUpvote?.();
  };

  const buttonBaseClass =
    'flex items-center justify-center w-8 h-8 rounded-lg transition-colors cursor-pointer';
  const buttonDefaultClass = `${buttonBaseClass} text-gray-400 hover:text-gray-600 hover:bg-gray-100`;
  const buttonActiveClass = `${buttonBaseClass} text-indigo-600 bg-indigo-50 hover:bg-indigo-100`;

  return (
    <div className="flex items-center gap-1 mt-3">
      {/* Upvote */}
      <button
        onClick={handleUpvote}
        className={internalUpvoted ? buttonActiveClass : buttonDefaultClass}
        title={internalUpvoted ? 'Remove upvote' : 'Upvote response'}
      >
        <ThumbsUpIcon size={16} weight={internalUpvoted ? 'fill' : 'regular'} />
      </button>

      {/* Copy */}
      {showCopy && (
        <button
          onClick={handleCopy}
          className={isCopied ? buttonActiveClass : buttonDefaultClass}
          title={isCopied ? 'Copied!' : 'Copy response'}
        >
          {isCopied ? <CheckIcon size={16} weight="bold" /> : <CopyIcon size={16} weight="regular" />}
        </button>
      )}

      {/* Download */}
      {showDownload && (
        <button
          onClick={onDownload}
          className={buttonDefaultClass}
          title="Download response"
        >
          <DownloadSimpleIcon size={16} weight="regular" />
        </button>
      )}

      {/* Transparency / Data Sources */}
      {showTransparency && (
        <button
          onClick={onTransparencyClick}
          className={buttonDefaultClass}
          title="View data sources"
        >
          <GitBranchIcon size={16} weight="regular" />
        </button>
      )}
    </div>
  );
};

export default ChatResponseActions;
