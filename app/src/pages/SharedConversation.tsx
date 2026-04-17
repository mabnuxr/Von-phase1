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
import { setShareToken } from "../services/apiClient";

/**
 * Read-only view of a shared conversation.
 *
 * Flow:
 *   1. Install the share token into `apiClient` so every subsequent request
 *      carries the `X-Share-Token` header. The backend's auth middleware
 *      uses it to context-switch into the conversation owner's identity.
 *   2. Validate the token via `/shared/:token/validate` — returns the
 *      `conversationId` plus "shared by" metadata.
 *   3. Render `ChatSession` in read-only mode against that `conversationId`.
 *      Messages, files, artifacts, transparency drawer, dashboard previews
 *      all flow through the normal endpoints — no parallel "shared"
 *      endpoints or duplicated rendering logic.
 *
 * The share token is cleared on unmount so that navigating back to the
 * user's own chats doesn't accidentally continue routing requests through
 * the owner's context.
 */
export default function SharedConversation() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const navigate = useNavigate();

  const [validation, setValidation] =
    useState<SharedConversationValidationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Install the share token on apiClient synchronously before any other
  // request in this view fires. Clean up on unmount.
  useEffect(() => {
    if (!shareToken) return;
    setShareToken(shareToken);
    return () => setShareToken(null);
  }, [shareToken]);

  // Validate the token and fetch bootstrap metadata (conversationId, sharedBy).
  useEffect(() => {
    if (!shareToken) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await conversationsService.validateShareToken(
          shareToken,
        );
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
  }, [shareToken]);

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

  const handleNewChat = () => navigate("/chat/new");

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
    <div className="flex flex-col flex-1 w-full h-full bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs [&_.chat-container]:!border-0 [&_.chat-container]:!rounded-none [&_.chat-container]:!shadow-none">
      {/* Header — read-only indicator + shared by */}
      <div className="flex items-center justify-end px-5 py-3 border-b border-gray-100 bg-white shrink-0">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-gray-100 text-xs font-medium text-gray-600">
            Read-only
          </span>
          <span className="text-sm text-gray-500">
            Shared by {validation.sharedByName}
          </span>
        </div>
      </div>

      {/* Chat (read-only — no input) */}
      <div className="flex-1 min-h-0 relative">
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
          />
        )}

        {/* Sticky bottom CTAs overlaying chat */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-100 px-5 py-3 bg-white/95 backdrop-blur">
          <div className="flex items-center justify-center gap-2">
            {/* "New chat with context" — not shipped yet. Kept as a
                disabled placeholder so the slot is reserved in the UI. */}
            <button
              type="button"
              disabled
              aria-disabled="true"
              title="Coming soon"
              className="relative inline-flex items-center gap-2 h-[36px] px-4 text-sm font-medium text-gray-400 bg-white rounded-xl cursor-not-allowed border border-gray-200"
            >
              <svg
                width={18}
                height={18}
                viewBox="0 0 28 28"
                fill="none"
                className="flex-shrink-0 opacity-50"
              >
                <circle cx="14" cy="14" r="14" fill="#E5E7EB" />
                <path
                  d="M15.937 11.1501C17.7702 12.4452 19.151 13.9556 19.9152 15.3235C20.7057 16.7385 20.7316 17.7813 20.3233 18.3594C19.9149 18.9375 18.9234 19.2616 17.3256 18.9894C15.7809 18.7262 13.8959 17.9296 12.0627 16.6345C10.2294 15.3394 8.84791 13.8285 8.08365 12.4605C7.29337 11.0458 7.26805 10.0032 7.67638 9.42519C8.08475 8.84721 9.07582 8.52262 10.6733 8.7947C12.2181 9.05788 14.1037 9.855 15.937 11.1501Z"
                  stroke="white"
                  strokeWidth="1.33"
                />
                <circle
                  cx="13.9932"
                  cy="14"
                  r="7.835"
                  stroke="white"
                  strokeWidth="1.33"
                />
              </svg>
              <span>New chat with context</span>
              <span className="ml-1 inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-500 bg-gray-100 rounded">
                Coming soon
              </span>
            </button>
            <button
              onClick={handleNewChat}
              className="inline-flex items-center gap-1.5 h-[36px] px-4 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
            >
              New chat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
