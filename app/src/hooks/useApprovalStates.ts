import { useEffect, useMemo, useState } from "react";
import type { Channel } from "pusher-js";
import {
  UserChannelEvents,
  type ConversationApprovalPendingEvent,
  type ConversationApprovalResolvedEvent,
  type ConversationApprovalExpiredEvent,
} from "../types/userChannelEvents";
import type {
  ConversationApprovalState,
  SidebarConversation,
  FolderConversation,
} from "../types/chatSidebar";

type ApprovalState = ConversationApprovalState;
type PusherStateValue = ApprovalState | "cleared";

interface UseApprovalStatesParams {
  sidebarConversations: SidebarConversation[];
  folderConversations: Record<string, FolderConversation[]>;
  userChannel: Channel | null;
}

interface UseApprovalStatesReturn {
  /** Map of conversationId → current approval indicator state. */
  approvalStates: Map<string, ApprovalState>;
}

/**
 * Read the approval indicator for a single conversation.
 *
 * During backend rollout the server may still return only the boolean
 * `hasPendingApproval`. Fall back to that so the UI keeps working before
 * `approval_state` is deployed.
 */
function readApprovalState(
  conv: Pick<SidebarConversation, "approvalState" | "hasPendingApproval">,
): ApprovalState | undefined {
  if (conv.approvalState === "pending" || conv.approvalState === "expired") {
    return conv.approvalState;
  }
  if (conv.hasPendingApproval) return "pending";
  return undefined;
}

/**
 * Tracks the approval indicator state (`pending` | `expired`) for each
 * conversation visible in the sidebar.
 *
 * Sources, in precedence order (last wins):
 * 1. `apiStates` — seeded from the sidebar / folder API responses. Reseeds on
 *    every data refresh (page reload, tab refocus).
 * 2. `pusherStates` — live overrides from user-channel events. `"pending"` and
 *    `"expired"` set the state; `"cleared"` acts as a tombstone for
 *    user-driven resolutions so an API-seeded dot disappears immediately
 *    without waiting for a refetch.
 */
export function useApprovalStates({
  sidebarConversations,
  folderConversations,
  userChannel,
}: UseApprovalStatesParams): UseApprovalStatesReturn {
  const apiStates = useMemo(() => {
    const map = new Map<string, ApprovalState>();
    for (const conv of sidebarConversations) {
      const state = readApprovalState(conv);
      if (state) map.set(conv.conversationId, state);
    }
    for (const convs of Object.values(folderConversations)) {
      for (const conv of convs) {
        const state = readApprovalState(conv);
        if (state) map.set(conv.conversationId, state);
      }
    }
    return map;
  }, [sidebarConversations, folderConversations]);

  const [pusherStates, setPusherStates] = useState<
    Map<string, PusherStateValue>
  >(new Map());

  useEffect(() => {
    if (!userChannel) return;

    const applyLiveTransition = (
      conversationId: string,
      value: PusherStateValue,
    ) => {
      setPusherStates((prev) => {
        if (prev.get(conversationId) === value) return prev;
        const next = new Map(prev);
        next.set(conversationId, value);
        return next;
      });
    };

    const handlePending = (data: ConversationApprovalPendingEvent) => {
      applyLiveTransition(data.conversationId, "pending");
    };
    const handleExpired = (data: ConversationApprovalExpiredEvent) => {
      applyLiveTransition(data.conversationId, "expired");
    };
    const handleResolved = (data: ConversationApprovalResolvedEvent) => {
      applyLiveTransition(data.conversationId, "cleared");
    };

    userChannel.bind(
      UserChannelEvents.CONVERSATION_APPROVAL_PENDING,
      handlePending,
    );
    userChannel.bind(
      UserChannelEvents.CONVERSATION_APPROVAL_EXPIRED,
      handleExpired,
    );
    userChannel.bind(
      UserChannelEvents.CONVERSATION_APPROVAL_RESOLVED,
      handleResolved,
    );

    return () => {
      userChannel.unbind(
        UserChannelEvents.CONVERSATION_APPROVAL_PENDING,
        handlePending,
      );
      userChannel.unbind(
        UserChannelEvents.CONVERSATION_APPROVAL_EXPIRED,
        handleExpired,
      );
      userChannel.unbind(
        UserChannelEvents.CONVERSATION_APPROVAL_RESOLVED,
        handleResolved,
      );
    };
  }, [userChannel]);

  // Reconcile Pusher overrides against a refreshed API base: drop overrides
  // the server already reflects.
  useEffect(() => {
    setPusherStates((prev) => {
      if (prev.size === 0) return prev;
      let changed = false;
      const next = new Map(prev);
      for (const [id, value] of prev) {
        const apiValue = apiStates.get(id);
        if (value === "cleared") {
          if (!apiValue) {
            next.delete(id);
            changed = true;
          }
        } else if (!apiValue || apiValue === value) {
          next.delete(id);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [apiStates]);

  const approvalStates = useMemo(() => {
    const result = new Map(apiStates);
    for (const [id, value] of pusherStates) {
      if (value === "cleared") result.delete(id);
      else result.set(id, value);
    }
    return result;
  }, [apiStates, pusherStates]);

  return { approvalStates };
}
