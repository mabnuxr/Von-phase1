import { useMutation } from "@tanstack/react-query";
import { conversationsService } from "../services";

/**
 * Hook to stop streaming message generation
 * Sends stop signal to backend via Redis
 */
export function useStopStreaming() {
  return useMutation({
    mutationFn: async (conversationId: string) => {
      if (import.meta.env.DEV) {
        console.log("[useStopStreaming] Sending stop signal:", conversationId);
      }

      return conversationsService.stopStreaming(conversationId);
    },

    onSuccess: () => {
      if (import.meta.env.DEV) {
        console.log("[useStopStreaming] Stop signal sent successfully");
      }
    },

    onError: (error: Error) => {
      console.error("Error sending stop signal:", error);
    },
  });
}
