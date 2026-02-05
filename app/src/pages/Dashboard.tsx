import { authService, conversationsService } from "../services";
import { config } from "../config";
import { useNavigate, useParams } from "react-router-dom";
import {
  useCreateConversation,
  conversationKeys,
} from "../hooks/useConversations";
import { generateConversationTitle } from "../lib/conversationUtils";
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
import { useFeatureFlag } from "../hooks/useFeatureFlag";
import { startProviderLogout } from "../lib/authFlow";
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useInfiniteScroll } from "../hooks/useInfiniteScroll";
import { useConversationInit } from "../hooks/useConversationInit";
import { getUserInitials, getDisplayName } from "../lib/userUtils";
import { useInfiniteConversations } from "../hooks/useInfiniteConversations";
import { useChatSidebarV2 } from "../hooks/useChatSidebarV2";
import {
  transformConversationsToChatItems,
  handleToolApproval,
  handleToolRejection,
  transformConversationMessages,
} from "../lib/dashboardUtils";
import {
  agentModeToConversationMode,
  conversationModeToAgentMode,
  DEFAULT_AGENT_MODE,
} from "../lib/conversationModeUtils";
import { SalesforceConnectionBanner } from "../components/SalesforceConnectionBanner";
import { SubscriptionInactiveBanner } from "../components/SubscriptionInactiveBanner";
import { useUserPusherChannel } from "../hooks/useUserPusherChannel";
import { useConversationPusherChannel } from "../hooks/useConversationPusherChannel";
import { useConversationPusherChannelV2 } from "../hooks/useConversationPusherChannelV2";
import {
  UserChannelEvents,
  type ConversationTitleUpdatedEvent,
} from "../types/userChannelEvents";
import type { MessageWithStreaming } from "../types/conversation";
import { useLazyTransparencyArtifacts } from "../hooks/useMessageArtifacts";
import { LazyTransparencyDrawer } from "../components/LazyTransparencyDrawer";
import { DeepResearchConversation } from "../components/DeepResearchConversation";
import { ArtifactPaneContainer } from "../components/ArtifactPaneContainer";
import { SingleArtifactDrawerContainer } from "../components/SingleArtifactDrawerContainer";
import { useArtifactState } from "../hooks/useArtifactState";
import {
  TopBar,
  ChatSidebar,
  ChatSidebarV2,
  Chat,
  ChatSkeleton,
  Banner,
  DashboardCanvas,
} from "@vonlabs/design-components";
import type { AgentMode, SendMessageOptions } from "@vonlabs/design-components";
import { motion } from "framer-motion";
import {
  CONVERSATIONS_PAGE_LIMIT,
  MESSAGES_PAGE_LIMIT,
  STREAM_TIMEOUT_MS,
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

  // New chat creation mutation
  const { mutateAsync: createConversation } = useCreateConversation();

  // Track new chat creation state (instant feedback + target tracking)
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [pendingConversationId, setPendingConversationId] = useState<
    string | null
  >(null);

  // Fetch conversations with infinite scroll for sidebar (V1)
  const {
    data: infiniteConversationsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteConversations(CONVERSATIONS_PAGE_LIMIT);

  // Fetch sidebar data with folders (V2)
  const {
    folders: sidebarV2Folders,
    items: sidebarV2Items,
    folderItems: sidebarV2FolderItems,
    folderLoadingMap: sidebarV2FolderLoadingMap,
    isLoading: isSidebarV2Loading,
    createFolder,
    deleteFolder,
    renameFolder,
    toggleFolderExpanded,
    moveConversationToFolder,
    newlyCreatedFolderId,
    clearNewlyCreatedFolderId,
    createFolderAndMoveItem,
  } = useChatSidebarV2();

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

  // State for title update animation (received from user channel)
  const [titleUpdate, setTitleUpdate] = useState<{
    conversationId: string;
    title: string;
  } | null>(null);

  // Get query client for cache invalidation
  const queryClient = useQueryClient();

  // Check Salesforce connection status
  const {
    isConnected: isSalesforceConnected,
    isAuthenticated: isSalesforceAuthenticated,
    integration: salesforceIntegration,
  } = useSalesforceConnection();

  // Feature flags
  const {
    isSlashCommandsEnabled,
    isActionsEnabled,
    isDeepLinksEnabled,
    isSidebarV2,
    isAgentV2,
    isDeepResearchEnabled,
    isSourcesEnabled,
    isTenantDisabled,
  } = useFeatureFlag();

  // Build Salesforce instance URL from integration config for deep links in approval cards
  // Only provide URL when deep links feature flag is enabled
  const salesforceInstanceUrl =
    isDeepLinksEnabled && salesforceIntegration?.config?.domain
      ? `https://${salesforceIntegration.config.domain}`
      : undefined;

  // UI state
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const [avatarRect, setAvatarRect] = useState<DOMRect | undefined>();
  const [showConnectionBanner, setShowConnectionBanner] = useState(false);
  const [shouldShakeBanner, setShouldShakeBanner] = useState(false);
  const [shouldShakeSubscriptionBanner, setShouldShakeSubscriptionBanner] =
    useState(false);

  // Dashboard canvas state
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [dashboardMessageId, setDashboardMessageId] = useState<string | null>(
    null,
  );
  const [dashboardMessageContent, setDashboardMessageContent] = useState<
    string | null
  >(null);

  // Transparency drawer state
  const [isTransparencyOpen, setIsTransparencyOpen] = useState(false);
  const [transparencyRunId, setTransparencyRunId] = useState<string | null>(
    null,
  );

  // Unified artifact state - works for both V1 (ArtifactPane) and V2 (SingleArtifactDrawer)
  const { artifactState, handleArtifactClick, closeArtifact } =
    useArtifactState();

  // Sidebar collapse state
  const { isCollapsed: isSidebarCollapsed, toggleCollapse: toggleSidebar } =
    useSidebarState();

  // Track animated titles for smooth typing effect
  const [animatedTitles, setAnimatedTitles] = useState<Map<string, string>>(
    new Map(),
  );

  // Message filtering state for ChatGPT-style visual clearing
  const showMessagesFromIndex = useChatStore((state) =>
    currentConversationId
      ? (state.showMessagesFromIndex[currentConversationId] ?? 0)
      : 0,
  );
  const resetShowMessagesFromIndex = useChatStore(
    (state) => state.resetShowMessagesFromIndex,
  );

  // Auto-populate input when error occurs
  const [autoPopulatedInput, setAutoPopulatedInput] = useState("");

  // Track last user message for reliable error recovery
  const lastUserMessageRef = useRef<string>("");

  // Agent is locked if conversation has any messages
  const isAgentLocked = conversationMessages.length > 0;

  // Get locked agent mode from backend (used when agent is locked)
  const lockedAgentMode = useMemo(() => {
    if (currentConversationId && infiniteConversationsData) {
      const allConversations = infiniteConversationsData.pages.flatMap(
        (page) => page.data,
      );
      const conversation = allConversations.find(
        (conv) => conv.conversationId === currentConversationId,
      );
      if (conversation?.mode) {
        return conversationModeToAgentMode(conversation.mode);
      }
    }
    return DEFAULT_AGENT_MODE;
  }, [currentConversationId, infiniteConversationsData]);

  // Check if we're in deep research mode (V2 only)
  const isDeepResearchMode =
    isAgentV2 && lockedAgentMode === "deep-research" && isAgentLocked;

  // Sync agent mode to backend when first message is sent
  const syncAgentModeToBackend = useCallback(
    async (agentMode: AgentMode) => {
      if (!currentConversationId) return;

      if (agentMode !== DEFAULT_AGENT_MODE) {
        try {
          const backendMode = agentModeToConversationMode(agentMode);
          await conversationsService.updateConversationMode(
            currentConversationId,
            backendMode,
          );
          // Invalidate conversations cache so lockedAgentMode picks up the new value
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
          if (import.meta.env.DEV) {
            console.log(
              "[Dashboard] Synced agent mode to backend:",
              backendMode,
            );
          }
        } catch (error) {
          console.error("[Dashboard] Failed to sync agent mode:", error);
        }
      }
    },
    [currentConversationId, queryClient],
  );

  // Simplified loading state - deterministic, no timers
  const isLoading =
    isCreatingChat ||
    pendingConversationId !== null ||
    isInitializing ||
    (isLoadingMessages && conversationMessages.length === 0);

  // User channel for title updates (same pattern as conversation channel)
  const { channel: userChannel } = useUserPusherChannel({
    tenantId: user?.tenantId,
    userId: user?.id,
  });

  // Subscribe to title updates on user channel
  useEffect(() => {
    if (!userChannel) return;

    const handleTitleUpdate = (data: ConversationTitleUpdatedEvent) => {
      if (import.meta.env.DEV) {
        console.log(
          "[Dashboard] Title update received via user channel:",
          data.title,
          "for conversation:",
          data.conversationId,
        );
      }

      // Update state to trigger animation
      setTitleUpdate({
        conversationId: data.conversationId,
        title: data.title,
      });

      // Invalidate conversations cache to refetch with new title
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    };

    if (import.meta.env.DEV) {
      console.log(
        "[Dashboard] Binding to user channel event:",
        UserChannelEvents.CONVERSATION_TITLE_UPDATED,
      );
    }

    userChannel.bind(
      UserChannelEvents.CONVERSATION_TITLE_UPDATED,
      handleTitleUpdate,
    );

    return () => {
      userChannel.unbind(
        UserChannelEvents.CONVERSATION_TITLE_UPDATED,
        handleTitleUpdate,
      );
    };
  }, [userChannel, queryClient]);

  // Handle title updates with typing animation
  useEffect(() => {
    if (!titleUpdate) return;

    const { conversationId, title } = titleUpdate;

    // Use interval for typing animation instead of recursive setTimeout
    let currentIndex = 0;
    const targetTitle = title;
    let clearTimer: ReturnType<typeof setTimeout> | null = null;

    const interval = setInterval(() => {
      if (currentIndex <= targetTitle.length) {
        const partial = targetTitle.substring(0, currentIndex);
        setAnimatedTitles((prev) => {
          const newMap = new Map(prev);
          newMap.set(conversationId, partial);
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
            newMap.delete(conversationId);
            return newMap;
          });
          setTitleUpdate(null);
        }, 1000);
      }
    }, 30);

    // CRITICAL: Cleanup interval and timer on unmount or dependency change
    return () => {
      clearInterval(interval);
      if (clearTimer) {
        clearTimeout(clearTimer);
      }
    };
  }, [titleUpdate]);

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
  const handleAvatarClick = (rect: DOMRect) => {
    setAvatarRect(rect);
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

  // FIX: Consolidated conversation switching logic
  // Single source of truth: URL param → Store update → Message reset
  // This prevents race conditions and ensures clean transitions
  useEffect(() => {
    if (urlConversationId && urlConversationId !== currentConversationId) {
      if (import.meta.env.DEV) {
        console.log(
          "[Dashboard] Switching conversation:",
          currentConversationId,
          "→",
          urlConversationId,
        );
      }

      // Step 1: Reset UI state for clean transition
      resetShowMessagesFromIndex(urlConversationId);

      // Step 2: Update current conversation ID
      // Note: We no longer clear other conversations' messages here
      // because it causes issues when switching back to a streaming chat
      // The showMessagesFromIndex mechanism handles visual state instead
      // This triggers useMessages to fetch messages for new conversation
      setCurrentConversationId(urlConversationId);
    }
  }, [urlConversationId, currentConversationId, setCurrentConversationId]);

  // Clear loading states when we arrive at the target conversation
  useEffect(() => {
    if (
      pendingConversationId &&
      currentConversationId === pendingConversationId
    ) {
      setIsCreatingChat(false);
      setPendingConversationId(null);
    }
  }, [currentConversationId, pendingConversationId]);

  // Chat handlers
  const handleChatClick = (conversationId: string) => {
    navigate(`/chat/${conversationId}`);
  };

  const handleNewChatClick = async () => {
    setIsCreatingChat(true); // Instant skeleton
    try {
      const title = generateConversationTitle();
      const response = await createConversation({ title });
      const newId = response.conversation.conversationId;
      setPendingConversationId(newId); // Track target
      await queryClient.refetchQueries({
        queryKey: conversationKeys.lists(),
      });
      navigate(`/chat/${newId}`);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("[Dashboard] Failed to create conversation:", error);
      }
      setIsCreatingChat(false);
      setPendingConversationId(null);
    }
  };

  const handleSendMessage = async (
    content: string,
    _attachments?: unknown,
    options?: SendMessageOptions,
  ) => {
    // Track last user message for error recovery
    lastUserMessageRef.current = content;

    // Sync agent mode to backend if this is the first message
    if (currentConversationId) {
      const currentMessages = messages[currentConversationId] || [];
      if (currentMessages.length === 0 && options?.agentMode) {
        await syncAgentModeToBackend(options.agentMode);
      }
    }
    sendMessage(content);
  };

  // Auto-populate input when error occurs (handled by chatStore updates from hook)
  // Monitor store changes to detect error state and auto-populate input
  const storeMessages = useChatStore.getState().messages;
  useEffect(() => {
    if (!currentConversationId) return;

    const messages = storeMessages[currentConversationId] || [];
    const lastMessage = messages[messages.length - 1];

    if (lastMessage?.status === "failed" && lastMessage?.errorMessage) {
      const userMessage = lastUserMessageRef.current;

      if (userMessage) {
        // Delay for subtle, intentional feel
        setTimeout(() => {
          setAutoPopulatedInput(userMessage);
        }, 250);
      }
    }
  }, [currentConversationId, storeMessages]);

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

  // V2 Pusher channel config - must be memoized to prevent constant effect re-runs
  const v2ChannelConfig = useMemo(
    () => ({
      conversationId: isAgentV2 ? currentConversationId : null,
      tenantId: user?.tenantId,
      userId: user?.id,
    }),
    [isAgentV2, currentConversationId, user?.tenantId, user?.id],
  );

  const v2InitialRunEvents = useMemo(() => {
    if (!isAgentV2 || !conversationMessages.length) return undefined;
    for (let i = conversationMessages.length - 1; i >= 0; i--) {
      const msg = conversationMessages[i];
      if (msg.role === "assistant" && msg.events && msg.events.length > 0) {
        return msg.events;
      }
    }
    return undefined;
  }, [isAgentV2, conversationMessages]);

  // V2 Pusher channel for TimelineThinkingProcess (only active when flag enabled)
  const {
    timelineSteps: v2TimelineSteps,
    isThinking: v2IsThinking,
    elapsedTime: v2ElapsedTime,
    finalResponse: v2FinalResponse,
    isFinalResponseStreaming: v2IsFinalResponseStreaming,
    researchResults: v2ResearchResults,
    isDeepResearchRunning: v2IsDeepResearchRunning,
    stoppedByUser: v2StoppedByUser,
    markStopped: v2MarkStopped,
  } = useConversationPusherChannelV2(v2ChannelConfig, v2InitialRunEvents);

  // Transform backend messages to Chat component format
  // Handles both V1 (simple) and V2 (timeline steps, research results) agents
  const {
    messages: transformedMessages,
    researchResults: effectiveResearchResults,
  } = useMemo(
    () =>
      transformConversationMessages(conversationMessages, isAgentV2, {
        timelineSteps: v2TimelineSteps,
        isThinking: v2IsThinking,
        elapsedTime: v2ElapsedTime,
        finalResponse: v2FinalResponse,
        isFinalResponseStreaming: v2IsFinalResponseStreaming,
        researchResults: v2ResearchResults,
        stoppedByUser: v2StoppedByUser,
      }),
    [
      conversationMessages,
      isAgentV2,
      v2TimelineSteps,
      v2ElapsedTime,
      v2FinalResponse,
      v2IsFinalResponseStreaming,
      v2IsThinking,
      v2ResearchResults,
      v2StoppedByUser,
    ],
  );

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
  const allConversations = useMemo(
    () => infiniteConversationsData?.pages.flatMap((page) => page.data) || [],
    [infiniteConversationsData?.pages],
  );

  // Transform conversations for ChatSidebar - use conversationId (UUID) as primary identifier
  // Filter out conversations with empty titles (not yet named by LLM)
  const chatItems = useMemo(
    () => transformConversationsToChatItems(allConversations, animatedTitles),
    [allConversations, animatedTitles],
  );

  // Handle convert to dashboard action
  const handleConvertToDashboard = useCallback(
    (messageId: string) => {
      // Find the message content from transformedMessages
      const message = transformedMessages.find((m) => m.id === messageId);
      if (message && message.content) {
        setDashboardMessageId(messageId);
        setDashboardMessageContent(message.content);
        setIsDashboardOpen(true);

        if (import.meta.env.DEV) {
          console.log(
            "[Dashboard] Converting message to dashboard:",
            messageId,
          );
        }
      }
    },
    [transformedMessages],
  );

  // Handle closing the dashboard canvas
  const handleCloseDashboard = useCallback(() => {
    setIsDashboardOpen(false);
    setDashboardMessageId(null);
    setDashboardMessageContent(null);
  }, []);

  // Fetch transparency artifact summaries when drawer is open (lazy loading)
  const {
    artifactSummaries: transparencyArtifactSummaries,
    isLoading: isTransparencyLoading,
  } = useLazyTransparencyArtifacts(
    isTransparencyOpen ? currentConversationId : null,
    isTransparencyOpen ? transparencyRunId : null,
  );

  // Handle transparency button click
  const handleTransparencyClick = useCallback(
    (messageId: string) => {
      // Find the message to get its runId
      const message = transformedMessages.find((m) => m.id === messageId);
      if (message?.runId) {
        setTransparencyRunId(message.runId);
        setIsTransparencyOpen(true);

        if (import.meta.env.DEV) {
          console.log(
            "[Dashboard] Opening transparency drawer for message:",
            messageId,
            "runId:",
            message.runId,
          );
        }
      }
    },
    [transformedMessages],
  );

  // Handle closing the transparency drawer
  const handleCloseTransparency = useCallback(() => {
    setIsTransparencyOpen(false);
    setTransparencyRunId(null);
  }, []);

  // Get conversation title for dashboard header
  const currentConversationTitle = useMemo(() => {
    const conversation = allConversations.find(
      (conv) => conv.conversationId === currentConversationId,
    );
    return conversation?.title || "Dashboard";
  }, [allConversations, currentConversationId]);

  // Conversation-level Pusher channel (for AGUI events)
  // Memoize config to prevent unnecessary reconnections
  const conversationChannelConfig = useMemo(
    () => ({
      conversationId: currentConversationId,
      tenantId: user?.tenantId,
      userId: user?.id,
    }),
    [currentConversationId, user?.tenantId, user?.id],
  );

  const { error: conversationChannelError } = useConversationPusherChannel(
    conversationChannelConfig,
  );

  // Stop streaming handler - marks V1 and V2 as stopped to batch remaining events
  const handleStopStreaming = useCallback(
    (conversationId: string) => {
      // Mark both V1 and V2 streaming as stopped - events will be batched until completion
      v2MarkStopped();

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
    [stopStreaming, v2MarkStopped],
  );

  // Separate pusherConfig for Chat component
  const pusherConfig = useMemo(
    () => ({
      key: import.meta.env.VITE_PUSHER_KEY || "",
      cluster: import.meta.env.VITE_PUSHER_CLUSTER || "",
      authEndpoint: `${config.apiBaseUrl}/api/v1/pusher/auth`,
      tenantId: user?.tenantId,
      userId: user?.id,
    }),
    [user?.tenantId, user?.id],
  );

  // Handle conversation channel errors
  useEffect(() => {
    if (conversationChannelError) {
      console.error(
        "[Dashboard] Conversation channel error:",
        conversationChannelError,
      );
    }
  }, [conversationChannelError]);

  // Determine if Salesforce is properly connected
  const isSalesforceReady = isSalesforceConnected && isSalesforceAuthenticated;

  // Combined submit check: both Salesforce must be ready and tenant must be active
  const canSubmit = isSalesforceReady && !isTenantDisabled;

  // Handler for when user interacts with disabled input - shakes the appropriate banner
  const handleDisabledInteraction = useCallback(() => {
    if (isTenantDisabled) {
      setShouldShakeSubscriptionBanner(true);
    } else {
      setShouldShakeBanner(true);
    }
  }, [isTenantDisabled]);

  // Tool approval handler
  const handleApproval = useCallback(
    async (toolCallId: string, runId: string) => {
      if (import.meta.env.DEV) {
        console.log("[Dashboard] handleApproval called:", {
          toolCallId,
          runId,
          currentConversationId,
        });
      }
      if (!currentConversationId) {
        console.warn("[Dashboard] handleApproval: No currentConversationId");
        return;
      }
      await handleToolApproval(toolCallId, runId, currentConversationId);
    },
    [currentConversationId],
  );

  // Tool rejection handler
  const handleRejection = useCallback(
    async (toolCallId: string, runId: string) => {
      if (import.meta.env.DEV) {
        console.log("[Dashboard] handleRejection called:", {
          toolCallId,
          runId,
          currentConversationId,
        });
      }
      if (!currentConversationId) {
        console.warn("[Dashboard] handleRejection: No currentConversationId");
        return;
      }
      await handleToolRejection(toolCallId, runId, currentConversationId);
    },
    [currentConversationId],
  );

  // Create chat banner - subscription inactive takes priority over Salesforce
  const chatBanner = isTenantDisabled ? (
    <SubscriptionInactiveBanner
      isTenantDisabled={isTenantDisabled}
      shouldShakeBanner={shouldShakeSubscriptionBanner}
      onShakeComplete={() => setShouldShakeSubscriptionBanner(false)}
    />
  ) : (
    <SalesforceConnectionBanner
      isSalesforceReady={isSalesforceReady}
      shouldShakeBanner={shouldShakeBanner}
      onShakeComplete={() => setShouldShakeBanner(false)}
    />
  );

  return (
    <div className="h-screen bg-gray-100 flex flex-col items-center overflow-hidden">
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
        <div className="bg-transparent">
          <TopBar
            onLogoClick={() => navigate("/chat")}
            showMenu={false}
            onNewChatClick={handleNewChatClick}
          />
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
        <div className="flex flex-1 px-3 pb-3 gap-2 overflow-hidden min-h-0">
          {/* Left Pane - ChatSidebar with rounded corners and infinite scroll */}
          <div
            className="chat-sidebar-wrapper h-full flex flex-col min-h-0 rounded-lg overflow-hidden bg-white shadow-xs border border-gray-200 transition-all duration-300"
            style={{ width: isSidebarCollapsed ? "64px" : "240px" }}
          >
            {isSidebarV2 ? (
              <ChatSidebarV2
                items={sidebarV2Items}
                folders={sidebarV2Folders}
                folderItems={sidebarV2FolderItems}
                folderLoadingMap={sidebarV2FolderLoadingMap}
                isLoading={isSidebarV2Loading}
                selectedItemId={currentConversationId || undefined}
                onItemClick={handleChatClick}
                onNewChatClick={handleNewChatClick}
                onNewChatFolderClick={() => createFolder("New Folder")}
                newlyCreatedFolderId={newlyCreatedFolderId}
                onDeleteFolder={deleteFolder}
                onRenameFolder={renameFolder}
                onFolderToggle={toggleFolderExpanded}
                onMoveItemToFolder={(itemId: string, folderId: string) => {
                  const item = [
                    ...sidebarV2Items,
                    ...Object.values(sidebarV2FolderItems).flat(),
                  ].find((i) => i.id === itemId);
                  moveConversationToFolder(itemId, folderId, item?.folderId);
                  clearNewlyCreatedFolderId();
                }}
                onCreateFolderAndMoveItem={(
                  itemId: string,
                  folderName: string,
                ) => {
                  const item = [
                    ...sidebarV2Items,
                    ...Object.values(sidebarV2FolderItems).flat(),
                  ].find((i) => i.id === itemId);
                  createFolderAndMoveItem(itemId, folderName, item?.folderId);
                }}
                onRemoveItemFromFolder={(itemId: string) => {
                  const item = [
                    ...sidebarV2Items,
                    ...Object.values(sidebarV2FolderItems).flat(),
                  ].find((i) => i.id === itemId);
                  moveConversationToFolder(itemId, null, item?.folderId);
                }}
                isCollapsed={isSidebarCollapsed}
                onToggleCollapse={toggleSidebar}
                loadMoreRef={loadMoreConversationsRef}
                isFetchingMore={isFetchingNextPage}
                avatarSrc={avatarSrc}
                avatarLabel={avatarLabel}
                userName={displayName}
                userEmail={user?.email}
                onSignOutClick={handleLogoutClick}
                onSettingsClick={handleSettingsClick}
              />
            ) : (
              <ChatSidebar
                chatItems={chatItems}
                selectedChatId={currentConversationId || undefined}
                onChatClick={handleChatClick}
                searchPlaceholder="Search conversations..."
                isCollapsed={isSidebarCollapsed}
                onToggleCollapse={toggleSidebar}
                loadMoreRef={loadMoreConversationsRef}
                isFetchingMore={isFetchingNextPage}
                hasNextPage={!!hasNextPage}
                onLoadMore={fetchNextPage}
                avatarSrc={avatarSrc}
                avatarLabel={avatarLabel}
                userName={displayName}
                userEmail={user?.email}
                onAvatarClick={handleAvatarClick}
              />
            )}
          </div>

          {/* Dashboard Canvas - appears when converting message to dashboard */}
          {isDashboardOpen && dashboardMessageId && dashboardMessageContent && (
            <DashboardCanvas
              title={currentConversationTitle}
              messageContent={dashboardMessageContent}
              messageId={dashboardMessageId}
              isOpen={isDashboardOpen}
              onClose={handleCloseDashboard}
              thesysApiKey={import.meta.env.VITE_THESYS_API_KEY || ""}
            />
          )}

          {/* Right Pane - Chat with rounded corners (shrinks when dashboard is open) */}
          <motion.div
            className="flex min-w-0"
            initial={false}
            animate={{
              flex: isDashboardOpen ? "0 0 35%" : "1 1 auto",
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {isLoading ? (
              <ChatSkeleton messageCount={4} />
            ) : isDeepResearchMode && transformedMessages.length > 0 ? (
              /* Deep Research Mode - dedicated component */
              <>
                {chatBanner}
                <DeepResearchConversation
                  messages={transformedMessages}
                  userName={user?.firstName || user?.name?.split(" ")[0]}
                  userEmail={user?.email}
                  conversationId={currentConversationId}
                  researchResults={effectiveResearchResults ?? undefined}
                  isDeepResearchRunning={v2IsDeepResearchRunning}
                  onSendMessage={handleSendMessage}
                  onStopStreaming={handleStopStreaming}
                  onArtifactClick={handleArtifactClick}
                  onApprove={handleApproval}
                  onReject={handleRejection}
                  placeholder="Ask von anything"
                  disableSubmit={!canSubmit}
                  onInputWhileDisabled={handleDisabledInteraction}
                  enableCommands={isSlashCommandsEnabled}
                />
              </>
            ) : (
              /* Regular Mode - standard Chat component */
              <Chat
                title="von AI"
                userId={user?.id}
                userName={user?.firstName || user?.name?.split(" ")[0]}
                userEmail={user?.email}
                apiBaseUrl={config.apiBaseUrl}
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
                onArtifactClick={handleArtifactClick}
                banner={chatBanner}
                disableSubmit={!canSubmit}
                examplePromptsDisabled={!canSubmit}
                onExamplePromptDisabledClick={handleDisabledInteraction}
                onInputWhileDisabled={handleDisabledInteraction}
                enableCommands={isSlashCommandsEnabled}
                enableActions={isActionsEnabled}
                onApprove={handleApproval}
                onReject={handleRejection}
                onConvertToDashboard={handleConvertToDashboard}
                showTransparency={isAgentV2 && isSourcesEnabled}
                onTransparencyClick={handleTransparencyClick}
                salesforceInstanceUrl={salesforceInstanceUrl}
                enableDeepLinks={isDeepLinksEnabled}
                thinkingProcessVersion={isAgentV2 ? "v2" : "v1"}
                useStandardInput={isAgentV2}
                isAgentLocked={isAgentLocked}
                lockedAgentMode={lockedAgentMode}
                showPlusMenu={isDeepResearchEnabled}
              />
            )}
          </motion.div>
        </div>

        {/* Transparency Drawer - shows data sources for a message (lazy loading) */}
        <LazyTransparencyDrawer
          isOpen={isTransparencyOpen}
          onClose={handleCloseTransparency}
          conversationId={currentConversationId}
          runId={transparencyRunId}
          artifactSummaries={transparencyArtifactSummaries}
          isListLoading={isTransparencyLoading}
          title="Data Sources"
        />

        {/* Artifact Viewer - renders V1 Pane or V2 Drawer based on thinking process version */}
        {isAgentV2 ? (
          <SingleArtifactDrawerContainer
            conversationId={currentConversationId}
            drawerState={artifactState}
            onClose={closeArtifact}
          />
        ) : (
          <ArtifactPaneContainer
            conversationId={currentConversationId}
            paneState={artifactState}
            onClose={closeArtifact}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
