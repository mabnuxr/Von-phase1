import { useRef, useState, useEffect, useMemo } from "react";
import { CaretUpDownIcon } from "@phosphor-icons/react";
import { ensureUTC } from "@vonlabs/design-components";
import { useChatSidebarV2 } from "../../hooks/useChatSidebarV2";
import { useAppShell } from "../../hooks/useAppShell";
import { useTitleAnimation } from "../../hooks/useTitleAnimation";
import { useUserPusherChannel } from "../../hooks/useUserPusherChannel";
import type { SidebarConversation } from "../../types/chatSidebar";

interface ChatPickerProps {
  activeChatId: string | null;
  onSelect: (id: string | null) => void;
  isRenaming?: boolean;
  onRenameEnd?: () => void;
}

function groupByRecency(conversations: SidebarConversation[]) {
  const now = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;

  const last7: SidebarConversation[] = [];
  const last30: SidebarConversation[] = [];
  const older: SidebarConversation[] = [];

  for (const conv of conversations) {
    const age = now - new Date(ensureUTC(conv.updatedAt)).getTime();
    if (age <= sevenDays) {
      last7.push(conv);
    } else if (age <= thirtyDays) {
      last30.push(conv);
    } else {
      older.push(conv);
    }
  }

  return { last7, last30, older };
}

function ConvButton({
  conv,
  isActive,
  onSelect,
  onClose,
}: {
  conv: SidebarConversation;
  isActive: boolean;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <button
      onClick={() => {
        onSelect(conv.conversationId);
        onClose();
      }}
      className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm rounded-lg transition-colors ${
        isActive ? "bg-gray-100" : "hover:bg-gray-50"
      }`}
    >
      <span
        className={`truncate flex-1 ${isActive ? "font-medium text-gray-900" : "text-gray-800"}`}
      >
        {conv.title}
      </span>
    </button>
  );
}

export function ChatPicker({
  activeChatId,
  onSelect,
  isRenaming = false,
  onRenameEnd,
}: ChatPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const renameInputRef = useRef<HTMLInputElement>(null);
  const committedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { unfiledConversations, isLoading, renameConversation } =
    useChatSidebarV2();
  const { user } = useAppShell();
  const { channel: userChannel } = useUserPusherChannel({
    tenantId: user?.tenantId,
    userId: user?.id,
  });
  const { animatedTitles } = useTitleAnimation({ userChannel });

  const activeConversation = unfiledConversations.find(
    (c) => c.conversationId === activeChatId,
  );

  // Use streaming animated title when available (same as left sidebar)
  const animatedTitle = activeChatId
    ? animatedTitles.get(activeChatId)
    : undefined;
  const displayTitle =
    animatedTitle !== undefined
      ? animatedTitle || "…"
      : activeConversation?.title?.trim() ||
        (activeChatId ? "Chat" : "New chat");

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  // Initialize rename input and focus it when rename mode activates
  useEffect(() => {
    if (isRenaming) {
      committedRef.current = false;
      setRenameValue(activeConversation?.title?.trim() ?? "");
      setIsOpen(false);
      setTimeout(() => renameInputRef.current?.select(), 0);
    }
  }, [isRenaming]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRenameSubmit = () => {
    if (committedRef.current) return;
    committedRef.current = true;
    if (activeChatId && renameValue.trim()) {
      renameConversation(activeChatId, renameValue.trim());
    }
    onRenameEnd?.();
  };

  const titledConversations = useMemo(
    () => unfiledConversations.filter((c) => c.title?.trim()),
    [unfiledConversations],
  );

  const { last7, last30, older } = useMemo(
    () => groupByRecency(titledConversations),
    [titledConversations],
  );

  const isEmpty =
    last7.length === 0 && last30.length === 0 && older.length === 0;

  return (
    <div ref={containerRef} className="relative flex-1 min-w-0">
      {/* Trigger / inline rename input */}
      {isRenaming ? (
        <input
          ref={renameInputRef}
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleRenameSubmit();
            if (e.key === "Escape") {
              committedRef.current = true;
              onRenameEnd?.();
            }
          }}
          onBlur={handleRenameSubmit}
          className="w-full min-w-0 max-w-[160px] px-2 py-1.5 text-sm font-medium text-gray-800 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400"
        />
      ) : (
        <button
          onClick={() => setIsOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 min-w-0 max-w-full px-2 py-1.5 rounded-lg hover:bg-gray-100 text-sm font-medium text-gray-800 transition-colors"
          title="Switch chat"
        >
          <span className="truncate max-w-[140px]">{displayTitle}</span>
          <CaretUpDownIcon
            size={13}
            weight="bold"
            className="flex-shrink-0 text-gray-400"
          />
        </button>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-100 rounded-2xl shadow-lg z-50 overflow-hidden max-h-80 overflow-y-auto p-1 min-w-[220px]">
          {isLoading ? (
            <div className="px-3 py-4 text-xs text-gray-400 text-center">
              Loading…
            </div>
          ) : isEmpty ? (
            <div className="px-3 py-4 text-xs text-gray-400 text-center">
              No chats yet
            </div>
          ) : (
            <>
              {last7.length > 0 && (
                <div>
                  <div className="px-3 pt-2 pb-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                    Last 7 days
                  </div>
                  {last7.map((conv) => (
                    <ConvButton
                      key={conv.conversationId}
                      conv={conv}
                      isActive={conv.conversationId === activeChatId}
                      onSelect={onSelect}
                      onClose={() => setIsOpen(false)}
                    />
                  ))}
                </div>
              )}
              {last30.length > 0 && (
                <div
                  className={
                    last7.length > 0 ? "border-t border-gray-100 mt-1 pt-1" : ""
                  }
                >
                  <div className="px-3 pt-2 pb-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                    Last 30 days
                  </div>
                  {last30.map((conv) => (
                    <ConvButton
                      key={conv.conversationId}
                      conv={conv}
                      isActive={conv.conversationId === activeChatId}
                      onSelect={onSelect}
                      onClose={() => setIsOpen(false)}
                    />
                  ))}
                </div>
              )}
              {older.length > 0 && (
                <div
                  className={
                    last7.length > 0 || last30.length > 0
                      ? "border-t border-gray-100 mt-1 pt-1"
                      : ""
                  }
                >
                  <div className="px-3 pt-2 pb-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                    Older
                  </div>
                  {older.map((conv) => (
                    <ConvButton
                      key={conv.conversationId}
                      conv={conv}
                      isActive={conv.conversationId === activeChatId}
                      onSelect={onSelect}
                      onClose={() => setIsOpen(false)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
