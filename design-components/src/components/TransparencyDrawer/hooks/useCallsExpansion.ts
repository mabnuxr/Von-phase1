import { useState, useCallback } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface UseCallsExpansionReturn {
  expandedItems: Set<string>;
  toggleExpanded: (id: string) => void;
  isExpanded: (id: string) => boolean;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Custom hook for managing expansion state of call items
 *
 * @param defaultExpandedId - Optional ID to expand by default
 * @returns Expansion state and toggle function
 */
export function useCallsExpansion(defaultExpandedId?: string): UseCallsExpansionReturn {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(() =>
    defaultExpandedId ? new Set([defaultExpandedId]) : new Set()
  );

  const toggleExpanded = useCallback((id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const isExpanded = useCallback(
    (id: string) => expandedItems.has(id),
    [expandedItems]
  );

  return { expandedItems, toggleExpanded, isExpanded };
}
