/**
 * API utility functions for Chat backend integration
 */

/**
 * Get the authorization header with bearer token
 */
function getAuthHeader(): HeadersInit {
  const token = localStorage.getItem('access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface ApiEndpoints {
  conversations: string;
  messages: string;
  history: string;
  auth: string;
}

export interface Conversation {
  conversationId: string;
  title: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

/**
 * Create a new conversation
 */
export async function createConversation(
  apiBaseUrl: string,
  userId: string,
  title?: string
): Promise<Conversation> {
  const response = await fetch(`${apiBaseUrl}/api/v1/conversations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify({
      userId,
      title: title || 'New Chat',
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create conversation: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Send a message to a conversation
 */
export async function sendMessage(
  apiBaseUrl: string,
  conversationId: string,
  content: string,
  userId: string
): Promise<ApiMessage> {
  const response = await fetch(`${apiBaseUrl}/api/v1/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify({
      content,
      userId,
      role: 'user',
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to send message: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch conversation history
 */
export async function fetchConversationHistory(
  apiBaseUrl: string,
  conversationId: string,
  limit = 100,
  offset = 0
): Promise<ApiMessage[]> {
  const response = await fetch(
    `${apiBaseUrl}/api/v1/conversations/${conversationId}/history?limit=${limit}&offset=${offset}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch history: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch all user conversations
 */
export async function fetchUserConversations(
  apiBaseUrl: string,
  userId: string
): Promise<Conversation[]> {
  const response = await fetch(`${apiBaseUrl}/api/v1/users/${userId}/conversations`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch conversations: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Delete a conversation
 */
export async function deleteConversation(
  apiBaseUrl: string,
  conversationId: string
): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/api/v1/conversations/${conversationId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to delete conversation: ${response.statusText}`);
  }
}

/**
 * Update conversation title
 */
export async function updateConversationTitle(
  apiBaseUrl: string,
  conversationId: string,
  title: string
): Promise<Conversation> {
  const response = await fetch(`${apiBaseUrl}/api/v1/conversations/${conversationId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify({ title }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update conversation: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Resume response from the resume conversation endpoint
 */
export interface ResumeResponse {
  status: string;
  conversationId: string;
  error?: string;
}

/**
 * Resume an interrupted conversation with user's approval decision
 *
 * Used when the agent has paused execution (e.g., for Salesforce CRUD approval)
 * and needs the user's approval or rejection to continue.
 *
 * @param apiBaseUrl - Base URL for the backend API
 * @param conversationId - ID of the conversation to resume
 * @param approved - Whether the user approved the pending operation
 * @param runId - The run_id of the interrupted workflow to continue (backend looks up message by run_id)
 * @param message - Optional message from the user about their decision
 * @returns Promise with the resume status
 */
export async function resumeConversation(
  apiBaseUrl: string,
  conversationId: string,
  approved: boolean,
  runId: string,
  message: string = ''
): Promise<ResumeResponse> {
  const response = await fetch(`${apiBaseUrl}/api/v1/chat/conversations/${conversationId}/resume`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify({
      approved,
      message,
      run_id: runId,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to resume conversation: ${response.statusText} - ${errorText}`);
  }

  return response.json();
}
