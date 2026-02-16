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
  setMessages: (
    conversationId: string,
    messages: MessageWithStreaming[],
  ) => void;
  addMessage: (conversationId: string, message: MessageWithStreaming) => void;
  upsertMessage: (
    conversationId: string,
    message: MessageWithStreaming,
  ) => void;
  prependMessages: (
    conversationId: string,
    olderMessages: MessageWithStreaming[],
  ) => void;
  clearMessages: (conversationId: string) => void;
  updateMessageId: (
    conversationId: string,
    oldId: string,
    newId: string,
  ) => void;

  // Track pending optimistic IDs for dedup (Bug 5 fix)
  pendingOptimisticIds: Set<string>;
  addPendingOptimisticId: (id: string) => void;
  removePendingOptimisticId: (id: string) => void;

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

  // Message filtering state for ChatGPT-style visual clearing
  // Stored in Zustand for synchronous updates with message additions
  showMessagesFromIndex: Record<string, number>;
  setShowMessagesFromIndex: (conversationId: string, index: number) => void;
  resetShowMessagesFromIndex: (conversationId: string) => void;
}

const useChatStoreBase = create<ChatState>((set) => ({
  // Conversation state
  currentConversationId: null,
  setCurrentConversationId: (id) => set({ currentConversationId: id }),

  // UI state
  sidebarExpanded: true,
  setSidebarExpanded: (expand: boolean) => set({ sidebarExpanded: expand }),

  // Pending optimistic IDs for dedup (Bug 5 fix)
  pendingOptimisticIds: new Set<string>(),
  addPendingOptimisticId: (id) =>
    set((state) => {
      const next = new Set(state.pendingOptimisticIds);
      next.add(id);
      return { pendingOptimisticIds: next };
    }),
  removePendingOptimisticId: (id) =>
    set((state) => {
      const next = new Set(state.pendingOptimisticIds);
      next.delete(id);
      return { pendingOptimisticIds: next };
    }),

  // Messages state
  messages: {},

  setMessages: (conversationId, messages) =>
    set((state) => {
      const seen = new Set<string>();
      const deduped = messages.filter((m) => {
        if (seen.has(m.id)) return false;
        seen.add(m.id);
        return true;
      });
      return {
        messages: {
          ...state.messages,
          [conversationId]: deduped,
        },
      };
    }),

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

  upsertMessage: (conversationId, message) =>
    set((state) => {
      const existingMessages = state.messages[conversationId] || [];

      // Try to find existing message by runId first (works for assistant messages)
      let existingIndex = existingMessages.findIndex(
        (m) => m.runId === message.id,
      );

      // Fallback: For user messages, also check by message id
      if (existingIndex < 0 && message.role === "user") {
        existingIndex = existingMessages.findIndex((m) => m.id === message.id);
      }

      // Fallback: For user messages, check for optimistic messages with same content
      // This handles race condition where Pusher arrives before HTTP response
      // Normalize content for comparison to handle whitespace differences from backend
      if (existingIndex < 0 && message.role === "user") {
        const normalizeContent = (content: string | undefined) =>
          (content || "").trim().replace(/\s+/g, " ");
        const incomingNormalized = normalizeContent(message.messageContent);

        existingIndex = existingMessages.findIndex(
          (m) =>
            m.id.startsWith("optimistic-") &&
            m.role === "user" &&
            normalizeContent(m.messageContent) === incomingNormalized,
        );
      }

      // Fallback: For assistant messages, check for optimistic streaming assistant message
      // This reconciles the optimistic "thinking" message with the real assistant response
      // Bug 5 fix: Use findLastIndex to always merge into the LATEST optimistic assistant,
      // preventing duplicate assistant messages when Pusher event arrives before updateMessageId
      if (existingIndex < 0 && message.role === "assistant") {
        for (let i = existingMessages.length - 1; i >= 0; i--) {
          const m = existingMessages[i];
          if (
            m.id.startsWith("optimistic-") &&
            m.role === "assistant" &&
            m.isStreaming === true
          ) {
            existingIndex = i;
            break;
          }
        }
      }

      let updatedConversationMessages: MessageWithStreaming[];

      if (existingIndex >= 0) {
        // UPDATE: Simple event-driven merge
        // If incoming message has events, trust the replayed content from those events
        const existingMessage = existingMessages[existingIndex];

        const mergedMessage: MessageWithStreaming = {
          ...existingMessage,
          ...message,
          // Always update streaming flags
          isStreaming:
            message.isStreaming !== undefined
              ? message.isStreaming
              : existingMessage.isStreaming,
          status: message.status || existingMessage.status,
          errorMessage:
            message.errorMessage !== undefined
              ? message.errorMessage
              : existingMessage.errorMessage,
          // Preserve fileAttachments from optimistic message if incoming doesn't have them
          fileAttachments:
            message.fileAttachments || existingMessage.fileAttachments,
        };

        updatedConversationMessages = [...existingMessages];
        updatedConversationMessages[existingIndex] = mergedMessage;
      } else {
        // INSERT: Add new message
        if (import.meta.env.DEV) {
          console.log("[chatStore.upsertMessage] Inserting new message:", {
            role: message.role,
            id: message.id,
            contentPreview: message.messageContent?.slice(0, 50),
            existingOptimisticUserIds: existingMessages
              .filter(
                (m) => m.role === "user" && m.id.startsWith("optimistic-"),
              )
              .map((m) => m.id),
          });
        }
        updatedConversationMessages = [...existingMessages, message];
      }

      return {
        messages: {
          ...state.messages,
          [conversationId]: updatedConversationMessages,
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

  updateMessageId: (conversationId, oldId, newId) =>
    set((state) => {
      const messages = state.messages[conversationId];
      if (!messages) return state;

      return {
        messages: {
          ...state.messages,
          [conversationId]: messages.map((msg) =>
            msg.id === oldId ? { ...msg, id: newId, runId: newId } : msg,
          ),
        },
      };
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

  // Message filtering state - synchronous updates prevent flash of old content
  showMessagesFromIndex: {},
  setShowMessagesFromIndex: (conversationId, index) =>
    set((state) => ({
      showMessagesFromIndex: {
        ...state.showMessagesFromIndex,
        [conversationId]: index,
      },
    })),
  resetShowMessagesFromIndex: (conversationId) =>
    set((state) => ({
      showMessagesFromIndex: {
        ...state.showMessagesFromIndex,
        [conversationId]: 0,
      },
    })),
}));

const useChatStore = createSelectors(useChatStoreBase);

export default useChatStore;
