import usePreferencesStore from "../store/preferencesStore";
import type { Field } from "../store/preferencesStore";
import { ChevronRightIcon } from "./icons";

interface FieldItemProps {
  field: Field;
  category: "von" | "salesforce";
}

export function FieldItem({ field, category }: FieldItemProps) {
  const {
    expandedFieldIds,
    toggleFieldExpanded,
    setEditingField,
    toggleFieldEnabled,
  } = usePreferencesStore();

  const isExpanded = expandedFieldIds.includes(field.id);

  const handleToggleExpand = () => {
    toggleFieldExpanded(field.id);
  };

  const handleEdit = () => {
    setEditingField(field.id);
  };

  const handleToggleEnabled = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent expanding/collapsing when clicking toggle
    toggleFieldEnabled(field.id, category);
  };

  return (
    <div className="border border-gray-300 rounded-lg bg-white overflow-hidden transition-all duration-200 hover:border-gray-400">
      {/* Collapsed Header - Always Visible */}
      <div className="w-full px-4 py-3 flex items-center gap-3">
        {/* Chevron Icon - Clickable area for expand/collapse */}
        <button
          onClick={handleToggleExpand}
          className="flex items-center gap-3 flex-1 min-w-0 text-left hover:opacity-70 transition-opacity"
        >
          <ChevronRightIcon
            className={`w-4 h-4 text-gray-600 transition-transform duration-200 shrink-0 ${
              isExpanded ? "rotate-90" : ""
            }`}
          />

          {/* Field Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-[#1d1d1f] m-0">
              {field.name}
            </h3>
            <p className="text-xs text-gray-600 m-0 mt-1">{field.apiName}</p>
          </div>
        </button>

        {/* Toggle Switch */}
        <button
          onClick={handleToggleEnabled}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out shrink-0 ${
            field.enabled ? "bg-purple-600" : "bg-gray-300"
          }`}
          role="switch"
          aria-checked={field.enabled}
          title={field.enabled ? "Disable field" : "Enable field"}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${
              field.enabled ? "translate-x-6" : "translate-x-1"
            }`}
          />
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
            {/* Description - Always show */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Description
              </label>
              <div className="w-full px-3 py-2.5 text-sm text-gray-700 bg-gray-100 border border-gray-200 rounded-md min-h-[44px]">
                {field.description || ""}
              </div>
            </div>

            {/* Prompt - Always show */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Prompt
              </label>
              <div className="w-full px-3 py-2.5 text-sm text-gray-700 bg-gray-100 border border-gray-200 rounded-md min-h-[80px]">
                {field.prompt || ""}
              </div>
            </div>

            {/* Type - Always show */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Type
              </label>
              <div className="w-full px-3 py-2.5 text-sm text-gray-700 bg-gray-100 border border-gray-200 rounded-md min-h-[38px]">
                {field.type || ""}
              </div>
            </div>

            {/* Mapped Salesforce Field - Always show */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Mapped to (Salesforce field)
              </label>
              <div className="w-full px-3 py-2.5 text-sm text-gray-700 bg-gray-100 border border-gray-200 rounded-md min-h-[38px]">
                {field.mappedSalesforceField || ""}
              </div>
            </div>

            {/* Run Condition - Prompt - Always show */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Only run if (#prompt)
              </label>
              <div className="w-full px-3 py-2.5 text-sm text-gray-700 bg-gray-100 border border-gray-200 rounded-md min-h-[38px]">
                {field.runConditionPrompt || ""}
              </div>
            </div>

            {/* Run Condition - Preview - Always show */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Only run if (preview)
              </label>
              <div className="flex items-center gap-2">
                <div className="px-3 py-2.5 text-sm text-gray-700 bg-gray-100 border border-gray-200 rounded-md min-h-[38px] flex items-center">
                  Stage
                </div>
                <div className="px-3 py-2.5 text-sm text-gray-700 bg-gray-100 border border-gray-200 rounded-md min-h-[38px] flex items-center">
                  equal to
                </div>
                <div className="px-3 py-2.5 text-sm text-gray-700 bg-gray-100 border border-gray-200 rounded-md min-h-[38px] flex items-center flex-1">
                  {field.runConditionPreview || ""}
                </div>
              </div>
            </div>

            {/* Source - Always show */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Source
              </label>
              <div className="flex flex-wrap gap-2">
                {field.source && field.source.trim() ? (
                  field.source.split(",").map((src, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-1.5 text-sm text-gray-700 bg-gray-100 border border-gray-200 rounded-md"
                    >
                      {src.trim()}
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-1.5 text-sm text-gray-400 bg-gray-100 border border-gray-200 rounded-md">
                    No source specified
                  </div>
                )}
              </div>
            </div>

            {/* Timestamps */}
            <div className="pt-4 mt-4 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Created by
                  </label>
                  <div className="text-sm text-gray-600">
                    Von on{" "}
                    {new Date(field.createdAt).toLocaleDateString("en-US", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    at{" "}
                    {new Date(field.createdAt).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Last updated by
                  </label>
                  <div className="text-sm text-gray-600">
                    Von on{" "}
                    {new Date(field.updatedAt).toLocaleDateString("en-US", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    at{" "}
                    {new Date(field.updatedAt).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Edit Button */}
            <div className="pt-2">
              <button
                onClick={handleEdit}
                className="px-4 py-2 text-sm font-medium text-[#1d1d1f] bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200"
              >
                Edit
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
