import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useUserPusherChannel } from "./useUserPusherChannel";
import { useUser } from "./useUser";
import { useToast } from "./useToast";
import { UserChannelEvents } from "../types/userChannelEvents";
import { QUICK_COMMANDS_QUERY_KEY } from "./useQuickCommands";

/**
 * Listens for command_created Pusher events on the user channel
 * and invalidates the quick commands cache so the new command
 * appears in the slash menu immediately.
 */
export function useCommandCreatedEvent() {
  const queryClient = useQueryClient();
  const { user } = useUser();
  const { showToast } = useToast();
  const { channel: userChannel } = useUserPusherChannel({
    tenantId: user?.tenantId,
    userId: user?.id,
  });

  useEffect(() => {
    if (!userChannel) return;

    const handleCommandCreated = () => {
      queryClient.invalidateQueries({
        queryKey: QUICK_COMMANDS_QUERY_KEY,
      });
    };

    userChannel.bind(UserChannelEvents.COMMAND_CREATED, handleCommandCreated);

    return () => {
      userChannel.unbind(
        UserChannelEvents.COMMAND_CREATED,
        handleCommandCreated,
      );
    };
  }, [userChannel, queryClient, showToast]);
}
