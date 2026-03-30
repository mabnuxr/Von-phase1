import { createContext } from "react";

export interface GlobalChatContextValue {
  activeChatId: string | null;
  setActiveChatId: (id: string | null) => void;
  isChatPanelOpen: boolean;
  openChatPanel: () => void;
  closeChatPanel: () => void;
}

export const GlobalChatContext = createContext<GlobalChatContextValue>({
  activeChatId: null,
  setActiveChatId: () => {},
  isChatPanelOpen: false,
  openChatPanel: () => {},
  closeChatPanel: () => {},
});
