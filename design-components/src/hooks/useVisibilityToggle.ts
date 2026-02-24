import { useState, useCallback } from 'react';

export interface UseVisibilityToggleOptions {
  /** Initial visibility state. Defaults to false. */
  defaultVisible?: boolean;
}

export interface UseVisibilityToggleReturn {
  isVisible: boolean;
  toggle: () => void;
  show: () => void;
  hide: () => void;
}

/**
 * useVisibilityToggle — manages a boolean visible/hidden state.
 *
 * @example
 * ```tsx
 * const { isVisible, toggle } = useVisibilityToggle();
 *
 * return (
 *   <>
 *     <button onClick={toggle}>{isVisible ? 'Collapse' : 'Expand'}</button>
 *     {isVisible && <Details />}
 *   </>
 * );
 * ```
 */
export function useVisibilityToggle(
  options: UseVisibilityToggleOptions = {}
): UseVisibilityToggleReturn {
  const { defaultVisible = false } = options;
  const [isVisible, setIsVisible] = useState(defaultVisible);

  const toggle = useCallback(() => setIsVisible((v) => !v), []);
  const show = useCallback(() => setIsVisible(true), []);
  const hide = useCallback(() => setIsVisible(false), []);

  return { isVisible, toggle, show, hide };
}
