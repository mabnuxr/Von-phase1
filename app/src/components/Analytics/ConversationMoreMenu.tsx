import { useRef, useEffect } from "react";
import {
  DotsThreeVerticalIcon,
  PencilSimpleIcon,
  TrashIcon,
  FolderSimpleIcon,
} from "@phosphor-icons/react";
import { useVisibilityToggle } from "@vonlabs/design-components";
import { useChatSidebar } from "../../hooks/useChatSidebar";
import { DeleteConfirmationModal } from "./DeleteConfirmationModal";
import { ManageFoldersModal } from "./ManageFoldersModal";

interface ConversationMoreMenuProps {
  conversationId: string | null;
  onDeleted: () => void;
  onStartRename: () => void;
}

export function ConversationMoreMenu({
  conversationId,
  onDeleted,
  onStartRename,
}: ConversationMoreMenuProps) {
  const {
    isVisible: isMenuOpen,
    hide: closeMenu,
    toggleVisibility: toggleMenu,
  } = useVisibilityToggle();
  const {
    isVisible: isPendingDelete,
    show: openDelete,
    hide: closeDelete,
  } = useVisibilityToggle();
  const {
    isVisible: isManageFoldersOpen,
    show: openManageFolders,
    hide: closeManageFolders,
  } = useVisibilityToggle();
  const containerRef = useRef<HTMLDivElement>(null);

  const { unfiledConversations, deleteConversation } = useChatSidebar();

  const conversation = unfiledConversations.find(
    (c) => c.conversation_id === conversationId,
  );
  const conversationTitle = conversation?.title?.trim() ?? "this chat";

  // Close dropdown on outside click
  useEffect(() => {
    if (!isMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        closeMenu();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isMenuOpen, closeMenu]);

  const handleDeleteConfirm = () => {
    if (conversationId) {
      deleteConversation(conversationId);
      onDeleted();
    }
    closeDelete();
  };

  return (
    <>
      <div ref={containerRef} className="relative flex-shrink-0">
        <button
          onClick={() => {
            if (!conversationId) return;
            toggleMenu();
          }}
          disabled={!conversationId}
          className="inline-flex items-center justify-center w-7 h-7 text-gray-800 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title="More options"
        >
          <DotsThreeVerticalIcon size={16} weight="bold" />
        </button>

        {isMenuOpen && (
          <div className="absolute top-full right-0 mt-1 bg-white border border-gray-100 rounded-2xl shadow-lg z-50 overflow-hidden p-1 min-w-[10rem]">
            <button
              onClick={() => {
                closeMenu();
                onStartRename();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <PencilSimpleIcon
                size={14}
                weight="regular"
                className="flex-shrink-0"
              />
              Rename
            </button>
            <button
              onClick={() => {
                closeMenu();
                openManageFolders();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <FolderSimpleIcon
                size={14}
                weight="regular"
                className="flex-shrink-0"
              />
              Add to Folder
            </button>
            <button
              onClick={() => {
                closeMenu();
                openDelete();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <TrashIcon size={14} weight="regular" className="flex-shrink-0" />
              Delete
            </button>
          </div>
        )}
      </div>

      <DeleteConfirmationModal
        isOpen={isPendingDelete}
        itemLabel={conversationTitle}
        onConfirm={handleDeleteConfirm}
        onCancel={closeDelete}
      />

      {conversationId && (
        <ManageFoldersModal
          isOpen={isManageFoldersOpen}
          itemName={conversationTitle}
          itemType="conversation"
          itemId={conversationId}
          onClose={closeManageFolders}
        />
      )}
    </>
  );
}
