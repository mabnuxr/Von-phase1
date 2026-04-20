import { create } from "zustand";
import type { MentionItem } from "@vonlabs/design-components";

/**
 * Widget-mention store — holds the list of widget chips the user has attached
 * to the chat via the per-widget "Add to chat" icon.
 *
 * Scoped by conversationId so multiple open sessions don't leak chips into
 * each other. The store is declarative: ChatSession subscribes to the current
 * conversation's list and passes it down to useMentions, which syncs it into
 * selectedMentions. DashboardPreviewPane / AnalyticsView push into it via the
 * addWidget builder when the user clicks a widget icon.
 *
 * Chips clear when the user sends a message (ChatSession calls clear()).
 */
interface WidgetMentionsState {
  byConversation: Record<string, MentionItem[]>;
  add: (conversationId: string, mention: MentionItem) => void;
  remove: (conversationId: string, id: string) => void;
  clear: (conversationId: string) => void;
}

export const useWidgetMentionsStore = create<WidgetMentionsState>((set) => ({
  byConversation: {},
  add: (conversationId, mention) =>
    set((state) => {
      const current = state.byConversation[conversationId] ?? [];
      if (current.some((m) => m.id === mention.id)) return state;
      return {
        byConversation: {
          ...state.byConversation,
          [conversationId]: [...current, mention],
        },
      };
    }),
  remove: (conversationId, id) =>
    set((state) => {
      const current = state.byConversation[conversationId];
      if (!current) return state;
      const next = current.filter((m) => m.id !== id);
      if (next.length === current.length) return state;
      return {
        byConversation: {
          ...state.byConversation,
          [conversationId]: next,
        },
      };
    }),
  clear: (conversationId) =>
    set((state) => {
      if (!state.byConversation[conversationId]) return state;
      const next = { ...state.byConversation };
      delete next[conversationId];
      return { byConversation: next };
    }),
}));

const EMPTY: MentionItem[] = [];

/** Stable selector for a conversation's widget mentions. Use via `useWidgetMentionsStore`. */
export const getWidgetMentionsFor =
  (conversationId: string) =>
  (state: WidgetMentionsState): MentionItem[] =>
    state.byConversation[conversationId] ?? EMPTY;
