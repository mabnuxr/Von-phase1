import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useVisibilityToggle } from "@vonlabs/design-components";
import { GlobalChatContext } from "./GlobalChatContext";
import type { GlobalChatContextValue } from "./GlobalChatContext";

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
