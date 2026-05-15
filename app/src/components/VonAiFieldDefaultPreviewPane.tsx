import { useState } from "react";
import { ArrowLeftIcon } from "@phosphor-icons/react";
import type { DefaultAiFieldDefinition } from "../types/vonAiFields";
import { useEnableDefaultAiField } from "../hooks/useVonAiFields";
import { AiFieldSourcesDrawer } from "./ai-fields/AiFieldSourcesDrawer";

// Read-only detail view shown when the user clicks a default AI field row
// that has never been enabled. There's no backend record yet, so the
// content is sourced from the local DEFAULT_AI_FIELDS catalog. The user
// can enable the field from this view; on success the parent transitions
// to the real (materialized) detail pane.
interface VonAiFieldDefaultPreviewPaneProps {
  definition: DefaultAiFieldDefinition;
  onBack: () => void;
  onEnabled: (fieldId: string) => void;
}

export function VonAiFieldDefaultPreviewPane({
  definition,
  onBack,
  onEnabled,
}: VonAiFieldDefaultPreviewPaneProps) {
  const enableMutation = useEnableDefaultAiField();
  const [enabling, setEnabling] = useState(false);

  const handleEnable = async () => {
    setEnabling(true);
    try {
      const created = await enableMutation.mutateAsync(definition);
      onEnabled(created.fieldId);
    } catch {
      setEnabling(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-2">
      {/* Header */}
      <div className="px-4 pt-4 pb-4 border-b border-gray-200 shrink-0">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer mb-4"
        >
          <ArrowLeftIcon size={14} />
          Back to AI Fields
        </button>

        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-semibold text-gray-900 m-0">
                {definition.displayName}
              </h2>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                Disabled
              </span>
            </div>
            {definition.sources.length > 0 && (
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                <AiFieldSourcesDrawer sources={definition.sources} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto settings-scrollbar px-6 py-5">
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Prompt + output types (read-only) */}
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <label className="block text-sm font-semibold text-gray-900">
                Prompt
              </label>
              {definition.columnsToGenerate.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap ml-auto">
                  {definition.columnsToGenerate.map((col) => (
                    <span
                      key={col.name}
                      className="inline-flex items-center px-2 py-0.5 text-xs font-medium text-gray-500 bg-gray-100 rounded"
                    >
                      {col.type}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="w-full px-3 py-2.5 text-sm text-gray-700 border border-gray-200 rounded-lg bg-gray-50 whitespace-pre-wrap font-mono min-h-[80px] max-h-60 overflow-y-auto settings-scrollbar">
              {definition.prompt || "—"}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-gray-200 shrink-0 flex items-center justify-between">
        <span className="text-xs text-gray-400">
          This field hasn&apos;t been enabled yet.
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleEnable}
            disabled={enabling || enableMutation.isPending}
            className="px-4 py-1.5 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {enabling || enableMutation.isPending
              ? "Enabling..."
              : "Enable field"}
          </button>
        </div>
      </div>
    </div>
  );
}
