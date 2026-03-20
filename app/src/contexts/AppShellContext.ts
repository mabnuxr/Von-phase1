import { createContext } from "react";

export interface AppShellContextValue {
  /** Current user data */
  user: import("../services").User | null;
  /** Collapse the sidebar programmatically */
  collapseSidebar: () => void;
  /** Trigger logout flow */
  handleLogout: () => Promise<void>;
  /** Navigate to new chat page */
  handleNewChatClick: () => void;
}

export const AppShellContext = createContext<AppShellContextValue | null>(null);
