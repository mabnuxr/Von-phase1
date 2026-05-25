import { useContext, useEffect, useCallback } from "react";
import { NavigationGuardContext } from "./NavigationGuardContext";
import type {
  NavigationGuardConfig,
  GuardCheckFn,
} from "./NavigationGuardContext";

/**
 * Drop-in replacement for `useNavigate()` that respects active navigation guards.
 * Returns a `navigate(to, options?, onNavigate?)` function that shows a confirmation
 * modal when blocked. `onNavigate` fires immediately before the route change, paired
 * with any guard confirmation.
 */
export function useGuardedNavigate() {
  const ctx = useContext(NavigationGuardContext);
  if (!ctx) {
    throw new Error(
      "useGuardedNavigate must be used within a NavigationGuardProvider",
    );
  }
  return ctx.navigate;
}

/**
 * Register a navigation guard for the lifetime of the calling component.
 *
 * When `config.when` is `true`, any call to the guarded `navigate()` or `guard()`
 * will show a confirmation modal instead of executing immediately.
 *
 * Automatically cleans up on unmount.
 *
 * @example
 * ```tsx
 * const { guard } = useNavigationGuard({
 *   when: isEditable,
 *   title: "Dashboard in edit mode",
 *   body: "You have unsaved changes...",
 *   confirmLabel: "Switch Anyway",
 * });
 *
 * // Guard a non-navigation action (e.g. chat switch):
 * const handleChatSwitch = (id: string) => {
 *   if (guard(() => setActiveChatId(id), {
 *     title: "Switch chat?",
 *     body: "Your current chat has edit context...",
 *     confirmLabel: "Switch Chat",
 *   })) return;
 *   setActiveChatId(id);
 * };
 * ```
 */
export function useNavigationGuard(config: {
  when: boolean;
  title: string;
  body: string;
  confirmLabel: string;
}) {
  const ctx = useContext(NavigationGuardContext);
  if (!ctx) {
    throw new Error(
      "useNavigationGuard must be used within a NavigationGuardProvider",
    );
  }

  const { setGuardCheck, guard } = ctx;
  const { when, title, body, confirmLabel } = config;

  useEffect(() => {
    if (when) {
      const check: GuardCheckFn = () => ({ title, body, confirmLabel });
      setGuardCheck(check);
    } else {
      setGuardCheck(null);
    }
    return () => setGuardCheck(null);
  }, [when, title, body, confirmLabel, setGuardCheck]);

  /**
   * Guard an arbitrary action with a custom modal config.
   * Returns `true` if blocked.
   */
  const guardAction = useCallback(
    (action: () => void, modalConfig?: NavigationGuardConfig): boolean => {
      if (!when) return false;
      return guard(action, modalConfig ?? { title, body, confirmLabel });
    },
    [when, guard, title, body, confirmLabel],
  );

  return { guard: guardAction };
}
