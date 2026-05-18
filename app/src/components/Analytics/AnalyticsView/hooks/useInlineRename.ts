import { useCallback, useEffect, useRef, useState } from "react";
import { useVisibilityToggle } from "@vonlabs/design-components";

// Rename input's horizontal padding (px-1.5 × 2 = 12px) + border (1px × 2 = 2px).
// Added to the measured title width so the text inside the input aligns with the h1's.
const RENAME_INPUT_CHROME_PX = 14;

interface UseInlineRenameArgs {
  title: string;
  onRename?: (newName: string) => void;
}

export function useInlineRename({ title, onRename }: UseInlineRenameArgs) {
  const {
    isVisible: isRenaming,
    show: showRename,
    hide: hideRename,
  } = useVisibilityToggle();
  const [editValue, setEditValue] = useState(title);
  const [renameWidth, setRenameWidth] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const committedRef = useRef(false);

  const startRename = useCallback(() => {
    const titleWidth = titleRef.current?.offsetWidth;
    setRenameWidth(
      titleWidth != null ? titleWidth + RENAME_INPUT_CHROME_PX : null,
    );
    showRename();
  }, [showRename]);

  useEffect(() => {
    if (!isRenaming) setEditValue(title);
  }, [title, isRenaming]);

  useEffect(() => {
    if (isRenaming) {
      committedRef.current = false;
      inputRef.current?.select();
    }
  }, [isRenaming]);

  const commitRename = useCallback(() => {
    if (committedRef.current) return;
    committedRef.current = true;
    const trimmed = editValue.trim();
    hideRename();
    if (trimmed && trimmed !== title) {
      onRename?.(trimmed);
    } else {
      setEditValue(title);
    }
  }, [editValue, title, onRename, hideRename]);

  const cancelRename = useCallback(() => {
    setEditValue(title);
    hideRename();
  }, [title, hideRename]);

  return {
    isRenaming,
    editValue,
    setEditValue,
    renameWidth,
    inputRef,
    titleRef,
    startRename,
    commitRename,
    cancelRename,
  };
}

export type InlineRename = ReturnType<typeof useInlineRename>;
