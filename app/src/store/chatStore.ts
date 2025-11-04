import { create } from "zustand";
import createSelectors from "./createSelectors";
import type { MessageWithStreaming } from "../types/conversation";

interface ChatState {
  // Conversation state
  currentConversationId: string | null;
  setCurrentConversationId: (id: string | null) => void;

  // UI state
  sidebarExpanded: boolean;
  setSidebarExpanded: (expand: boolean) => void;

  // Messages state - keyed by conversationId.
  messages: Record<string, MessageWithStreaming[]>;
  setMessages: (conversationId: string, messages: MessageWithStreaming[]) => void;
  addMessage: (conversationId: string, message: MessageWithStreaming) => void;
  prependMessages: (conversationId: string, olderMessages: MessageWithStreaming[]) => void;
  clearMessages: (conversationId: string) => void;

  // Message loading state
  isLoadingMessages: boolean;
  setIsLoadingMessages: (loading: boolean) => void;

  // Scroll tracking state (keyed by conversationId)
  lastSeenMessageIds: Record<string, string>;
  setLastSeenMessageId: (conversationId: string, messageId: string) => void;
  clearLastSeenMessageId: (conversationId: string) => void;

  // Trigger for programmatic scrolling
  shouldScrollToBottom: Record<string, boolean>;
  triggerScrollToBottom: (conversationId: string) => void;
  clearScrollTrigger: (conversationId: string) => void;

  // FIX: Force-complete message (timeout recovery)
  forceCompleteMessage: (conversationId: string, messageId: string) => void;
  markMessageTimeout: (conversationId: string, messageId: string) => void;
}

const useChatStoreBase = create<ChatState>((set) => ({
  // Conversation state
  currentConversationId: null,
  setCurrentConversationId: (id) => set({ currentConversationId: id }),

  // UI state
  sidebarExpanded: true,
  setSidebarExpanded: (expand: boolean) => set({ sidebarExpanded: expand }),

  // Messages state
  messages: {},

  setMessages: (conversationId, messages) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: messages,
      },
    })),

  addMessage: (conversationId, message) =>
    set((state) => {
      const existingMessages = state.messages[conversationId] || [];
      const messageExists = existingMessages.some((m) => m.id === message.id);

      if (messageExists) {
        return state;
      }

      return {
        messages: {
          ...state.messages,
          [conversationId]: [...existingMessages, message],
        },
      };
    }),

  prependMessages: (conversationId, olderMessages) =>
    set((state) => {
      const existingMessages = state.messages[conversationId] || [];
      const existingIds = new Set(existingMessages.map((m) => m.id));
      const newMessages = olderMessages.filter((m) => !existingIds.has(m.id));

      return {
        messages: {
          ...state.messages,
          [conversationId]: [...newMessages, ...existingMessages],
        },
      };
    }),

  clearMessages: (conversationId) =>
    set((state) => {
      const newMessages = { ...state.messages };
      delete newMessages[conversationId];
      return { messages: newMessages };
    }),

  // Message loading state
  isLoadingMessages: false,
  setIsLoadingMessages: (loading) => set({ isLoadingMessages: loading }),

  // Scroll tracking state
  lastSeenMessageIds: {},
  setLastSeenMessageId: (conversationId, messageId) =>
    set((state) => ({
      lastSeenMessageIds: {
        ...state.lastSeenMessageIds,
        [conversationId]: messageId,
      },
    })),
  clearLastSeenMessageId: (conversationId) =>
    set((state) => {
      const newLastSeenMessageIds = { ...state.lastSeenMessageIds };
      delete newLastSeenMessageIds[conversationId];
      return { lastSeenMessageIds: newLastSeenMessageIds };
    }),

  // Scroll trigger state
  shouldScrollToBottom: {},
  triggerScrollToBottom: (conversationId) =>
    set((state) => ({
      shouldScrollToBottom: {
        ...state.shouldScrollToBottom,
        [conversationId]: true,
      },
    })),
  clearScrollTrigger: (conversationId) =>
    set((state) => ({
      shouldScrollToBottom: {
        ...state.shouldScrollToBottom,
        [conversationId]: false,
      },
    })),

  // FIX: Force-complete message (timeout recovery)
  forceCompleteMessage: (conversationId, messageId) =>
    set((state) => {
      const messages = state.messages[conversationId];
      if (!messages) return state;

      return {
        messages: {
          ...state.messages,
          [conversationId]: messages.map((msg) =>
            msg.id === messageId
              ? { ...msg, isStreaming: false, status: "completed" as const }
              : msg,
          ),
        },
      };
    }),

  markMessageTimeout: (conversationId, messageId) =>
    set((state) => {
      const messages = state.messages[conversationId];
      if (!messages) return state;

      return {
        messages: {
          ...state.messages,
          [conversationId]: messages.map((msg) =>
            msg.id === messageId
              ? {
                  ...msg,
                  isStreaming: false,
                  status: "timeout" as const,
                  errorMessage: "Message timed out after 60 seconds",
                }
              : msg,
          ),
        },
      };
    }),
}));

const useChatStore = createSelectors(useChatStoreBase);

export default useChatStore;
