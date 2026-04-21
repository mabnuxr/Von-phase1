import { useMemo, useState } from "react";
import { XIcon, SparkleIcon } from "@phosphor-icons/react";
import type { MentionItem } from "@vonlabs/design-components";
import { ChatSession } from "./chat/ChatSession";
import { AppShellContext } from "../contexts/AppShellContext";
import { NavigationGuardProvider } from "../providers/NavigationGuard";
import { useUser } from "../hooks/useUser";

const MEMORY_MENTION_PREFIX = "memory:";
const SNIPPET_MENTION_PREFIX = "snippet:";

export interface EditVonPaneProps {
  onClose: () => void;
  placeholder?: string;
  /** Optional header label. Defaults to "Edit with Von". */
  title?: string;
  /** Current memory being edited — rendered as a persistent context chip
   *  inside the chat input so the user can see what's in scope. */
  memoryContext?: { id: string; key: string } | null;
  /** Text snippets the user selected from Memory Content — rendered as
   *  removable chips inside the chat input. */
  selectionSnippets?: string[];
  /** Remove a snippet chip by its text value. */
  onRemoveSnippet?: (text: string) => void;
  /** Called when the user dismisses the memory context chip. */
  onRemoveMemoryContext?: () => void;
  /** Dev-only hook for exercising the proposal state machine without a
   *  backend. When provided (and we're in DEV), a small Demo button shows
   *  in the header that triggers the full loading → proposed transition. */
  onSimulateProposal?: () => void;
}

/**
 * Minimal empty state — kept deliberately sparse so the chat surface reads
 * like an ongoing conversation with the input anchored at the bottom, rather
 * than the full greeting + suggested-prompts experience.
 */
function EditVonEmptyState() {
  return <div className="h-full" aria-hidden />;
}

/**
 * Standalone "Edit with Von" chat pane for surfaces that are NOT rendered
 * inside AppShell (e.g., Settings → Org Memory).
 *
 *   • Local conversation state — no coupling to GlobalChat.activeChatId.
 *   • Fresh on every open (component unmounts when the pane closes).
 *   • No ChatPicker / more menu / dashboard pill — one-off surface.
 *   • Suppresses the greeting/suggested-prompts UI via a blank EmptyState so
 *     the Chat component's input stays anchored at the bottom of the pane.
 *   • Memory + selection context flow through `pendingWidgetMentions` so the
 *     chips render inside the chat input itself (matching the dashboard
 *     experience), rather than as a separate strip above it.
 *
 * Stands up AppShellContext + NavigationGuardProvider locally so
 * ChatSession's existing-conversation path resolves outside AppShell.
 */
export function EditVonPane({
  onClose,
  placeholder = "Ask Von to help...",
  title = "Edit with Von",
  memoryContext,
  selectionSnippets = [],
  onRemoveSnippet,
  onRemoveMemoryContext,
  onSimulateProposal,
}: EditVonPaneProps) {
  const { user } = useUser();
  const [conversationId, setConversationId] = useState<string | null>(null);

  // ChatSession -> useBaseChatConfig -> useAppShell() needs a non-null context.
  // Only `user` is consumed on this surface; the rest are stubs.
  const shellValue = useMemo(
    () => ({
      user: user ?? null,
      collapseSidebar: () => {},
      handleLogout: async () => {},
      handleNewChatClick: () => {},
      openShareModal: () => {},
    }),
    [user],
  );

  // Context → mention chips. `type: "widget"` is the available chip variant
  // in design-components; we piggyback on it so the inline chip rendering +
  // native truncation tooltip work without extending MentionItemType.
  const pendingMentions = useMemo<MentionItem[]>(() => {
    const list: MentionItem[] = [];
    if (memoryContext) {
      list.push({
        id: `${MEMORY_MENTION_PREFIX}${memoryContext.id}`,
        name: memoryContext.key,
        type: "widget",
        version: 0,
      });
    }
    for (const text of selectionSnippets) {
      list.push({
        id: `${SNIPPET_MENTION_PREFIX}${text}`,
        name: text,
        type: "widget",
        version: 0,
      });
    }
    return list;
  }, [memoryContext, selectionSnippets]);

  const handleMentionRemoved = ({ id }: { id: string }) => {
    if (id.startsWith(SNIPPET_MENTION_PREFIX)) {
      onRemoveSnippet?.(id.slice(SNIPPET_MENTION_PREFIX.length));
      return;
    }
    if (id.startsWith(MEMORY_MENTION_PREFIX)) {
      onRemoveMemoryContext?.();
    }
  };

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 py-2 border-b border-gray-100">
        <span className="text-sm font-medium text-gray-900">{title}</span>
        <div className="flex items-center gap-1">
          {/* Dev-only: simulate a full loading → proposed cycle without a
              backend. Hidden in production so real users never see it. */}
          {import.meta.env.DEV && onSimulateProposal && (
            <button
              onClick={onSimulateProposal}
              className="inline-flex items-center gap-1 h-7 px-2 rounded-lg border border-dashed border-gray-200 text-[11px] text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-colors cursor-pointer"
              title="Simulate a Von proposal (dev only)"
            >
              Demo
            </button>
          )}
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            title="Close"
            aria-label="Close chat"
          >
            <XIcon size={14} weight="regular" />
          </button>
        </div>
      </div>

      {/* Chat content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <AppShellContext.Provider value={shellValue}>
          <NavigationGuardProvider>
            <ChatSession
              conversationId={conversationId}
              compact
              placeholder={placeholder}
              onCreated={(id) => setConversationId(id)}
              pendingWidgetMentions={pendingMentions}
              onPendingWidgetMentionRemoved={handleMentionRemoved}
              hideDisclaimer
            >
              <ChatSession.EmptyState>
                <EditVonEmptyState />
              </ChatSession.EmptyState>
            </ChatSession>
          </NavigationGuardProvider>
        </AppShellContext.Provider>
      </div>
    </div>
  );
}

export default EditVonPane;
