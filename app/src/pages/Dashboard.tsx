import { authService } from "../services";
import { useNewChat } from "../hooks/useNewChat";
import { useNavigate } from "react-router-dom";
import useChatStore from "../store/chatStore";
import { useUser } from "../hooks/useUser";
import { AvatarMenu } from "../components/AvatarMenu";
import { useMessages } from "../hooks/useMessages";
import { useAuthCheck } from "../hooks/useAuthCheck";
import { useSendMessage } from "../hooks/useSendMessage";
import { useStreamTimeout } from "../hooks/useStreamTimeout";
import { startProviderLogout } from "../lib/authFlow";
import { useEffect, useState, useRef, useMemo } from "react";
import { useInfiniteScroll } from "../hooks/useInfiniteScroll";
import { useConversationInit } from "../hooks/useConversationInit";
import { getUserInitials, getDisplayName } from "../lib/userUtils";
import { useInfiniteConversations } from "../hooks/useInfiniteConversations";
import type { MessageWithStreaming } from "../types/conversation";
import { replayAguiEvents } from "../utils/replayAguiEvents";
// Import Message type from design-components (includes events field)
import type {
  Message as ChatMessage,
  ToolCall,
  StepMessage,
} from "@vonlabs/design-components";
import { TopBar, ChatSidebar, Chat, Banner } from "@vonlabs/design-components";
import {
  CONVERSATIONS_PAGE_LIMIT,
  MESSAGES_PAGE_LIMIT,
} from "../config/constants";

const Dashboard = () => {
  const navigate = useNavigate();
  useAuthCheck();
  const { user, isConnectionError, refetch } = useUser();

  // Chat state management
  const { currentConversationId, setCurrentConversationId, messages } =
    useChatStore();
  const conversationMessages = currentConversationId
    ? messages[currentConversationId] || []
    : [];

  // Initialize conversation (load latest or create new)
  const { isInitializing, error: initError } = useConversationInit();

  // New chat creation
  const { createNewChat, isCreating: isCreatingNewChat } = useNewChat();

  // Fetch conversations with infinite scroll for sidebar
  const {
    data: infiniteConversationsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteConversations(CONVERSATIONS_PAGE_LIMIT);

  // Infinite scroll hook for loading more conversations
  const loadMoreConversationsRef = useInfiniteScroll({
    onLoadMore: () => fetchNextPage(),
    hasMore: !!hasNextPage,
    isLoading: isFetchingNextPage,
  });

  // Fetch messages for current conversation with infinite scroll
  const {
    fetchNextPage: fetchNextMessagePage,
    hasNextPage: hasNextMessagePage,
    isFetchingNextPage: isFetchingNextMessagePage,
    isLoading: isLoadingMessages,
    refetch: refetchMessages,
  } = useMessages(currentConversationId, MESSAGES_PAGE_LIMIT);

  // Infinite scroll hook for loading older messages
  const loadMoreMessagesRef = useInfiniteScroll({
    onLoadMore: () => fetchNextMessagePage(),
    hasMore: !!hasNextMessagePage,
    isLoading: isFetchingNextMessagePage,
  });

  // Send message mutation
  const { mutate: sendMessage } = useSendMessage();

  // UI state
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const [avatarRect, setAvatarRect] = useState<DOMRect | undefined>();
  const [showConnectionBanner, setShowConnectionBanner] = useState(false);
  const avatarButtonRef = useRef<HTMLDivElement>(null);

  // Show/hide connection banner based on connection error state
  useEffect(() => {
    if (isConnectionError) {
      setShowConnectionBanner(true);
    }
  }, [isConnectionError]);

  // Handle retry connection
  const handleRetry = async () => {
    if (import.meta.env.DEV) {
      console.log("[Dashboard] Retrying connection...");
    }
    await refetch();
  };

  // Handle avatar click
  const handleAvatarClick = () => {
    if (avatarButtonRef.current) {
      setAvatarRect(avatarButtonRef.current.getBoundingClientRect());
    }
    setIsAvatarMenuOpen(true);
  };

  // Handle Settings click
  const handleSettingsClick = () => {
    navigate("/settings");
  };

  // Handle Logout click
  const handleLogoutClick = async () => {
    if (import.meta.env.DEV) {
      console.log("[Dashboard] Logout clicked");
    }

    try {
      // Call backend logout to invalidate token and get redirect URL
      const response = await authService.logout();
      if (import.meta.env.DEV) {
        console.log(
          "[Dashboard] Backend logout successful, redirect URL:",
          response.redirectUrl,
        );
      }

      // Clear all local auth tokens
      const { clearAllAuth } = await import("../lib/auth");
      clearAllAuth();

      // Redirect to the URL provided by backend
      if (response.redirectUrl) {
        window.location.href = response.redirectUrl;
      } else {
        // Fallback to default logout flow if no redirect URL provided
        if (import.meta.env.DEV) {
          console.warn(
            "[Dashboard] No redirect URL provided, using default logout flow",
          );
        }
        startProviderLogout();
      }
    } catch (error) {
      // Log error but continue with logout flow
      if (import.meta.env.DEV) {
        console.error("[Dashboard] Backend logout failed:", error);
      }
      // Still clear local tokens and redirect, even if backend call fails
      startProviderLogout();
    }
  };

  // Chat handlers
  const handleChatClick = (conversationId: string) => {
    setCurrentConversationId(conversationId);
  };

  const handleNewChatClick = async () => {
    try {
      await createNewChat();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("[Dashboard] Failed to create new chat:", error);
      }
    }
  };

  const handleSearchChange = (value: string) => {
    // TODO: Implement search in next phase
    console.log("Search:", value);
  };

  const handleChatError = (error: Error) => {
    if (import.meta.env.DEV) {
      console.error("[Dashboard] Chat error:", error);
    }
  };

  const handleSendMessage = (content: string) => {
    sendMessage(content);
  };

  // Handle Pusher messages from Chat component
  const handlePusherMessage = (chatMessage: ChatMessage) => {
    if (!currentConversationId) return;

    // Convert Chat component message format to backend message format
    // Preserve streaming metadata as optional fields
    const backendMessage: MessageWithStreaming = {
      id: chatMessage.id,
      conversationId: currentConversationId,
      messageType: "text",
      messageContent: chatMessage.content,
      role: chatMessage.type,
      createdAt:
        chatMessage.timestamp?.toISOString() || new Date().toISOString(),
      createdBy: chatMessage.type === "user" ? "current-user" : "assistant",
      // Preserve streaming state
      isStreaming: chatMessage.isStreaming,
      isReasoningStreaming: chatMessage.isReasoningStreaming,
      reasoningContent: chatMessage.reasoningContent,
      events: chatMessage.events,
      // Preserve AGUI streaming data
      stepMessages: chatMessage.stepMessages as StepMessage[],
      toolCalls: chatMessage.toolCalls as ToolCall[],
    };

    // Add or update message in Zustand store
    const currentMessages = messages[currentConversationId] || [];
    const existingIndex = currentMessages.findIndex(
      (m) => m.id === backendMessage.id,
    );

    if (existingIndex >= 0) {
      // Update existing message (for streaming updates)
      const updatedMessages = [...currentMessages];
      updatedMessages[existingIndex] = backendMessage;
      useChatStore
        .getState()
        .setMessages(currentConversationId, updatedMessages);
    } else {
      // Add new message
      useChatStore.getState().addMessage(currentConversationId, backendMessage);
    }
  };

  // Handle stream timeout - refetch messages from backend
  const handleStreamTimeout = async (messageId: string) => {
    if (import.meta.env.DEV) {
      console.warn(
        `[Dashboard] Message ${messageId} timed out, refetching messages...`,
      );
    }

    // Refetch messages to get the latest status from backend
    // Backend will have marked this message as TIMEOUT
    if (refetchMessages) {
      await refetchMessages();
    }
  };

  // Cache for replayed events to avoid reprocessing on every render
  const replayCache = useRef<
    Map<
      string,
      { content: string; stepMessages: StepMessage[]; toolCalls: ToolCall[] }
    >
  >(new Map());

  // Transform backend messages to Chat component format
  // Use useMemo to avoid recreating on every render
  const transformedMessages: ChatMessage[] = useMemo(() => {
    return conversationMessages.map((msg) => {
      const streamingMsg = msg as MessageWithStreaming;

      // For fetched messages with events, replay them to reconstruct stepMessages and toolCalls
      let content = streamingMsg.messageContent;
      let stepMessages = (streamingMsg as MessageWithStreaming).stepMessages;
      let toolCalls = (streamingMsg as MessageWithStreaming).toolCalls;

      // If message has events but no stepMessages/toolCalls, replay the events
      // Only replay for completed messages (not streaming) to avoid performance issues
      if (
        streamingMsg.events &&
        streamingMsg.events.length > 0 &&
        !streamingMsg.isStreaming &&
        !stepMessages &&
        !toolCalls
      ) {
        // Check cache first
        const cacheKey = `${streamingMsg.id}-${streamingMsg.events.length}`;
        let replayed = replayCache.current.get(cacheKey);

        if (!replayed) {
          // Not in cache, replay the events
          replayed = replayAguiEvents(streamingMsg.events);
          if (replayed) {
            replayCache.current.set(cacheKey, replayed);
          }
        }

        if (replayed) {
          content = replayed.content || content;
          stepMessages = replayed.stepMessages;
          toolCalls = replayed.toolCalls;
        }
      }

      const transformed: ChatMessage = {
        id: streamingMsg.id,
        type:
          streamingMsg.role === "user"
            ? ("user" as const)
            : ("assistant" as const),
        content,
        timestamp: new Date(streamingMsg.createdAt),
        // Preserve streaming state if present
        isStreaming: streamingMsg.isStreaming || false,
        isReasoningStreaming: streamingMsg.isReasoningStreaming || false,
        reasoningContent: streamingMsg.reasoningContent,
        // Include AGUI streaming data (for both live streams and fetched messages)
        toolCalls,
        stepMessages,
        // Include status and error fields for persistence
        status: streamingMsg.status,
        errorMessage: streamingMsg.errorMessage,
        // Pass events array for event-driven rendering (for future use)
        events: streamingMsg.events,
      };

      return transformed;
    });
  }, [conversationMessages]);

  // Client-side timeout detection (60 seconds)
  // This triggers a refetch to get the latest status from backend
  // Use conversationMessages (MessageWithStreaming[]) instead of transformedMessages (Message[])
  useStreamTimeout(
    conversationMessages as MessageWithStreaming[],
    currentConversationId,
    {
      timeoutMs: 60000, // 60 seconds
      onTimeout: handleStreamTimeout,
    },
  );

  // Compute avatar props from user data
  const avatarLabel = user ? getUserInitials(user.name, user.email) : undefined;
  const avatarSrc =
    typeof user?.avatarUrl === "string" ? user.avatarUrl : undefined;
  const displayName = user
    ? getDisplayName(user.name, user.firstName, user.lastName, user.email)
    : undefined;

  // Flatten paginated conversations data
  const allConversations =
    infiniteConversationsData?.pages.flatMap((page) => page.data) || [];

  // Transform conversations for ChatSidebar - use conversationId (UUID) as primary identifier
  const chatItems = allConversations.map((conv) => ({
    id: conv.conversationId, // Use UUID instead of MongoDB ObjectId
    label: conv.title,
    timestamp: new Date(conv.updatedAt || conv.createdAt).toLocaleString(),
  }));

  // Memoize pusherConfig to prevent unnecessary Pusher reconnections
  const pusherConfig = useMemo(
    () => ({
      key: import.meta.env.VITE_PUSHER_KEY || "",
      cluster: import.meta.env.VITE_PUSHER_CLUSTER || "",
      authEndpoint: import.meta.env.VITE_PUSHER_AUTH_ENDPOINT,
      tenantId: user?.tenantId,
      userId: user?.id,
    }),
    [user?.tenantId, user?.id],
  );

  return (
    <div className="h-screen bg-[#f5f5f7] flex flex-col items-center overflow-hidden">
      {/* Connection Error Banner */}
      {showConnectionBanner && (
        <Banner
          variant="error"
          message="Issue Connecting to Backend Services"
          onClose={() => setShowConnectionBanner(false)}
          action={{ label: "Retry", onClick: handleRetry }}
          dismissible={true}
        />
      )}

      {/* Initialization Error Banner */}
      {initError && (
        <Banner
          variant="error"
          message="Failed to load conversations"
          onClose={() => {}}
          dismissible={false}
        />
      )}

      {/* Max-width container for large screens */}
      <div className="w-full max-w-[1440px] h-full flex flex-col overflow-hidden">
        {/* TopBar in White Rounded Container */}
        <div className="m-4 mb-2 rounded-xl overflow-hidden bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <div ref={avatarButtonRef}>
            <TopBar
              logoSrc="/logo.gif"
              onLogoClick={() => navigate("/dashboard")}
              showMenu={false}
              avatarLabel={avatarLabel}
              avatarSrc={avatarSrc}
              onAvatarClick={handleAvatarClick}
            />
          </div>
        </div>

        {/* Avatar Menu Dropdown */}
        <AvatarMenu
          userName={displayName}
          userEmail={user?.email}
          isOpen={isAvatarMenuOpen}
          onClose={() => setIsAvatarMenuOpen(false)}
          onSettingsClick={handleSettingsClick}
          onLogoutClick={handleLogoutClick}
          triggerRect={avatarRect}
        />

        {/* Two-Pane Layout with Rounded Corners */}
        <div className="flex flex-1 px-4 pb-4 gap-2 overflow-hidden min-h-0">
          {/* Left Pane - ChatSidebar with rounded corners and infinite scroll */}
          <div className="chat-sidebar-wrapper w-[280px] h-full flex flex-col min-h-0 rounded-xl overflow-hidden bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            <ChatSidebar
              chatItems={chatItems}
              selectedChatId={currentConversationId || undefined}
              onChatClick={handleChatClick}
              onNewChatClick={handleNewChatClick}
              onSearchChange={handleSearchChange}
              searchPlaceholder="Search conversations..."
              loadMoreRef={loadMoreConversationsRef}
              isFetchingMore={isFetchingNextPage}
              hasNextPage={!!hasNextPage}
              onLoadMore={() => fetchNextPage()}
            />
          </div>

          {/* Right Pane - Chat with rounded corners */}
          <div className="flex-1 flex min-w-0">
            {isInitializing ||
            isCreatingNewChat ||
            (isLoadingMessages && conversationMessages.length === 0) ? (
              <div className="flex-1 flex items-center justify-center bg-white rounded-xl text-sm text-[#666]">
                {isCreatingNewChat
                  ? "Creating new chat..."
                  : isLoadingMessages
                    ? "Loading messages..."
                    : "Loading chat..."}
              </div>
            ) : (
              <Chat
                title="von AI"
                userId={user?.id}
                userName={user?.name || user?.firstName}
                userEmail={user?.email}
                apiBaseUrl={import.meta.env.VITE_API_BASE_URL}
                pusherConfig={pusherConfig}
                conversationId={currentConversationId || undefined}
                enableRealtime={
                  !!currentConversationId &&
                  !!import.meta.env.VITE_PUSHER_KEY &&
                  !!import.meta.env.VITE_PUSHER_CLUSTER
                }
                messages={transformedMessages}
                onSendMessage={handleSendMessage}
                onPusherMessage={handlePusherMessage}
                isLoading={false}
                loadMoreRef={loadMoreMessagesRef}
                isFetchingMore={isFetchingNextMessagePage}
                placeholder="Ask von anything"
                onError={handleChatError}
                variant="floating"
                height="100%"
                width="100%"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
