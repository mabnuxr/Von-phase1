import { authService } from "../services";
import { useNewChat } from "../hooks/useNewChat";
import { useNavigate, useParams } from "react-router-dom";
import useChatStore from "../store/chatStore";
import { useUser } from "../hooks/useUser";
import { AvatarMenu } from "../components/AvatarMenu";
import { useMessages } from "../hooks/useMessages";
import { useAuthCheck } from "../hooks/useAuthCheck";
import { useSendMessage } from "../hooks/useSendMessage";
import { useStopStreaming } from "../hooks/useStopStreaming";
import { useStreamTimeout } from "../hooks/useStreamTimeout";
import { useSidebarState } from "../hooks/useSidebarState";
import { useSalesforceConnection } from "../hooks/useSalesforceConnection";
import { startProviderLogout } from "../lib/authFlow";
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useInfiniteScroll } from "../hooks/useInfiniteScroll";
import { useConversationInit } from "../hooks/useConversationInit";
import { getUserInitials, getDisplayName } from "../lib/userUtils";
import { getDisplayTitle } from "../lib/conversationUtils";
import { useInfiniteConversations } from "../hooks/useInfiniteConversations";
import { useConversationTitleUpdate } from "../hooks/useConversationTitleUpdate";
import type { MessageWithStreaming } from "../types/conversation";
import { replayAguiEvents } from "../utils/replayAguiEvents";
import { useArtifact } from "../hooks/useArtifact";
// Import Message type from design-components (includes events field)
import type {
  Message as ChatMessage,
  ToolCall,
  StepMessage,
} from "@vonlabs/design-components";
import { TopBar, ChatSidebar, Chat, Banner } from "@vonlabs/design-components";
import { motion } from "framer-motion";
import {
  CONVERSATIONS_PAGE_LIMIT,
  MESSAGES_PAGE_LIMIT,
  STREAM_TIMEOUT_MS,
  LOGO_URL,
} from "../config/constants";

const Dashboard = () => {
  const navigate = useNavigate();
  const { conversationId: urlConversationId } = useParams<{
    conversationId?: string;
  }>();
  useAuthCheck();
  const { user, isConnectionError, refetch } = useUser();

  // Chat state management
  const { currentConversationId, setCurrentConversationId, messages } =
    useChatStore();
  const conversationMessages = useMemo(
    () => (currentConversationId ? messages[currentConversationId] || [] : []),
    [currentConversationId, messages],
  );

  // Initialize conversation (load latest or create new)
  const { isInitializing, error: initError } =
    useConversationInit(urlConversationId);

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

  // Stop streaming mutation
  const { mutate: stopStreaming } = useStopStreaming();

  // Listen for conversation title updates via Pusher
  const { updatedTitle, clearUpdatedTitle } = useConversationTitleUpdate(
    currentConversationId,
    import.meta.env.VITE_PUSHER_KEY || "",
    import.meta.env.VITE_PUSHER_CLUSTER || "",
    user?.tenantId,
    user?.id,
  );

  // Check Salesforce connection status
  const {
    isConnected: isSalesforceConnected,
    isAuthenticated: isSalesforceAuthenticated,
  } = useSalesforceConnection();

  // UI state
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const [avatarRect, setAvatarRect] = useState<DOMRect | undefined>();
  const [showConnectionBanner, setShowConnectionBanner] = useState(false);
  const [shouldShakeBanner, setShouldShakeBanner] = useState(false);
  const avatarButtonRef = useRef<HTMLDivElement>(null);

  // Sidebar collapse state
  const { isCollapsed: isSidebarCollapsed, toggleCollapse: toggleSidebar } =
    useSidebarState();

  // Track animated titles for smooth typing effect
  const [animatedTitles, setAnimatedTitles] = useState<Map<string, string>>(
    new Map(),
  );

  // Message filtering state for ChatGPT-style visual clearing
  // Track which messages to show (index in messages array)
  // When user sends new message, we set this to current length to hide old messages
  const [showMessagesFromIndex, setShowMessagesFromIndex] = useState<number>(0);

  // Auto-populate input when error occurs
  const [autoPopulatedInput, setAutoPopulatedInput] = useState("");

  // Track last user message for reliable error recovery
  const lastUserMessageRef = useRef<string>("");

  // Reset message filtering when conversation changes
  useEffect(() => {
    setShowMessagesFromIndex(0);
  }, [currentConversationId]);

  // Handle title updates with typing animation
  useEffect(() => {
    if (!updatedTitle || !currentConversationId) return;

    if (import.meta.env.DEV) {
      console.log(
        "[Dashboard] Title update received:",
        updatedTitle,
        "for conversation:",
        currentConversationId,
      );
    }

    // Use interval for typing animation instead of recursive setTimeout
    let currentIndex = 0;
    const targetTitle = updatedTitle;
    let clearTimer: ReturnType<typeof setTimeout> | null = null;

    const interval = setInterval(() => {
      if (currentIndex <= targetTitle.length) {
        const partial = targetTitle.substring(0, currentIndex);
        setAnimatedTitles((prev) => {
          const newMap = new Map(prev);
          newMap.set(currentConversationId, partial);
          return newMap;
        });
        currentIndex++;
      } else {
        // Animation complete
        clearInterval(interval);

        // Keep final title for 1 second before clearing
        clearTimer = setTimeout(() => {
          setAnimatedTitles((prev) => {
            const newMap = new Map(prev);
            newMap.delete(currentConversationId);
            return newMap;
          });
          clearUpdatedTitle();
        }, 1000);
      }
    }, 30); // 30ms per character for smooth typing

    // CRITICAL: Cleanup interval and timer on unmount or dependency change
    return () => {
      clearInterval(interval);
      if (clearTimer) {
        clearTimeout(clearTimer);
      }
    };
  }, [updatedTitle, currentConversationId, clearUpdatedTitle]);

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

  // Sync URL param to Zustand store when URL changes
  useEffect(() => {
    if (urlConversationId && urlConversationId !== currentConversationId) {
      console.log(
        "[Dashboard] Setting current conversation id to ",
        urlConversationId,
      );
      setCurrentConversationId(urlConversationId);
    }
  }, [urlConversationId, currentConversationId, setCurrentConversationId]);

  // Chat handlers
  const handleChatClick = (conversationId: string) => {
    navigate(`/chat/${conversationId}`);
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

  const handleSendMessage = (content: string) => {
    // Track last user message for error recovery
    lastUserMessageRef.current = content;

    // Set the index to current message count to hide old messages
    // This creates the ChatGPT-style clean slate effect
    if (currentConversationId) {
      const currentMessages = messages[currentConversationId] || [];
      setShowMessagesFromIndex(currentMessages.length);
    }
    sendMessage(content);
  };

  const handleStopStreaming = useCallback(
    (conversationId: string) => {
      stopStreaming(conversationId, {
        onSuccess: () => {
          if (import.meta.env.DEV) {
            console.log("[Dashboard] Stop signal sent successfully");
          }
        },
        onError: (error) => {
          console.error("[Dashboard] Failed to stop streaming:", error);
        },
      });
    },
    [stopStreaming],
  );

  // Handle AGUI state updates from useAguiMessageStream hook
  const handleAguiStateUpdate = (update: {
    runId: string;
    messageContent: string;
    stepMessages: StepMessage[];
    toolCalls: ToolCall[];
    isStreaming: boolean;
    status: "created" | "streaming" | "completed" | "failed";
    stoppedByUser?: boolean;
    errorMessage?: string;
  }) => {
    if (!currentConversationId) return;

    // Auto-populate input when error occurs (with smooth delay)
    if (update.status === "failed" && update.errorMessage) {
      const userMessage = lastUserMessageRef.current;

      if (userMessage) {
        // Delay for subtle, intentional feel (400ms gives user time to process error)
        setTimeout(() => {
          setAutoPopulatedInput(userMessage);
        }, 400);
      }
    }

    // Direct AGUI state to backend message format (no transformation needed)
    const backendMessage: MessageWithStreaming = {
      id: update.runId,
      runId: update.runId,
      conversationId: currentConversationId,
      messageType: "text",
      messageContent: update.messageContent,
      role: "assistant",
      createdAt: new Date().toISOString(),
      createdBy: "assistant",
      // AGUI streaming data
      stepMessages: update.stepMessages,
      toolCalls: update.toolCalls,
      isStreaming: update.isStreaming,
      status: update.status,
      stoppedByUser: update.stoppedByUser,
      // Error handling data
      errorMessage: update.errorMessage,
    };

    // Use atomic upsert to prevent race conditions
    useChatStore
      .getState()
      .upsertMessage(currentConversationId, backendMessage);
  };

  // Handle user message from Pusher (backend confirmation)
  const handleUserMessage = (data: {
    id: string;
    conversationId: string;
    messageContent: string;
    messageType: string;
    role: "user";
    createdAt: string;
    createdBy: string;
  }) => {
    if (import.meta.env.DEV) {
      console.log("[Dashboard] Received user_message event:", data);
    }

    // Add user message to store
    const userMessage: MessageWithStreaming = {
      id: data.id,
      runId: data.id, // User messages don't have separate runId
      conversationId: data.conversationId,
      messageContent: data.messageContent,
      messageType: data.messageType as "text" | "json" | "markdown",
      role: data.role,
      createdAt: data.createdAt,
      createdBy: data.createdBy,
      isStreaming: false,
      status: "completed",
    };

    useChatStore.getState().upsertMessage(data.conversationId, userMessage);

    if (import.meta.env.DEV) {
      console.log("[Dashboard] Added user message to store:", data.id);
    }
  };

  // Handle stream timeout - force clear state and refetch messages from backend
  // Wrapped in useCallback to prevent timer resets in useStreamTimeout
  const handleStreamTimeout = useCallback(
    async (messageId: string) => {
      if (!currentConversationId) return;

      // FIX: Force clear streaming state immediately (re-enables input)
      // This ensures the UI is responsive even if backend is down
      useChatStore
        .getState()
        .markMessageTimeout(currentConversationId, messageId);

      // THEN refetch messages to get the latest status from backend
      // Backend will have marked this message as TIMEOUT or soft-deleted it
      if (refetchMessages) {
        await refetchMessages();
      }
    },
    [currentConversationId, refetchMessages],
  );

  // Transform backend messages to Chat component format
  // Replay events if backend hasn't persisted stepMessages/toolCalls
  const transformedMessages: ChatMessage[] = useMemo(() => {
    return conversationMessages.map((msg) => {
      const streamingMsg = msg as MessageWithStreaming;

      // For fetched messages with events, replay them to reconstruct stepMessages and toolCalls
      let content = streamingMsg.messageContent;
      let stepMessages = streamingMsg.stepMessages;
      let toolCalls = streamingMsg.toolCalls;
      let stoppedByUser = streamingMsg.stoppedByUser;

      // If message has events but no stepMessages/toolCalls, replay the events
      if (
        streamingMsg.events &&
        streamingMsg.events.length > 0 &&
        !streamingMsg.isStreaming &&
        (!stepMessages || !toolCalls || !content)
      ) {
        const replayedData = replayAguiEvents(streamingMsg.events);
        if (replayedData) {
          content = replayedData.content || content;
          stepMessages = replayedData.stepMessages;
          toolCalls = replayedData.toolCalls;
          stoppedByUser = replayedData.stoppedByUser ?? stoppedByUser;
        }
      }

      return {
        id: streamingMsg.id,
        type:
          streamingMsg.role === "user"
            ? ("user" as const)
            : ("assistant" as const),
        content,
        timestamp: new Date(streamingMsg.createdAt),
        isStreaming: streamingMsg.isStreaming || false,
        isReasoningStreaming: streamingMsg.isReasoningStreaming || false,
        reasoningContent: streamingMsg.reasoningContent,
        // AGUI data (from backend or replayed)
        toolCalls,
        stepMessages,
        status: streamingMsg.status,
        errorMessage: streamingMsg.errorMessage,
        events: streamingMsg.events,
        // IDs for artifact fetching and retry operations
        messageId: streamingMsg.id, // Use actual message ID for API calls
        runId: streamingMsg.runId, // Preserve run ID separately
        conversationId: streamingMsg.conversationId,
        stoppedByUser,
      } as ChatMessage;
    });
  }, [conversationMessages]);

  // Force complete message handler for timeout
  // Wrapped in useCallback to prevent timer resets in useStreamTimeout
  const handleForceComplete = useCallback(
    (messageId: string) => {
      if (currentConversationId) {
        useChatStore
          .getState()
          .forceCompleteMessage(currentConversationId, messageId);
      }
    },
    [currentConversationId],
  );

  // Client-side timeout detection (5 minutes)
  // This triggers a refetch to get the latest status from backend
  // Use conversationMessages (MessageWithStreaming[]) instead of transformedMessages (Message[])
  useStreamTimeout(
    conversationMessages as MessageWithStreaming[],
    currentConversationId,
    {
      timeoutMs: STREAM_TIMEOUT_MS,
      onTimeout: handleStreamTimeout,
      onForceComplete: handleForceComplete,
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
  // Filter out conversations with empty titles (not yet named by LLM)
  const chatItems = allConversations
    .filter((conv) => conv.title && conv.title.trim() !== "")
    .map((conv) => {
      // Check if this conversation has an animated title in progress
      const animatedTitle = animatedTitles.get(conv.conversationId);
      const displayTitle = animatedTitle || getDisplayTitle(conv.title);

      return {
        id: conv.conversationId, // Use UUID instead of MongoDB ObjectId
        label: displayTitle, // Use animated title if available, otherwise use regular title
        timestamp: new Date(conv.updatedAt || conv.createdAt).toLocaleString(),
        href: `/chat/${conv.conversationId}`, // Add href for proper link behavior
      };
    });

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

  // Determine if Salesforce is properly connected
  const isSalesforceReady = isSalesforceConnected && isSalesforceAuthenticated;

  // Create Salesforce connection banner
  const salesforceBanner = useMemo(() => {
    if (isSalesforceReady) {
      return null;
    }

    return (
      <motion.div
        className="px-6 max-w-4xl mx-auto w-full"
        animate={
          shouldShakeBanner
            ? {
                x: [0, -10, 10, -10, 10, 0],
                transition: { duration: 0.4 },
              }
            : {}
        }
        onAnimationComplete={() => setShouldShakeBanner(false)}
      >
        <div className="p-2 mt-2 flex flex-row justify-between bg-amber-50 border border-amber-200 rounded-xl">
          <p className="pl-2 text-sm text-amber-800">
            Salesforce integration not connected.
          </p>
          <a
            href="/settings?tab=integrations"
            className="pr-2 text-sm text-von-purple hover:text-von-purple-600 font-medium hover:scale-105"
          >
            Go to Integrations →
          </a>
        </div>
      </motion.div>
    );
  }, [isSalesforceReady, shouldShakeBanner]);

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

      {/* Full-width container */}
      <div className="w-full h-full flex flex-col overflow-hidden">
        {/* TopBar in White Rounded Container */}
        <div className="m-4 mb-2 rounded-xl overflow-hidden bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <div ref={avatarButtonRef}>
            <TopBar
              logoSrc={LOGO_URL}
              logoText="Von"
              onLogoClick={() => navigate("/chat")}
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
          <div
            className="chat-sidebar-wrapper h-full flex flex-col min-h-0 rounded-xl overflow-hidden bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all duration-300"
            style={{ width: isSidebarCollapsed ? "64px" : "280px" }}
          >
            <ChatSidebar
              chatItems={chatItems}
              selectedChatId={currentConversationId || undefined}
              onChatClick={handleChatClick}
              onNewChatClick={handleNewChatClick}
              searchPlaceholder="Search conversations..."
              isCollapsed={isSidebarCollapsed}
              onToggleCollapse={toggleSidebar}
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
                onStopStreaming={handleStopStreaming}
                onAguiStateUpdate={handleAguiStateUpdate}
                onUserMessage={handleUserMessage}
                inputValue={autoPopulatedInput}
                onInputValueChange={setAutoPopulatedInput}
                isLoading={false}
                loadMoreRef={loadMoreMessagesRef}
                isFetchingMore={isFetchingNextMessagePage}
                placeholder="Ask von anything"
                variant="floating"
                height="100%"
                width="100%"
                showMessagesFromIndex={showMessagesFromIndex}
                useArtifactHook={useArtifact}
                banner={salesforceBanner}
                disableSubmit={!isSalesforceReady}
                examplePromptsDisabled={!isSalesforceReady}
                onExamplePromptDisabledClick={() => setShouldShakeBanner(true)}
                onInputWhileDisabled={() => setShouldShakeBanner(true)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
