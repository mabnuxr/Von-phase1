/**
 * MessageActions component
 * ChatGPT-style action bar that appears at the bottom of completed AI messages
 * Actions: CopyIcon, Download (PDF), Like, Dislike, Share, More menu
 */

import React, { useState, useRef, useEffect } from 'react';
import { marked } from 'marked';
import {
  CopyIcon,
  CheckIcon,
  DownloadSimpleIcon,
  ThumbsUpIcon,
  ThumbsDownIcon,
  DotsThreeIcon,
  ChartBarIcon,
  FileMagnifyingGlassIcon,
} from '@phosphor-icons/react';

/**
 * Get inline styles for PDF rendering
 * These styles ensure the PDF looks properly formatted
 */
const getPdfStyles = () => `
  * { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif; }
  .pdf-content { color: #1d1d1f; line-height: 1.6; font-size: 14px; }
  .pdf-content h1, .pdf-content h2, .pdf-content h3 { font-weight: 500; margin-top: 1.5em; margin-bottom: 0.5em; }
  .pdf-content h1 { font-size: 1.5em; }
  .pdf-content h2 { font-size: 1.25em; border-bottom: 1px solid #e5e5e5; padding-bottom: 0.3em; }
  .pdf-content h3 { font-size: 1.1em; }
  .pdf-content p { margin: 0.75em 0; }
  .pdf-content code { background: #f5f5f5; padding: 0.2em 0.4em; border-radius: 3px; font-size: 0.9em; font-family: "SF Mono", Monaco, Consolas, monospace; }
  .pdf-content pre { background: #f5f5f5; color: #1d1d1f; padding: 1em; border-radius: 6px; overflow-x: auto; margin: 1em 0; }
  .pdf-content pre code { background: transparent; padding: 0; }
  .pdf-content blockquote { border-left: 4px solid #d2d2d7; padding-left: 1em; color: #6e6e73; font-style: italic; margin: 1em 0; }
  .pdf-content ul, .pdf-content ol { padding-left: 1.5em; margin: 0.75em 0; }
  .pdf-content li { margin: 0.25em 0; }
  .pdf-content table { width: 100%; border-collapse: collapse; margin: 1em 0; }
  .pdf-content th, .pdf-content td { border: 1px solid #e5e5e5; padding: 0.5em 0.75em; text-align: left; }
  .pdf-content th { background: #f9fafb; font-weight: 500; }
  .pdf-content a { color: #0071e3; text-decoration: none; }
  .pdf-content strong { font-weight: 600; }
  .pdf-content em { font-style: italic; }
`;

export interface MessageActionsProps {
  /**
   * The message content to CopyIcon/download
   */
  messageContent: string;

  /**
   * Unique identifier for the message
   */
  messageId: string;

  /**
   * Optional callback when CopyIcon is clicked
   */
  onCopyIcon?: () => void;

  /**
   * Optional callback when download is clicked
   */
  onDownload?: () => void;

  /**
   * Optional callback when like is clicked
   */
  onLike?: (messageId: string) => void;

  /**
   * Optional callback when dislike is clicked
   */
  onDislike?: (messageId: string) => void;

  /**
   * Optional callback when share is clicked
   */
  onShare?: (messageId: string) => void;

  /**
   * Enable additional actions menu (three dots with convert to dashboard, etc.)
   * Controlled by feature flag in parent component
   * @default false
   */
  enableActions?: boolean;

  /**
   * Optional callback when convert to dashboard is clicked
   */
  onConvertToDashboard?: (messageId: string) => void;

  /**
   * Optional callback when transparency (data sources) button is clicked
   */
  onTransparencyClick?: (messageId: string) => void;

  /**
   * Whether to show the transparency button
   * @default true
   */
  showTransparency?: boolean;
}

export const MessageActions: React.FC<MessageActionsProps> = ({
  messageContent,
  messageId,
  onCopyIcon,
  onDownload,
  onLike,
  onDislike,
  enableActions = false,
  onConvertToDashboard,
  onTransparencyClick,
  showTransparency = true,
}) => {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'like' | 'dislike' | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  const handleCopyIcon = async () => {
    try {
      await navigator.clipboard.writeText(messageContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onCopyIcon?.();
    } catch (error) {
      console.error('Failed to CopyIcon:', error);
    }
  };

  const handleDownload = () => {
    if (!messageContent || messageContent.trim() === '') {
      console.warn('Cannot generate PDF: message content is empty');
      return;
    }

    const htmlContent = marked(messageContent);

    const printDocument = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" /> <!-- required: Blob document won't inherit the page's encoding, else emoji/accents mangle -->
          <title>Message Export</title>
          <style>
            ${getPdfStyles()}
            body {
              font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
              color: #1d1d1f;
              line-height: 1.6;
            }
          </style>
        </head>
        <body class="pdf-content">
          ${htmlContent}
        </body>
      </html>
    `;

    // Open a standalone top-level document and print *that*, not an iframe:
    // iOS Safari ignores a hidden iframe's print scope and prints the whole app
    // UI instead. Serve it as a Blob URL rather than document.write — Android
    // Chrome fails ("There was a problem printing the page") on a synthetic
    // about:blank document; it needs a real, navigable URL.
    const blob = new Blob([printDocument], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const printWindow = window.open(blobUrl, '_blank');

    if (printWindow) {
      // Close the tab on afterprint, not synchronously after print(): mobile
      // print() is non-blocking, so closing immediately dismisses the share
      // sheet before it appears. Fallback timer covers afterprint never firing.
      let closed = false;
      let fallbackCloseId: ReturnType<typeof setTimeout>;
      const closeOnce = () => {
        if (closed) return;
        closed = true;
        clearTimeout(fallbackCloseId);
        printWindow.close();
        URL.revokeObjectURL(blobUrl);
      };
      fallbackCloseId = setTimeout(closeOnce, 60000);
      printWindow.addEventListener('afterprint', closeOnce);

      // Print on load (not a fixed timeout) so slow mobile renders complete first.
      printWindow.addEventListener('load', () => {
        printWindow.focus();
        printWindow.print();
      });

      onDownload?.();
      return;
    }

    // Popup blocked (desktop only — mobile allows tabs from a click): print
    // the same Blob URL in a hidden iframe instead.
    const iframe = document.createElement('iframe');
    iframe.style.cssText =
      'position: fixed; top: 0; left: 0; width: 0; height: 0; border: none; visibility: hidden;';
    iframe.src = blobUrl;
    iframe.onload = () => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
        URL.revokeObjectURL(blobUrl);
      }, 1000);
    };
    document.body.appendChild(iframe);

    onDownload?.();
  };

  const handleLike = () => {
    const newFeedback = feedback === 'like' ? null : 'like';
    setFeedback(newFeedback);
    if (newFeedback === 'like') {
      onLike?.(messageId);
    }
  };

  const handleDislike = () => {
    const newFeedback = feedback === 'dislike' ? null : 'dislike';
    setFeedback(newFeedback);
    if (newFeedback === 'dislike') {
      onDislike?.(messageId);
    }
  };

  // const handleShare = async () => {
  //   // For now, share = CopyIcon to clipboard
  //   try {
  //     await navigator.clipboard.writeText(messageContent);
  //     setCopied(true);
  //     setTimeout(() => setCopied(false), 2000);
  //     onShare?.(messageId);
  //   } catch (error) {
  //     console.error('Failed to share:', error);
  //   }
  // };

  const handleConvertToDashboard = () => {
    setMenuOpen(false);
    onConvertToDashboard?.(messageId);
  };

  const handleTransparencyClick = () => {
    onTransparencyClick?.(messageId);
  };

  const buttonClass =
    'p-1.5 rounded hover:bg-gray-100 text-gray-700 hover:text-gray-900 transition-colors cursor-pointer';
  const activeButtonClass = 'p-1.5 rounded transition-colors cursor-pointer';

  return (
    <div className="flex items-center gap-0.5 mt-3">
      {/* CopyIcon button */}
      <button
        onClick={handleCopyIcon}
        className={buttonClass}
        title={copied ? 'Copied!' : 'CopyIcon'}
        aria-label={copied ? 'Copied!' : 'CopyIcon message'}
      >
        {copied ? (
          <CheckIcon size={16} className="text-green-500" weight="bold" />
        ) : (
          <CopyIcon size={16} />
        )}
      </button>

      {/* Download button */}
      <button
        onClick={handleDownload}
        className={buttonClass}
        title="Download as PDF"
        aria-label="Download message as PDF"
      >
        <DownloadSimpleIcon size={16} />
      </button>

      {/* Like button */}
      <button
        onClick={handleLike}
        className={
          feedback === 'like'
            ? `${activeButtonClass} bg-blue-50 text-blue-600 hover:bg-blue-100`
            : buttonClass
        }
        title="Like"
        aria-label="Like this response"
        aria-pressed={feedback === 'like'}
      >
        <ThumbsUpIcon size={16} weight={feedback === 'like' ? 'fill' : 'regular'} />
      </button>

      {/* Dislike button */}
      <button
        onClick={handleDislike}
        className={
          feedback === 'dislike'
            ? `${activeButtonClass} bg-red-50 text-red-600 hover:bg-red-100`
            : buttonClass
        }
        title="Dislike"
        aria-label="Dislike this response"
        aria-pressed={feedback === 'dislike'}
      >
        <ThumbsDownIcon size={16} weight={feedback === 'dislike' ? 'fill' : 'regular'} />
      </button>

      {/* Transparency / Data Sources button */}
      {showTransparency && (
        <>
          <div className="w-px h-4 bg-gray-200 mx-1"></div>
          <button
            onClick={handleTransparencyClick}
            className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-gray-100 text-gray-700 hover:text-gray-900 transition-colors cursor-pointer text-sm"
            title="View sources"
            aria-label="View sources"
          >
            <FileMagnifyingGlassIcon size={16} />
            <span>Sources</span>
          </button>
        </>
      )}

      {/* More menu - only show when enableActions is true (controlled by feature flag) */}
      {enableActions && (
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={menuOpen ? `${activeButtonClass} bg-gray-100 text-gray-600` : buttonClass}
            title="More options"
            aria-label="More options"
            aria-expanded={menuOpen}
            aria-haspopup="true"
          >
            <DotsThreeIcon size={16} weight="bold" />
          </button>

          {/* Dropdown menu */}
          {menuOpen && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 py-1 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
              <button
                onClick={handleConvertToDashboard}
                className="px-3 py-2 text-sm flex items-center justify-center gap-2 text-gray-700 hover:bg-gray-50 cursor-pointer whitespace-nowrap"
              >
                <ChartBarIcon size={16} />
                <span>Convert to dashboard</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MessageActions;
