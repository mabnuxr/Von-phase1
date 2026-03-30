import { useContext } from "react";
import { GlobalChatContext } from "./GlobalChatProvider";

export function useGlobalChat() {
  return useContext(GlobalChatContext);
}
