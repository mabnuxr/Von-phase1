import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

interface GlobalChatContextValue {
  activeChatId: string | null;
  setActiveChatId: (id: string | null) => void;
  isChatPanelOpen: boolean;
  setIsChatPanelOpen: (open: boolean) => void;
}

const GlobalChatContext = createContext<GlobalChatContextValue>({
  activeChatId: null,
  setActiveChatId: () => {},
  isChatPanelOpen: false,
  setIsChatPanelOpen: () => {},
});

export function GlobalChatProvider({ children }: { children: ReactNode }) {
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);

  return (
    <GlobalChatContext.Provider
      value={{ activeChatId, setActiveChatId, isChatPanelOpen, setIsChatPanelOpen }}
    >
      {children}
    </GlobalChatContext.Provider>
  );
}

export function useGlobalChat() {
  return useContext(GlobalChatContext);
}
