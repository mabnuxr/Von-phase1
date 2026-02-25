import { createContext } from "react";
import type { useFeatureFlag } from "../hooks/useFeatureFlag";

type FeatureFlags = ReturnType<typeof useFeatureFlag>;

export interface AppShellContextValue {
  /** Current user data */
  user: import("../services").User | null;
  /** Whether a new chat is being created (shows loading skeleton) */
  isCreatingChat: boolean;
  /** Collapse the sidebar programmatically */
  collapseSidebar: () => void;
  /** Trigger logout flow */
  handleLogout: () => Promise<void>;
  /** Create a new chat from the sidebar */
  handleNewChatClick: () => void;
  /** All feature flags */
  featureFlags: FeatureFlags;
}

export const AppShellContext = createContext<AppShellContextValue | null>(null);
