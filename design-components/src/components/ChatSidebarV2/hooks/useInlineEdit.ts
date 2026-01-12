import { useState, useRef, useEffect, useCallback } from 'react';

export interface UseInlineEditOptions {
  initialValue: string;
  onSave: (value: string) => void;
  onCancel: () => void;
}

export interface UseInlineEditReturn {
  editValue: string;
  setEditValue: (value: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  handleSave: () => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
}

/**
 * Hook for managing inline edit state and behavior
 * Used by ConversationItem and FolderRow for rename functionality
 */
export function useInlineEdit({
  initialValue,
  onSave,
  onCancel,
}: UseInlineEditOptions): UseInlineEditReturn {
  const [editValue, setEditValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus and select input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  // Reset edit value when initial value changes
  useEffect(() => {
    setEditValue(initialValue);
  }, [initialValue]);

  const handleSave = useCallback(() => {
    const trimmedValue = editValue.trim();
    if (trimmedValue && trimmedValue !== initialValue) {
      onSave(trimmedValue);
    } else {
      onCancel();
    }
  }, [editValue, initialValue, onSave, onCancel]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    },
    [handleSave, onCancel]
  );

  return {
    editValue,
    setEditValue,
    inputRef,
    handleSave,
    handleKeyDown,
  };
}
