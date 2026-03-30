import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FolderSimpleIcon, PlusIcon } from "@phosphor-icons/react";

interface FolderOption {
  id: string;
  label: string;
}

interface MoveToFolderModalProps {
  isOpen: boolean;
  itemName: string;
  folders: FolderOption[];
  onConfirm: (config: {
    folderId: string;
    isNewFolder: boolean;
    newFolderName?: string;
  }) => void;
  onCancel: () => void;
}

const CREATE_NEW = "__create_new__";

/**
 * Matches MoveToFolderModal from design-components exactly.
 * Replicated here because it isn't exported from @vonlabs/design-components.
 */
export function MoveToFolderModal({
  isOpen,
  itemName,
  folders,
  onConfirm,
  onCancel,
}: MoveToFolderModalProps) {
  const [selectedId, setSelectedId] = useState("");
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [errors, setErrors] = useState<{ folder?: string; name?: string }>({});

  const reset = () => {
    setSelectedId("");
    setIsCreatingNew(false);
    setNewFolderName("");
    setErrors({});
  };

  const handleCancel = () => {
    reset();
    onCancel();
  };

  const handleSelectChange = (value: string) => {
    setSelectedId(value);
    setIsCreatingNew(value === CREATE_NEW);
    if (value !== CREATE_NEW) setNewFolderName("");
    setErrors({});
  };

  const handleConfirm = () => {
    const errs: typeof errors = {};
    if (!selectedId) errs.folder = "Please select a folder";
    if (isCreatingNew && !newFolderName.trim())
      errs.name = "Folder name is required";
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    onConfirm({
      folderId: isCreatingNew ? "" : selectedId,
      isNewFolder: isCreatingNew,
      newFolderName: isCreatingNew ? newFolderName.trim() : undefined,
    });
    reset();
  };

  const hasNoFolders = folders.length === 0 && !isCreatingNew;

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
                (chat) to a folder
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
                    onClick={() => {
                      setSelectedId(CREATE_NEW);
                      setIsCreatingNew(true);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-800 bg-transparent border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-colors"
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
                    <select
                      value={selectedId}
                      onChange={(e) => handleSelectChange(e.target.value)}
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400 cursor-pointer"
                    >
                      <option value="" disabled>
                        Choose a folder…
                      </option>
                      {folders.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.label}
                        </option>
                      ))}
                      <option value={CREATE_NEW}>＋ Create New Folder</option>
                    </select>
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
                            if (e.key === "Enter") handleConfirm();
                          }}
                          placeholder="Enter folder name…"
                          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400"
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

              {/* Actions */}
              <div className="flex items-center gap-2 pt-4 mt-4 border-t border-gray-100">
                <button
                  onClick={handleCancel}
                  className="flex-1 px-3 py-2 text-sm font-medium text-gray-800 bg-transparent border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={
                    (!selectedId && !hasNoFolders) ||
                    (isCreatingNew && !newFolderName.trim())
                  }
                  className="flex-1 px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingNew ? "Create Folder & Add" : "Add"}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
