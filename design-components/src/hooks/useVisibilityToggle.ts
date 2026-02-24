import { useState, useCallback } from 'react';

export interface UseVisibilityToggleReturn {
  isVisible: boolean;
  show: () => void;
  hide: () => void;
  toggleVisibility: () => void;
}

export function useVisibilityToggle(defaultVisible = false): UseVisibilityToggleReturn {
  const [isVisible, setIsVisible] = useState(defaultVisible);

  const show = useCallback(() => setIsVisible(true), []);
  const hide = useCallback(() => setIsVisible(false), []);
  const toggleVisibility = useCallback(() => setIsVisible((v) => !v), []);

  return { isVisible, show, hide, toggleVisibility };
}
