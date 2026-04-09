import { useContext } from "react";
import { GlobalChatContext } from "./GlobalChatContext";

export function useGlobalChat() {
  return useContext(GlobalChatContext);
}
