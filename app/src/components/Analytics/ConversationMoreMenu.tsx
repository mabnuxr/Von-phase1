import { useRef, useState, useEffect } from "react";
import {
  DotsThreeVerticalIcon,
  PencilSimpleIcon,
  TrashIcon,
  ArrowBendUpRightIcon,
} from "@phosphor-icons/react";
import { useChatSidebar } from "../../hooks/useChatSidebar";
import { DeleteConfirmationModal } from "./DeleteConfirmationModal";
import { MoveToFolderModal } from "./MoveToFolderModal";

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
  const [isOpen, setIsOpen] = useState(false);
  const [isPendingDelete, setIsPendingDelete] = useState(false);
  const [isPendingAddToFolder, setIsPendingAddToFolder] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    unfiledConversations,
    folders,
    deleteConversation,
    moveItemToFolder,
    createFolderForItem,
  } = useChatSidebar();

  const conversation = unfiledConversations.find(
    (c) => c.conversation_id === conversationId,
  );
  const conversationTitle = conversation?.title?.trim() ?? "this chat";

  const close = () => setIsOpen(false);

  // Close dropdown on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        close();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  const handleDeleteConfirm = () => {
    if (conversationId) {
      deleteConversation(conversationId);
      onDeleted();
    }
    setIsPendingDelete(false);
  };

  const handleFolderConfirm = (config: {
    folderId: string;
    isNewFolder: boolean;
    newFolderName?: string;
  }) => {
    if (!conversationId || isMoving) return;
    setIsMoving(true);
    if (config.isNewFolder && config.newFolderName) {
      createFolderForItem(conversationId, config.newFolderName);
    } else {
      moveItemToFolder(conversationId, config.folderId);
    }
    setIsPendingAddToFolder(false);
    setIsMoving(false);
  };

  // Map folders to the shape MoveToFolderModal expects
  const folderOptions = folders.map((f) => ({ id: f.id, label: f.label }));

  return (
    <>
      <div ref={containerRef} className="relative flex-shrink-0">
        <button
          onClick={() => {
            if (!conversationId) return;
            setIsOpen((v) => !v);
          }}
          disabled={!conversationId}
          className="inline-flex items-center justify-center w-7 h-7 text-gray-800 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title="More options"
        >
          <DotsThreeVerticalIcon size={16} weight="bold" />
        </button>

        {isOpen && (
          <div className="absolute top-full right-0 mt-1 bg-white border border-gray-100 rounded-2xl shadow-lg z-50 overflow-hidden p-1 min-w-[10rem]">
            <button
              onClick={() => {
                close();
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
                close();
                setIsPendingAddToFolder(true);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <ArrowBendUpRightIcon
                size={14}
                weight="regular"
                className="flex-shrink-0"
              />
              Add to Folder
            </button>
            <button
              onClick={() => {
                close();
                setIsPendingDelete(true);
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
        onCancel={() => setIsPendingDelete(false)}
      />

      <MoveToFolderModal
        isOpen={isPendingAddToFolder}
        itemName={conversationTitle}
        folders={folderOptions}
        onConfirm={handleFolderConfirm}
        onCancel={() => setIsPendingAddToFolder(false)}
      />
    </>
  );
}
