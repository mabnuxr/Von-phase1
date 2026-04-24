import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { useCurrentConversation } from "../hooks/useCurrentConversation";
import { useMessages } from "../hooks/useMessages";
import useChatStore from "../store/chatStore";
import { MESSAGES_PAGE_LIMIT } from "../config/constants";
import { ChatSession } from "../components/chat/ChatSession";
import {
  conversationsService,
  type SharedConversationValidationResponse,
} from "../services/conversationsService";
import { setShareId } from "../services/apiClient";
import { useToast } from "../hooks/useToast";

/**
 * Read-only view of a shared conversation.
 *
 * Flow:
 *   1. Install the share ID on `apiClient` so every subsequent request
 *      carries the `X-Share-Id` header. The backend's
 *      `shared_read_context` dependency uses it to context-switch into
 *      the conversation owner's identity.
 *   2. Validate the share ID via `/shared/:id/validate` — returns the
 *      `conversationId` plus "shared by" metadata.
 *   3. Render `ChatSession` in read-only mode against that
 *      `conversationId`. Messages, files, artifacts, transparency
 *      drawer, dashboard previews all flow through the normal
 *      endpoints — no parallel "shared" endpoints or duplicated
 *      rendering logic.
 *
 * The share ID is cleared on unmount so that navigating back to the
 * user's own chats doesn't continue routing requests through the
 * owner's context.
 */
export default function SharedConversation() {
  const { shareId } = useParams<{ shareId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [validation, setValidation] =
    useState<SharedConversationValidationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  // Install the share ID on apiClient before any other request fires.
  useEffect(() => {
    if (!shareId) return;
    setShareId(shareId);
    return () => setShareId(null);
  }, [shareId]);

  // Validate the share ID and fetch bootstrap metadata (conversationId, sharedBy).
  useEffect(() => {
    if (!shareId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await conversationsService.validateShare(shareId);
        if (!cancelled) setValidation(result);
      } catch (err: unknown) {
        if (cancelled) return;
        const status = (err as { statusCode?: number })?.statusCode;
        setError(status === 404 ? "not_found" : "unknown");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [shareId]);

  const conversationId = validation?.conversationId ?? null;

  // Fetch the conversation + messages through the normal hooks. Because the
  // share token header is set, these calls get elevated to the owner's
  // context by the auth middleware.
  const { data: currentConversation } = useCurrentConversation(conversationId);
  const {
    fetchNextPage: fetchNextMessagePage,
    hasNextPage: hasNextMessagePage,
    isFetchingNextPage: isFetchingNextMessagePage,
    isLoading: isLoadingMessages,
    refetch: refetchMessages,
  } = useMessages(conversationId, MESSAGES_PAGE_LIMIT);

  const storeMessages = useChatStore((s) => s.messages);
  const conversationMessages = conversationId
    ? storeMessages[conversationId] || []
    : [];

  const handleNewChat = () => {
    setShareId(null);
    navigate("/chat/new");
  };

  const handleStartWithContext = async () => {
    if (!conversationId || isSummarizing) return;
    setIsSummarizing(true);
    try {
      // Must call before clearing share ID — the X-Share-Id header is what
      // elevates this request into the owner's context on the backend.
      const result =
        await conversationsService.summarizeConversation(conversationId);
      setShareId(null);
      navigate("/chat/new", { state: { prompt: result.summary } });
    } catch {
      showToast({
        message: "Couldn't summarize this chat. Please try again.",
        variant: "error",
      });
      setIsSummarizing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col flex-1 w-full h-full bg-white">
        <div className="border-b border-gray-200 px-5 py-3">
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="flex-1 px-5 py-6 space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
              <div className="h-20 w-full bg-gray-50 rounded-lg animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !validation) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 w-full h-full bg-white">
        <div className="text-center max-w-md px-6">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              className="text-gray-400"
            >
              <path
                d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            This shared chat is no longer available
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            The link may have been deactivated or the chat no longer exists.
          </p>
          <button
            onClick={handleNewChat}
            className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
          >
            Start a new chat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col flex-1 w-full h-full bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs [&_.chat-container]:!border-0 [&_.chat-container]:!rounded-none [&_.chat-container]:!shadow-none [&_.settings-scrollbar]:!pb-16">
      {/* Header — conversation name + read-only indicator + shared by */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-white shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {currentConversation?.title && (
            <span className="text-sm font-medium text-gray-900 truncate">
              {currentConversation.title}
            </span>
          )}
          <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-gray-100 text-xs font-medium text-gray-900 shrink-0">
            Read-only
          </span>
        </div>
        <span className="text-sm text-gray-500 shrink-0 ml-3">
          Shared by {validation.sharedByName}
        </span>
      </div>

      {/* Chat (read-only — no input) */}
      <div className="flex-1 min-h-0">
        {conversationId && currentConversation && (
          <ChatSession
            key={conversationId}
            conversationId={conversationId}
            currentConversation={currentConversation}
            conversationMessages={conversationMessages}
            isLoadingMessages={isLoadingMessages}
            fetchNextMessagePage={fetchNextMessagePage}
            hasNextMessagePage={!!hasNextMessagePage}
            isFetchingNextMessagePage={isFetchingNextMessagePage}
            refetchMessages={refetchMessages as () => Promise<unknown>}
            readOnly
            disableFileAttachments={!validation.allowFileAttachments}
          />
        )}
      </div>

      {/* Floating CTA: kick off a new chat pre-loaded with a summary of this one */}
      <button
        type="button"
        onClick={handleStartWithContext}
        disabled={isSummarizing || !conversationId}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-gray-900 text-white text-sm font-medium shadow-lg hover:bg-gray-800 disabled:cursor-not-allowed transition-colors cursor-pointer z-10"
      >
        {isSummarizing ? (
          <>
            <svg
              className="animate-spin h-4 w-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
            Summarizing…
          </>
        ) : (
          "Continue from summary"
        )}
      </button>
    </div>
  );
}
