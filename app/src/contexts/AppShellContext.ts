import { createContext } from "react";

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
}

export const AppShellContext = createContext<AppShellContextValue | null>(null);
