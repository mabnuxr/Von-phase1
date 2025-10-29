import usePreferencesStore from "../store/preferencesStore";
import type { Field } from "../store/preferencesStore";
import { ChevronRightIcon } from "./icons";

interface FieldItemProps {
  field: Field;
}

export function FieldItem({ field }: FieldItemProps) {
  const { expandedFieldIds, toggleFieldExpanded, setEditingField } =
    usePreferencesStore();

  const isExpanded = expandedFieldIds.includes(field.id);

  const handleToggleExpand = () => {
    toggleFieldExpanded(field.id);
  };

  const handleEdit = () => {
    setEditingField(field.id);
  };

  return (
    <div className="border border-gray-200 bg-white overflow-hidden transition-all duration-200 hover:border-gray-300">
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
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 m-0">
              {field.name}
            </h3>
          </div>
        </button>

        {/* Toggle Switch - Hidden for Salesforce field mapping */}
        {/* <button
          onClick={handleToggleEnabled}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out shrink-0 ${
            field.enabled ? "bg-von-purple" : "bg-gray-300"
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
        </button> */}
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
              <div className="w-full px-3 py-2.5 text-sm text-gray-700 bg-white border border-gray-200 rounded-md min-h-[44px]">
                {field.description || ""}
              </div>
            </div>

            {/* Type (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Type
              </label>
              <div className="w-full px-3 py-2.5 text-sm text-gray-700 bg-white border border-gray-200 rounded-md min-h-[38px]">
                {field.type}
              </div>
            </div>

            {/* Salesforce Object */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Salesforce Object
              </label>
              <div className="w-full px-3 py-2.5 text-sm text-gray-700 bg-white border border-gray-200 rounded-md min-h-[38px]">
                {field.salesforceObject || (
                  <span className="text-gray-400">Not set</span>
                )}
              </div>
            </div>

            {/* Salesforce Field Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Field Name
              </label>
              <div className="w-full px-3 py-2.5 text-sm text-gray-700 bg-white border border-gray-200 rounded-md min-h-[38px]">
                {field.salesforceFieldName || (
                  <span className="text-gray-400">Not set</span>
                )}
              </div>
            </div>

            {/* Edit Button */}
            <div className="pt-2">
              <button
                onClick={handleEdit}
                className="px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200"
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
