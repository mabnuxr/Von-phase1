import { createContext } from "react";
import type { NavigateOptions } from "react-router-dom";

export interface NavigationGuardConfig {
  title: string;
  body: string;
  confirmLabel: string;
}

export type GuardCheckFn = () => NavigationGuardConfig | false;

export interface NavigationGuardContextValue {
  /**
   * Navigate to a path. If a guard is active and blocks it, the pending
   * navigation is stored and a confirmation modal is shown automatically.
   *
   * `onNavigate` runs immediately before the route change, but only after the
   * guard (if any) is confirmed — so callers can pair side effects like
   * "collapse the sidebar" with the navigation itself.
   */
  navigate: (
    to: string,
    options?: NavigateOptions,
    onNavigate?: () => void,
  ) => void;
  /**
   * Guard an arbitrary action (not just route navigation). If a guard is
   * active and blocks it, the pending action is stored and a confirmation
   * modal is shown. Returns `true` if blocked.
   */
  guard: (action: () => void, modalConfig: NavigationGuardConfig) => boolean;
  /**
   * Register a guard check function. When set, every guarded navigation
   * calls this to decide whether to block. Return a modal config to block,
   * or `false` to allow. Pass `null` to unregister.
   */
  setGuardCheck: (check: GuardCheckFn | null) => void;
}

export const NavigationGuardContext =
  createContext<NavigationGuardContextValue | null>(null);
