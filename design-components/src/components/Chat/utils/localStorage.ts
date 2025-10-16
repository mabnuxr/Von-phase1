/**
 * LocalStorage utilities for message persistence
 * Keeps last 100 messages per conversation to prevent quota exceeded errors
 */

import type { Message } from '../Chat';
import type { Conversation } from './api';

const STORAGE_PREFIX = 'chat_';
const MAX_MESSAGES_PER_CONVERSATION = 100;
const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

interface StoredConversation {
  conversation: Conversation;
  messages: Message[];
  lastSync: number;
}

/**
 * Save conversation and messages to localStorage
 * Automatically limits to last 100 messages
 */
export function saveConversation(
  conversationId: string,
  conversation: Conversation,
  messages: Message[]
): void {
  try {
    const key = `${STORAGE_PREFIX}${conversationId}`;

    // Keep only last 100 messages
    const limitedMessages = messages.slice(-MAX_MESSAGES_PER_CONVERSATION);

    const data: StoredConversation = {
      conversation,
      messages: limitedMessages,
      lastSync: Date.now(),
    };

    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    // Handle quota exceeded error
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn('LocalStorage quota exceeded, cleaning up old conversations');
      cleanupOldConversations();

      // Retry save after cleanup
      try {
        const key = `${STORAGE_PREFIX}${conversationId}`;
        const limitedMessages = messages.slice(-MAX_MESSAGES_PER_CONVERSATION);
        const data: StoredConversation = {
          conversation,
          messages: limitedMessages,
          lastSync: Date.now(),
        };
        localStorage.setItem(key, JSON.stringify(data));
      } catch (retryError) {
        console.error('Failed to save conversation after cleanup:', retryError);
      }
    } else {
      console.error('Failed to save conversation to localStorage:', error);
    }
  }
}

/**
 * Load a single conversation from localStorage
 */
export function loadConversation(conversationId: string): StoredConversation | null {
  try {
    const key = `${STORAGE_PREFIX}${conversationId}`;
    const data = localStorage.getItem(key);

    if (!data) {
      return null;
    }

    const parsed = JSON.parse(data) as StoredConversation;

    // Convert timestamp strings back to Date objects
    parsed.messages = parsed.messages.map((msg) => ({
      ...msg,
      timestamp: msg.timestamp ? new Date(msg.timestamp) : undefined,
    }));

    if (parsed.conversation.createdAt) {
      parsed.conversation.createdAt = new Date(parsed.conversation.createdAt);
    }
    if (parsed.conversation.updatedAt) {
      parsed.conversation.updatedAt = new Date(parsed.conversation.updatedAt);
    }

    return parsed;
  } catch (error) {
    console.error('Failed to load conversation from localStorage:', error);
    return null;
  }
}

/**
 * Load all conversations from localStorage
 */
export function loadAllConversations(): StoredConversation[] {
  const conversations: StoredConversation[] = [];

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);

      if (key && key.startsWith(STORAGE_PREFIX)) {
        const conversationId = key.replace(STORAGE_PREFIX, '');
        const data = loadConversation(conversationId);

        if (data) {
          conversations.push(data);
        }
      }
    }

    // Sort by most recently updated
    conversations.sort(
      (a, b) => b.conversation.updatedAt.getTime() - a.conversation.updatedAt.getTime()
    );

    return conversations;
  } catch (error) {
    console.error('Failed to load all conversations:', error);
    return [];
  }
}

/**
 * Delete a conversation from localStorage
 */
export function deleteConversation(conversationId: string): void {
  try {
    const key = `${STORAGE_PREFIX}${conversationId}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to delete conversation from localStorage:', error);
  }
}

/**
 * Check if a conversation needs to sync with API
 * Returns true if last sync was more than 5 minutes ago
 */
export function needsSync(conversationId: string): boolean {
  const data = loadConversation(conversationId);

  if (!data) {
    return true;
  }

  const timeSinceLastSync = Date.now() - data.lastSync;
  return timeSinceLastSync > SYNC_INTERVAL_MS;
}

/**
 * Clean up old conversations to free up space
 * Removes the 5 oldest conversations
 */
function cleanupOldConversations(): void {
  const conversations = loadAllConversations();

  // Sort by oldest first
  conversations.sort(
    (a, b) => a.conversation.updatedAt.getTime() - b.conversation.updatedAt.getTime()
  );

  // Remove oldest 5 conversations
  const toRemove = conversations.slice(0, 5);
  toRemove.forEach(({ conversation }) => {
    deleteConversation(conversation.conversationId);
  });

  console.log(`Cleaned up ${toRemove.length} old conversations`);
}

/**
 * Get storage information for debugging
 */
export function getStorageInfo(): {
  conversationCount: number;
  totalSize: number;
  estimatedQuota: number;
} {
  const conversations = loadAllConversations();
  let totalSize = 0;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(STORAGE_PREFIX)) {
      const value = localStorage.getItem(key);
      if (value) {
        totalSize += key.length + value.length;
      }
    }
  }

  return {
    conversationCount: conversations.length,
    totalSize, // in characters
    estimatedQuota: 5 * 1024 * 1024, // 5MB typical quota
  };
}
