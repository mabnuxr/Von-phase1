import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Encapsulates new chat navigation logic.
 *
 * Navigates to /chat/new where the user types their first message.
 * The conversation is created only when the first message is sent,
 * avoiding orphaned conversations with no user messages.
 */
export function useNewChat() {
  const navigate = useNavigate();

  const handleNewChatClick = useCallback(() => {
    navigate("/chat/new");
  }, [navigate]);

  return { handleNewChatClick };
}
