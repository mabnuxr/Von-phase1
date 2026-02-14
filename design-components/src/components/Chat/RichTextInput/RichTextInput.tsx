/**
 * RichTextInput component
 * A textarea with visual highlighting for {{placeholder}} syntax.
 *
 * The placeholder text (e.g., {{account_name}}) is highlighted with a background
 * color to indicate it should be replaced, but remains fully editable as regular text.
 * When the user removes or replaces the placeholder, the highlight disappears.
 */

import React, { useRef, useCallback, useLayoutEffect, forwardRef } from 'react';
import { PLACEHOLDER_REGEX, hasPlaceholders } from './utils';

export interface RichTextInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  onPaste?: (e: React.ClipboardEvent) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export interface RichTextInputRef {
  focus: () => void;
}

/**
 * Parse text and render with highlighted placeholders
 */
function renderHighlightedText(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  const regex = new RegExp(PLACEHOLDER_REGEX.source, 'g');
  let match;
  let idx = 0;

  while ((match = regex.exec(text)) !== null) {
    // Add text before the placeholder
    if (match.index > lastIndex) {
      parts.push(<span key={`text-${idx}`}>{text.slice(lastIndex, match.index)}</span>);
    }

    // Add the highlighted placeholder
    parts.push(
      <mark
        key={`placeholder-${idx}`}
        className="bg-violet-100 text-violet-900 rounded px-0.5 -mx-0.5"
        style={{ backgroundColor: 'rgb(237 233 254)' }} // violet-100
      >
        {match[0]}
      </mark>
    );

    lastIndex = match.index + match[0].length;
    idx++;
  }

  // Add remaining text after the last placeholder
  if (lastIndex < text.length) {
    parts.push(<span key="text-end">{text.slice(lastIndex)}</span>);
  }

  return parts;
}

export const RichTextInput = forwardRef<RichTextInputRef, RichTextInputProps>(
  (
    {
      value,
      onChange,
      onKeyDown,
      onPaste,
      placeholder = '',
      disabled = false,
      className = '',
      style,
    },
    ref
  ) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);

    // Expose focus method
    React.useImperativeHandle(ref, () => ({
      focus: () => textareaRef.current?.focus(),
    }));

    // Auto-resize textarea and sync overlay scroll
    useLayoutEffect(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        const newHeight = Math.min(textareaRef.current.scrollHeight, 200);
        textareaRef.current.style.height = `${newHeight}px`;
      }
    }, [value]);

    // Sync scroll between textarea and overlay
    const handleScroll = useCallback(() => {
      if (textareaRef.current && overlayRef.current) {
        overlayRef.current.scrollTop = textareaRef.current.scrollTop;
        overlayRef.current.scrollLeft = textareaRef.current.scrollLeft;
      }
    }, []);

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onChange(e.target.value);
      },
      [onChange]
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          onKeyDown?.(e);
        }
      },
      [onKeyDown]
    );

    const containsPlaceholders = hasPlaceholders(value);

    // If no placeholders, render simple textarea
    if (!containsPlaceholders) {
      return (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={onPaste}
          placeholder={placeholder}
          disabled={disabled}
          className={`resize-none ${className}`}
          style={style}
          rows={1}
        />
      );
    }

    // Render textarea with highlight overlay
    return (
      <div className={`relative flex-1 min-w-0 ${className}`} style={style}>
        {/* Highlight overlay - shows the highlighted text */}
        <div
          ref={overlayRef}
          className="absolute inset-0 pointer-events-none whitespace-pre-wrap break-words overflow-hidden text-sm"
          style={{
            lineHeight: '1.5',
            padding: '0',
            color: 'transparent',
          }}
          aria-hidden="true"
        >
          {renderHighlightedText(value)}
        </div>

        {/* Actual textarea - transparent text so highlights show through */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={onPaste}
          onScroll={handleScroll}
          placeholder={placeholder}
          disabled={disabled}
          className="relative w-full resize-none bg-transparent outline-none text-sm overflow-y-auto"
          style={{
            lineHeight: '1.5',
            caretColor: 'black',
            minHeight: '20px',
            maxHeight: '200px',
          }}
          rows={1}
        />
      </div>
    );
  }
);

RichTextInput.displayName = 'RichTextInput';

export default RichTextInput;
