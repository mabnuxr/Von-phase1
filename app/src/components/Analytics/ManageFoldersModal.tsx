import { useEffect, useMemo, useRef, useState } from "react";
import { report } from "../../lib/analytics/tracker";
import { AnimatePresence, motion } from "framer-motion";
import {
  CaretDownIcon,
  CheckIcon,
  FolderSimpleIcon,
  PlusIcon,
  XIcon,
} from "@phosphor-icons/react";
import { useFoldersList } from "../../hooks/folders/useFoldersList";
import { useItemMemberships } from "../../hooks/folders/useItemMemberships";
import { useFolderMutations } from "../../hooks/folders/useFolderMutations";
import type { Folder, FolderItemType } from "../../types/chatSidebar";

interface ManageFoldersModalProps {
  isOpen: boolean;
  itemName: string;
  itemType: FolderItemType;
  itemId: string;
  fromLocation?: string;
  onClose: () => void;
}

const CREATE_NEW = "__create_new__";

/** API-level item type → user-facing noun. Kept separate so the type stays
 *  the canonical Folders v2 enum and the copy stays human. */
const ITEM_TYPE_LABEL: Record<FolderItemType, string> = {
  conversation: "chat",
  dashboard: "dashboard",
};

/**
 * "Add to Folder" picker. Visually mirrors the legacy MoveToFolderModal
 * but supports multi-folder membership: the select shows chips for every
 * folder the item currently lives in, the dropdown lets the user toggle any
 * folder, and Save PUTs the full target set in one call. The "＋ Create New
 * Folder" entry inside the dropdown still expands the inline name input.
 */
export function ManageFoldersModal({
  isOpen,
  itemName,
  itemType,
  itemId,
  fromLocation = "outside",
  onClose,
}: ManageFoldersModalProps) {
  const { data: folders = [], isLoading: isFoldersLoading } = useFoldersList();
  const {
    data: memberships,
    isLoading: isMembershipsLoading,
    isFetching: isMembershipsFetching,
  } = useItemMemberships({ itemType, itemId, enabled: isOpen });
  const {
    createFolderAsync,
    setItemFoldersAsync,
    isCreatingFolder,
    isSettingFolders,
  } = useFolderMutations();

  const initialCheckedIds = useMemo<Set<string>>(
    () => new Set(memberships?.folders.map((f) => f.folderId) ?? []),
    [memberships],
  );

  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [hasSeeded, setHasSeeded] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [errors, setErrors] = useState<{ folder?: string; name?: string }>({});

  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Re-seed each time the modal opens / itemId changes. Wait for the
  // membership query to finish *fetching*, not just to have data — otherwise
  // a stale cached value (e.g. from before a sidebar "Remove from folder")
  // seeds the picker before the fresh refetch arrives, and the user sees
  // ghost selections for folders the item is no longer in.
  useEffect(() => {
    if (!isOpen) {
      setHasSeeded(false);
      setIsDropdownOpen(false);
      setIsCreatingNew(false);
      setNewFolderName("");
      setErrors({});
      return;
    }
    if (!hasSeeded && memberships && !isMembershipsFetching) {
      setCheckedIds(new Set(initialCheckedIds));
      setHasSeeded(true);
    }
  }, [
    isOpen,
    memberships,
    hasSeeded,
    initialCheckedIds,
    isMembershipsFetching,
  ]);

  // Close the dropdown on outside click. mousedown so the trigger doesn't
  // immediately re-open after a close-then-click.
  useEffect(() => {
    if (!isDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || dropdownRef.current?.contains(t)) {
        return;
      }
      setIsDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isDropdownOpen]);

  const isBusy = isCreatingFolder || isSettingFolders;
  const isLoading = isFoldersLoading || isMembershipsLoading || !hasSeeded;

  // System folders (e.g. "Schedule Command") are server-managed — items can't
  // be added to or removed from them via this picker, so hide them entirely.
  const sortedFolders = useMemo<Folder[]>(
    () =>
      [...folders]
        .filter((f) => !f.systemFolderType)
        .sort((a, b) => {
          if (a.displayOrder !== b.displayOrder) {
            return a.displayOrder - b.displayOrder;
          }
          return a.name.localeCompare(b.name);
        }),
    [folders],
  );

  const selectedFolders = useMemo<Folder[]>(
    () => sortedFolders.filter((f) => checkedIds.has(f.folderId)),
    [sortedFolders, checkedIds],
  );

  const hasNoFolders =
    !isLoading && sortedFolders.length === 0 && !isCreatingNew;

  const hasNewFolderPending = isCreatingNew && newFolderName.trim().length > 0;
  const hasDiff = useMemo(() => {
    if (hasNewFolderPending) return true;
    if (checkedIds.size !== initialCheckedIds.size) return true;
    for (const id of checkedIds) {
      if (!initialCheckedIds.has(id)) return true;
    }
    return false;
  }, [checkedIds, initialCheckedIds, hasNewFolderPending]);

  const toggleFolder = (folderId: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
    setErrors((p) => ({ ...p, folder: undefined }));
  };

  const removeChip = (folderId: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      next.delete(folderId);
      return next;
    });
  };

  const handleDropdownChoice = (value: string) => {
    if (value === CREATE_NEW) {
      setIsCreatingNew(true);
      setIsDropdownOpen(false);
      return;
    }
    toggleFolder(value);
  };

  const handleCancel = () => {
    if (isBusy) return;
    onClose();
  };

  const handleConfirm = async () => {
    if (isBusy) return;

    const errs: typeof errors = {};
    if (isCreatingNew && !newFolderName.trim()) {
      errs.name = "Folder name is required";
    }
    if (
      !isCreatingNew &&
      checkedIds.size === 0 &&
      initialCheckedIds.size === 0
    ) {
      errs.folder = "Please select a folder";
    }
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    if (!hasDiff) {
      onClose();
      return;
    }

    let createdFolderName = "";

    try {
      const finalIds = new Set(checkedIds);

      if (hasNewFolderPending) {
        const folder = await createFolderAsync({
          name: newFolderName.trim(),
        });
        finalIds.add(folder.folderId);
        createdFolderName = newFolderName.trim();
        report.foldersNewFolderCreated(createdFolderName, true, null);
      }

      await setItemFoldersAsync({
        itemType,
        itemId,
        folderIds: Array.from(finalIds),
      });

      // Fire for each newly added existing folder
      const addedExisting = sortedFolders.filter(
        (f) => finalIds.has(f.folderId) && !initialCheckedIds.has(f.folderId),
      );
      if (itemType === "conversation") {
        for (const folder of addedExisting) {
          report.chatListChatAddedToFolder({
            chatId: itemId,
            chatName: itemName,
            folderName: folder.name,
            folderType: "existing",
            success: true,
            error: null,
          });
          report.foldersChatAddedToFolder({
            chatId: itemId,
            chatName: itemName,
            folderName: folder.name,
            folderType: "existing",
            fromLocation,
            success: true,
            error: null,
          });
        }
        // Fire for the newly created folder (if any)
        if (createdFolderName) {
          report.chatListChatAddedToFolder({
            chatId: itemId,
            chatName: itemName,
            folderName: createdFolderName,
            folderType: "new",
            success: true,
            error: null,
          });
          report.foldersChatAddedToFolder({
            chatId: itemId,
            chatName: itemName,
            folderName: createdFolderName,
            folderType: "new",
            fromLocation,
            success: true,
            error: null,
          });
        }
      }

      onClose();
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : "Unknown error";
      const failedFolderName = createdFolderName || newFolderName.trim();
      const failedFolderType = hasNewFolderPending ? "new" : "existing";
      if (itemType === "conversation") {
        report.chatListChatAddedToFolder({
          chatId: itemId,
          chatName: itemName,
          folderName: failedFolderName,
          folderType: failedFolderType,
          success: false,
          error: errMsg,
        });
        report.foldersChatAddedToFolder({
          chatId: itemId,
          chatName: itemName,
          folderName: failedFolderName,
          folderType: failedFolderType,
          fromLocation,
          success: false,
          error: errMsg,
        });
      }
      // Mutation already surfaced a toast; keep modal open.
    }
  };

  const confirmDisabled =
    isBusy || isLoading || (isCreatingNew && !newFolderName.trim()) || !hasDiff;
  const confirmLabel = isBusy
    ? "Saving…"
    : isCreatingNew
      ? "Create Folder & Add"
      : "Add";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9998] bg-black/20 backdrop-blur-[2px]"
            onClick={handleCancel}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed z-[9999] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] max-w-[90vw] bg-white rounded-xl border border-gray-100 shadow-xl flex flex-col"
          >
            <div className="flex flex-col p-5">
              {/* Header */}
              <div className="flex items-center gap-2 pb-4 mb-4 border-b border-gray-100">
                <FolderSimpleIcon
                  size={18}
                  weight="duotone"
                  className="text-gray-700"
                />
                <h3 className="font-medium text-gray-900">Add to Folder</h3>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 mb-4">
                Adding{" "}
                <span className="font-medium text-gray-900">"{itemName}"</span>{" "}
                ({ITEM_TYPE_LABEL[itemType]}) to a folder
              </p>

              {/* Folder selection */}
              {hasNoFolders ? (
                <div className="space-y-3">
                  <div className="py-4 text-center">
                    <FolderSimpleIcon
                      size={32}
                      weight="duotone"
                      className="mx-auto text-gray-300 mb-2"
                    />
                    <p className="text-sm text-gray-500">
                      No folders available
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Create a new folder to organize your chats
                    </p>
                  </div>
                  <button
                    onClick={() => setIsCreatingNew(true)}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-800 bg-transparent border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer"
                  >
                    <PlusIcon size={14} weight="bold" />
                    Create New Folder
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Select Folder
                    </label>
                    {/* Custom multi-select trigger — chrome lifted byte-for-byte
                        from the legacy MoveToFolderModal's native <select> so
                        the visual rhythm matches. We only add a focus ring
                        when the dropdown is open (mimicking :focus on the
                        original select). */}
                    <div className="relative">
                      <div
                        ref={triggerRef}
                        onClick={() => {
                          if (isBusy || isLoading) return;
                          setIsDropdownOpen((v) => !v);
                        }}
                        className={`w-full flex flex-wrap items-center gap-1.5 text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-800 cursor-pointer ${
                          isDropdownOpen
                            ? "outline-none ring-2 ring-gray-200 border-gray-400"
                            : ""
                        } ${isBusy || isLoading ? "opacity-60 cursor-not-allowed" : ""}`}
                      >
                        {selectedFolders.length === 0 ? (
                          <span className="text-gray-400">
                            {isLoading ? "Loading…" : "Choose a folder…"}
                          </span>
                        ) : (
                          selectedFolders.map((f) => (
                            <span
                              key={f.folderId}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 bg-gray-100 text-gray-800 text-xs rounded-full"
                            >
                              {f.name}
                              <button
                                type="button"
                                onClick={() => removeChip(f.folderId)}
                                disabled={isBusy}
                                className="inline-flex items-center justify-center w-4 h-4 rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label={`Remove ${f.name}`}
                              >
                                <XIcon size={10} weight="bold" />
                              </button>
                            </span>
                          ))
                        )}
                        <span className="ml-auto flex-shrink-0 text-gray-400">
                          <CaretDownIcon
                            size={14}
                            weight="bold"
                            className={`transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                          />
                        </span>
                      </div>

                      <AnimatePresence>
                        {isDropdownOpen && (
                          <motion.div
                            ref={dropdownRef}
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.12 }}
                            className="absolute z-10 left-0 right-0 mt-1 bg-white border border-gray-100 rounded-lg shadow-lg max-h-[240px] overflow-y-auto"
                          >
                            <ul>
                              {sortedFolders.map((folder) => {
                                const checked = checkedIds.has(folder.folderId);
                                return (
                                  <li key={folder.folderId}>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDropdownChoice(folder.folderId)
                                      }
                                      disabled={isBusy}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-gray-800 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      <span className="inline-flex items-center justify-center w-4 h-4 flex-shrink-0">
                                        {checked ? (
                                          <CheckIcon
                                            size={14}
                                            weight="bold"
                                            className="text-gray-900"
                                          />
                                        ) : null}
                                      </span>
                                      <span className="truncate flex-1">
                                        {folder.name}
                                      </span>
                                    </button>
                                  </li>
                                );
                              })}
                              <li className="border-t border-gray-100">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDropdownChoice(CREATE_NEW)
                                  }
                                  disabled={isBusy}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-gray-800 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <span className="inline-flex items-center justify-center w-4 h-4 flex-shrink-0 text-gray-700">
                                    <PlusIcon size={12} weight="bold" />
                                  </span>
                                  <span className="flex-1">
                                    Create New Folder
                                  </span>
                                </button>
                              </li>
                            </ul>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    {errors.folder && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.folder}
                      </p>
                    )}
                  </div>

                  <AnimatePresence>
                    {isCreatingNew && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="overflow-hidden"
                      >
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                          New Folder Name
                        </label>
                        <input
                          autoFocus
                          value={newFolderName}
                          onChange={(e) => {
                            setNewFolderName(e.target.value);
                            if (errors.name)
                              setErrors((p) => ({ ...p, name: undefined }));
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") void handleConfirm();
                          }}
                          placeholder="Enter folder name…"
                          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-gray-200 focus:border-gray-400"
                        />
                        {errors.name && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.name}
                          </p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Actions — chrome lifted from legacy MoveToFolderModal */}
              <div className="flex items-center gap-2 pt-4 mt-4 border-t border-gray-100">
                <button
                  onClick={handleCancel}
                  className="flex-1 px-3 py-2 text-sm font-medium text-gray-800 bg-transparent border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => void handleConfirm()}
                  disabled={confirmDisabled}
                  className="flex-1 px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
