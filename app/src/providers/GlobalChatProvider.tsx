import { createContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useVisibilityToggle } from "@vonlabs/design-components";

interface GlobalChatContextValue {
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

export function GlobalChatProvider({ children }: { children: ReactNode }) {
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const { isVisible: isChatPanelOpen, show: openChatPanel, hide: closeChatPanel } =
    useVisibilityToggle();

  const value = useMemo<GlobalChatContextValue>(
    () => ({
      activeChatId,
      setActiveChatId,
      isChatPanelOpen,
      openChatPanel,
      closeChatPanel,
    }),
    [activeChatId, isChatPanelOpen, openChatPanel, closeChatPanel],
  );

  return (
    <GlobalChatContext.Provider value={value}>
      {children}
    </GlobalChatContext.Provider>
  );
}
