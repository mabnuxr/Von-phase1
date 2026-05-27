import { useEffect } from "react";
import { create } from "zustand";
import { report } from "../lib/analytics/tracker";

export type SearchModalTrigger = "shortcut" | "sidebar_button";

interface SearchModalStore {
  isOpen: boolean;
  trigger: SearchModalTrigger | null;
  open: (trigger: SearchModalTrigger) => void;
  close: () => void;
  toggle: (trigger: SearchModalTrigger) => void;
}

export const useSearchModalStore = create<SearchModalStore>((set, get) => ({
  isOpen: false,
  trigger: null,
  open: (trigger) => {
    if (get().isOpen) return;
    set({ isOpen: true, trigger });
    report.searchModalOpened(trigger);
  },
  close: () => set({ isOpen: false, trigger: null }),
  toggle: (trigger) => (get().isOpen ? get().close() : get().open(trigger)),
}));

/**
 * Binds Cmd/Ctrl+K globally. Mount once at AppShell.
 *
 * Cmd/Ctrl+K is universal and isn't intercepted by editable elements, so
 * no editable-focus guard is needed — preventDefault stops browser
 * defaults (URL bar focus, find-in-page on some platforms).
 *
 * Pass `enabled=false` to skip listener registration entirely (e.g.,
 * when the feature flag is off). The hook must still be called
 * unconditionally to honor Rules of Hooks.
 */
export function useSearchModalKeyboardShortcut(enabled: boolean = true) {
  const toggle = useSearchModalStore((s) => s.toggle);

  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      if (!isMod) return;
      if (e.key !== "k" && e.key !== "K") return;
      e.preventDefault();
      toggle("shortcut");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle, enabled]);
}
