import { useState, useEffect } from "react";
import { SidePane } from "@vonlabs/design-components";
import { OrgContextEditor } from "./OrgContextEditor";
import type { MemoryContext } from "../types/memoryContext";
import { MEMORY_CONTEXT_LIMITS } from "../types/memoryContext";

/**
 * Character budget indicator component
 */
function CharacterBudget({ current, max }: { current: number; max: number }) {
  const percentage = (current / max) * 100;
  const colorClass =
    percentage >= 100
      ? "text-red-500"
      : percentage >= 80
        ? "text-amber-500"
        : "text-gray-400";

  return (
    <span className={`text-xs ${colorClass}`}>
      {current}/{max}
    </span>
  );
}

interface MemoryContextPaneProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  context?: MemoryContext | null;
  onSave: (data: {
    key: string;
    description: string;
    value: string;
  }) => Promise<void>;
  isSaving?: boolean;
}

export function MemoryContextPane({
  isOpen,
  onClose,
  mode,
  context,
  onSave,
  isSaving = false,
}: MemoryContextPaneProps) {
  const [editingKey, setEditingKey] = useState("");
  const [editingDescription, setEditingDescription] = useState("");
  const [editingContent, setEditingContent] = useState("");
  // Key to force MDX editor remount when context changes
  const [editorKey, setEditorKey] = useState(0);

  // Reset form when pane opens or context changes
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && context) {
        setEditingKey(context.key);
        setEditingDescription(context.description);
        setEditingContent(context.value || "");
        // Force editor remount with new content
        setEditorKey((prev) => prev + 1);
      } else {
        setEditingKey("");
        setEditingDescription("");
        setEditingContent("");
        setEditorKey((prev) => prev + 1);
      }
    }
  }, [isOpen, mode, context]);

  const handleClose = () => {
    setEditingKey("");
    setEditingDescription("");
    setEditingContent("");
    onClose();
  };

  const handleSave = async () => {
    await onSave({
      key: editingKey,
      description: editingDescription,
      value: editingContent,
    });
  };

  const isValid =
    editingKey.trim().length > 0 && editingDescription.trim().length > 0;

  const footer = (
    <div className="flex items-center justify-end gap-3">
      <button
        onClick={handleClose}
        className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
      >
        Cancel
      </button>
      <button
        onClick={handleSave}
        disabled={!isValid || isSaving}
        className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSaving
          ? mode === "create"
            ? "Creating..."
            : "Saving..."
          : mode === "create"
            ? "Create Memory"
            : "Save Changes"}
      </button>
    </div>
  );

  return (
    <SidePane
      isOpen={isOpen}
      onClose={handleClose}
      title={mode === "create" ? "New Memory" : "Edit Memory"}
      width="480px"
      minWidth={400}
      maxWidth="720px"
      storageKey="memory-context-pane-width"
      footer={footer}
      resizable
    >
      <div className="flex flex-col gap-5 h-full">
        {/* Title */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-gray-700">
              Title <span className="text-red-500">*</span>
            </label>
            <CharacterBudget
              current={editingKey.length}
              max={MEMORY_CONTEXT_LIMITS.key}
            />
          </div>
          <input
            type="text"
            value={editingKey}
            onChange={(e) => setEditingKey(e.target.value)}
            maxLength={MEMORY_CONTEXT_LIMITS.key}
            className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all"
            placeholder="e.g., Pricing Structure"
          />
        </div>

        {/* Description */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-gray-700">
              When should the agent use this?{" "}
              <span className="text-red-500">*</span>
            </label>
            <CharacterBudget
              current={editingDescription.length}
              max={MEMORY_CONTEXT_LIMITS.description}
            />
          </div>
          <textarea
            value={editingDescription}
            onChange={(e) => setEditingDescription(e.target.value)}
            maxLength={MEMORY_CONTEXT_LIMITS.description}
            rows={2}
            className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all resize-none"
            placeholder="e.g., When answering questions about pricing or discounts"
          />
        </div>

        {/* Memory Content */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-gray-700">
              Memory Content
            </label>
            <CharacterBudget
              current={editingContent.length}
              max={MEMORY_CONTEXT_LIMITS.value}
            />
          </div>
          <div className="flex-1 border border-gray-200 rounded-lg overflow-hidden min-h-[200px]">
            <OrgContextEditor
              content={editingContent}
              onChange={setEditingContent}
              isEditing={true}
              placeholder="Add the memory content here..."
              contentKey={`editor-${editorKey}`}
            />
          </div>
        </div>
      </div>
    </SidePane>
  );
}

export default MemoryContextPane;
