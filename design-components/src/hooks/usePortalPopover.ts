import { useRef, useState, useCallback, useEffect } from 'react';
import { useVisibilityToggle } from './useVisibilityToggle';

function getScrollParent(el: HTMLElement | null): HTMLElement | null {
  let parent = el?.parentElement ?? null;
  while (parent) {
    const { overflowY } = getComputedStyle(parent);
    if (overflowY === 'auto' || overflowY === 'scroll') return parent;
    parent = parent.parentElement;
  }
  return null;
}

interface UsePortalPopoverOptions {
  popoverWidth: number;
}

export function usePortalPopover({ popoverWidth }: UsePortalPopoverOptions) {
  const { isVisible: open, hide, toggleVisibility } = useVisibilityToggle();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const scrollParent = getScrollParent(triggerRef.current);
    // Clamp: don't let popover go above the scrollable container (i.e. above the dashboard header)
    const minTop = scrollParent ? scrollParent.getBoundingClientRect().top : 0;

    const top = Math.max(rect.bottom + 6, minTop);
    // Right-align popover to the trigger button
    const left = Math.max(8, rect.right - popoverWidth);

    setPosition({ top, left });
  }, [popoverWidth]);

  useEffect(() => {
    if (!open) return;
    updatePosition();

    const scrollParent = getScrollParent(triggerRef.current);

    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        hide();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') hide();
    };

    scrollParent?.addEventListener('scroll', updatePosition, { passive: true });
    window.addEventListener('resize', updatePosition);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      scrollParent?.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, hide, updatePosition]);

  return { open, hide, toggleVisibility, triggerRef, popoverRef, position };
}
