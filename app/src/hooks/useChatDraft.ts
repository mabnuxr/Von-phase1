import { useCallback, useEffect } from "react";
import useLocalStorage from "react-use/lib/useLocalStorage";

/** Shared key for any not-yet-created chat (the global `/chat/new` composer). */
export const NEW_CHAT_DRAFT_KEY = "__new__";

const keyFor = (chatId: string | null | undefined) =>
  `von-chat-draft:${chatId || NEW_CHAT_DRAFT_KEY}`;

/**
 * Controlled state for the chat composer that persists unsent text against the
 * chat id, so a typed-but-unsent message survives navigation, refresh, settings
 * round-trips and tab switches — and is restored on return.
 *
 * Backed by `react-use`'s `useLocalStorage`, which writes synchronously on every
 * change (no flush-on-unmount needed), re-reads when the key changes (so each
 * chat shows only its own draft — no leakage), and syncs across tabs.
 *
 * Returns a `useState`-shaped tuple so call sites can drop it in wherever they
 * held composer text before:
 *
 *   const [draft, setDraft, clearDraft] = useChatDraft(conversationId);
 *   <Chat inputValue={draft} onInputValueChange={setDraft} />
 *
 * A `null`/empty `chatId` falls back to the shared new-chat key.
 */
export function useChatDraft(
  chatId: string | null | undefined,
): [string, (value: string) => void, () => void] {
  const [stored, setStored, remove] = useLocalStorage<string>(
    keyFor(chatId),
    "",
    {
      raw: true,
    },
  );

  const setDraft = useCallback(
    (value: string) => {
      // Empty/whitespace text is the same as having no draft — drop the key so
      // emptying the composer clears the draft (and storage doesn't fill with
      // empty strings).
      if (value.trim() === "") remove();
      else setStored(value);
    },
    [setStored, remove],
  );

  return [stored ?? "", setDraft, remove];
}

/**
 * When a send fails, the create/send hook surfaces the user's unsent text via
 * `restoredInput` so it isn't lost. Push it back into the composer whenever it
 * appears. Shared by the new-chat composers (`/chat/new` and embedded).
 */
export function useRestoreUnsentInput(
  restoredInput: string | null | undefined,
  setInput: (value: string) => void,
): void {
  useEffect(() => {
    if (restoredInput != null) setInput(restoredInput);
  }, [restoredInput, setInput]);
}
