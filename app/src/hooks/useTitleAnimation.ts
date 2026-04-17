import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Channel } from "pusher-js";
import { chatSidebarKeys } from "./useChatSidebar";
import {
  UserChannelEvents,
  type ConversationTitleUpdatedEvent,
} from "../types/userChannelEvents";

interface UseTitleAnimationParams {
  userChannel: Channel | null;
}

/**
 * Subscribes to conversation title updates via user Pusher channel
 * and produces a typing animation effect.
 *
 * Returns an `animatedTitles` map (conversationId → partial title string)
 * that can be overlaid on sidebar items during the animation.
 *
 * Shared between V1 and V2 sidebar containers.
 */
export function useTitleAnimation({ userChannel }: UseTitleAnimationParams) {
  const queryClient = useQueryClient();

  const [titleUpdate, setTitleUpdate] = useState<{
    conversationId: string;
    title: string;
  } | null>(null);
  const [animatedTitles, setAnimatedTitles] = useState<Map<string, string>>(
    new Map(),
  );

  // Subscribe to title updates on user channel
  useEffect(() => {
    if (!userChannel) return;

    const handleTitleUpdate = (data: ConversationTitleUpdatedEvent) => {
      if (import.meta.env.DEV) {
        console.log(
          "[useTitleAnimation] Title update received:",
          data.title,
          "for conversation:",
          data.conversationId,
        );
      }

      setTitleUpdate({
        conversationId: data.conversationId,
        title: data.title,
      });

      // Invalidate both V1 and V2 sidebar caches so the real title is fetched
      // before the animation overlay is removed
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({
        queryKey: chatSidebarKeys.sidebar(),
      });
    };

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

  // Typing animation effect
  useEffect(() => {
    if (!titleUpdate) return;

    const { conversationId, title } = titleUpdate;

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
        clearInterval(interval);

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

    return () => {
      clearInterval(interval);
      if (clearTimer) {
        clearTimeout(clearTimer);
      }
    };
  }, [titleUpdate]);

  return { animatedTitles };
}
