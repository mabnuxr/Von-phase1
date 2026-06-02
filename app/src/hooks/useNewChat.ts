import { useCallback, useEffect } from "react";
import { useGuardedNavigate } from "../providers/NavigationGuard";

/**
 * Encapsulates new chat navigation logic.
 *
 * Navigates to /chat/new where the user types their first message.
 * The conversation is created only when the first message is sent,
 * avoiding orphaned conversations with no user messages.
 */
export function useNewChat() {
  const guardedNavigate = useGuardedNavigate();

  const handleNewChatClick = useCallback(() => {
    guardedNavigate("/chat/new");
  }, [guardedNavigate]);

  return { handleNewChatClick };
}

/**
 * Binds Cmd/Ctrl+Shift+O globally to trigger new chat. Mount once at
 * AppShell. Pass `enabled=false` to skip listener registration entirely;
 * the hook must still be called unconditionally to honor Rules of Hooks.
 */
export function useNewChatKeyboardShortcut(
  onNewChat: () => void,
  enabled: boolean = true,
) {
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      if (!isMod || !e.shiftKey) return;
      if (e.key !== "o" && e.key !== "O") return;
      e.preventDefault();
      onNewChat();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onNewChat, enabled]);
}
