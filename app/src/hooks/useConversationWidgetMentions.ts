import { useCallback, useMemo } from "react";
import type {
  FileAttachment,
  MentionItem,
  SendMessageOptions,
} from "@vonlabs/design-components";
import {
  getWidgetMentionsFor,
  useWidgetMentionsStore,
} from "../store/widgetMentionsStore";

type SendMessageFn = (
  content: string,
  attachments?: FileAttachment[],
  options?: SendMessageOptions,
) => Promise<boolean | void>;

/**
 * Subscribes to widget-mention chips for a conversation and wraps the chat's
 * send handler so chips only clear when the send actually completed (the
 * underlying handler returns `true`). File-upload aborts return `false`, which
 * preserves the chips so the user can retry.
 */
export function useConversationWidgetMentions(
  conversationId: string,
  handleSendMessage: SendMessageFn,
): {
  widgetMentions: MentionItem[];
  onWidgetMentionRemoved: (args: { id: string }) => void;
  wrappedHandleSendMessage: SendMessageFn;
} {
  const selector = useMemo(
    () => getWidgetMentionsFor(conversationId),
    [conversationId],
  );
  const widgetMentions = useWidgetMentionsStore(selector);
  const removeWidgetMention = useWidgetMentionsStore((s) => s.remove);
  const clearWidgetMentions = useWidgetMentionsStore((s) => s.clear);

  const onWidgetMentionRemoved = useCallback(
    ({ id }: { id: string }) => removeWidgetMention(conversationId, id),
    [conversationId, removeWidgetMention],
  );

  const wrappedHandleSendMessage = useCallback<SendMessageFn>(
    async (...args) => {
      const result = await handleSendMessage(...args);
      if (result !== false) clearWidgetMentions(conversationId);
      return result;
    },
    [handleSendMessage, clearWidgetMentions, conversationId],
  );

  return { widgetMentions, onWidgetMentionRemoved, wrappedHandleSendMessage };
}
