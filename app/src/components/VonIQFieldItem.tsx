import usePreferencesStore from "../store/preferencesStore";
import type { VonIQField } from "../store/preferencesStore";
import { ChevronRightIcon } from "./icons";
import { Streamdown } from "streamdown";

interface VonIQFieldItemProps {
  field: VonIQField;
  enabled: boolean;
  isUserDefined: boolean;
}

export function VonIQFieldItem({ field, isUserDefined }: VonIQFieldItemProps) {
  const { expandedFieldIds, toggleFieldExpanded, setEditingField } =
    usePreferencesStore();

  const isExpanded = expandedFieldIds.includes(field.id);

  const handleToggleExpand = () => {
    toggleFieldExpanded(field.id);
  };

  const handleEdit = () => {
    setEditingField(field.id, "voniq");
  };

  return (
    <div className="p-2 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden transition-all duration-200 hover:border-gray-400">
      {/* Collapsed Header - Always Visible */}
      <div className="w-full px-4 py-2.5 flex items-center gap-3">
        {/* Chevron Icon - Clickable area for expand/collapse */}
        <button
          onClick={handleToggleExpand}
          className="flex items-center gap-3 flex-1 min-w-0 text-left hover:opacity-70 transition-opacity"
        >
          <ChevronRightIcon
            className={`size-4 text-gray-600 transition-transform duration-200 shrink-0 ${
              isExpanded ? "rotate-90" : ""
            }`}
          />

          {/* Field Info */}
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-900 m-0">
              {field.sourceFieldDisplayName}
            </h3>
            {isUserDefined && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                Custom
              </span>
            )}
          </div>
        </button>
      </div>

      {/* Expanded Content */}
      <div
        className={`transition-all duration-200 overflow-hidden ${
          isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-6 py-5 border-t border-gray-200 bg-white">
          <div className="space-y-4">
            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Description
              </label>
              <div className="w-full px-3 py-2.5 text-sm text-gray-700 bg-white border border-gray-200 rounded-md min-h-11">
                {field.sourceFieldDescription || ""}
              </div>
            </div>

            {/* API Field Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                API Field Name
              </label>
              <div className="w-full px-3 py-2.5 text-sm text-gray-700 bg-white border border-gray-200 rounded-md min-h-[38px] font-mono">
                {field.name}
              </div>
            </div>

            {/* Data Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Data Type
              </label>
              <div className="w-full px-3 py-2.5 text-sm text-gray-700 bg-white border border-gray-200 rounded-md min-h-[38px]">
                {field.sourceFieldDataType}
              </div>
            </div>

            {/* Field Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Field Type
              </label>
              <div className="w-full px-3 py-2.5 text-sm text-gray-700 bg-white border border-gray-200 rounded-md min-h-[38px]">
                {field.type}
              </div>
            </div>

            {/* Prompt */}
            {field.prompt && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Prompt
                </label>
                <div className="w-full px-3 text-sm text-gray-700 bg-white border border-gray-200 rounded-md min-h-[200px] max-h-[400px] overflow-y-auto">
                  <Streamdown>{field.prompt}</Streamdown>
                </div>
              </div>
            )}

            {/* Edit Button - Only for custom fields */}
            {isUserDefined && (
              <div className="pt-2">
                <button
                  onClick={handleEdit}
                  className="px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200"
                >
                  Edit
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
