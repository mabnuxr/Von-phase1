import { useState, useEffect } from "react";
import usePreferencesStore from "../store/preferencesStore";
import type { Field } from "../store/preferencesStore";
import { ChevronDownIcon } from "./icons";

export function FieldDetailPane() {
  const {
    editingFieldId,
    setEditingField,
    vonFields,
    salesforceFields,
    updateField,
  } = usePreferencesStore();

  // Find the field being edited
  const field = editingFieldId
    ? [...vonFields, ...salesforceFields].find((f) => f.id === editingFieldId)
    : null;

  const category = field
    ? vonFields.some((f) => f.id === field.id)
      ? "von"
      : "salesforce"
    : "von";

  // Form state
  const [formData, setFormData] = useState<Partial<Field>>({});

  // Initialize form data when field changes
  useEffect(() => {
    if (field) {
      setFormData(field);
    }
  }, [field]);

  const handleClose = () => {
    setEditingField(null);
    setFormData({});
  };

  const handleSave = () => {
    if (field && editingFieldId) {
      // Validate required fields
      if (!formData.name || formData.name.trim() === "") {
        alert("Field name is required");
        return;
      }
      if (!formData.apiName || formData.apiName.trim() === "") {
        alert("API name is required");
        return;
      }
      if (!formData.type || formData.type.trim() === "") {
        alert("Type is required");
        return;
      }

      const updatedData = {
        ...formData,
        updatedAt: new Date().toISOString(),
      };
      updateField(editingFieldId, updatedData, category);
      handleClose();
    }
  };

  const handleChange = (fieldName: keyof Field, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  if (!field) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/20 transition-opacity duration-300 z-40 ${
          editingFieldId ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={handleClose}
      />

      {/* Side Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-[480px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out ${
          editingFieldId ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#1d1d1f] m-0">
                Edit Field
              </h2>
              <button
                onClick={handleClose}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    d="M6 18L18 6M6 6l12 12"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto settings-scrollbar px-6 py-4">
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-[#1d1d1f] mb-1.5">
                  Name
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name || ""}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className="w-full px-3 py-2 text-sm text-[#1d1d1f] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white transition-all duration-200"
                  placeholder="Enter field name"
                />
              </div>

              {/* API Name */}
              <div>
                <label className="block text-sm font-medium text-[#1d1d1f] mb-1.5">
                  API Name
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  value={formData.apiName || ""}
                  onChange={(e) => handleChange("apiName", e.target.value)}
                  className="w-full px-3 py-2 text-sm text-[#1d1d1f] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white transition-all duration-200"
                  placeholder="e.g., field_name__c"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-[#1d1d1f] mb-1.5">
                  Description
                </label>
                <textarea
                  value={formData.description || ""}
                  onChange={(e) => handleChange("description", e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-sm text-[#1d1d1f] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white transition-all duration-200 resize-none"
                  placeholder="Describe what this field is for"
                />
              </div>

              {/* Prompt */}
              <div>
                <label className="block text-sm font-medium text-[#1d1d1f] mb-1.5">
                  Prompt
                </label>
                <textarea
                  value={formData.prompt || ""}
                  onChange={(e) => handleChange("prompt", e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 text-sm text-[#1d1d1f] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white transition-all duration-200 resize-none"
                  placeholder="Enter the prompt for this field"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-[#1d1d1f] mb-1.5">
                  Type
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formData.type || ""}
                    onChange={(e) => handleChange("type", e.target.value)}
                    className="w-full px-3 py-2 pr-10 text-sm text-[#1d1d1f] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white transition-all duration-200 cursor-pointer appearance-none"
                  >
                    <option value="">Select type</option>
                    <option value="Text">Text</option>
                    <option value="Number">Number</option>
                    <option value="Date">Date</option>
                    <option value="Boolean">Boolean</option>
                    <option value="Picklist">Picklist</option>
                    <option value="Lookup">Lookup</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <ChevronDownIcon className="w-4 h-4 text-gray-600" />
                  </div>
                </div>
              </div>

              {/* Mapped Salesforce Field */}
              <div>
                <label className="block text-sm font-medium text-[#1d1d1f] mb-1.5">
                  Mapped Salesforce Field
                </label>
                <input
                  type="text"
                  value={formData.mappedSalesforceField || ""}
                  onChange={(e) =>
                    handleChange("mappedSalesforceField", e.target.value)
                  }
                  className="w-full px-3 py-2 text-sm text-[#1d1d1f] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white transition-all duration-200"
                  placeholder="e.g., Account.CustomField__c"
                />
              </div>

              {/* Run Condition - Prompt */}
              <div>
                <label className="block text-sm font-medium text-[#1d1d1f] mb-1.5">
                  Only run if (prompt)
                </label>
                <input
                  type="text"
                  value={formData.runConditionPrompt || ""}
                  onChange={(e) =>
                    handleChange("runConditionPrompt", e.target.value)
                  }
                  className="w-full px-3 py-2 text-sm text-[#1d1d1f] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white transition-all duration-200"
                  placeholder="Enter condition for prompt"
                />
              </div>

              {/* Run Condition - Preview */}
              <div>
                <label className="block text-sm font-medium text-[#1d1d1f] mb-1.5">
                  Only run if (preview)
                </label>
                <input
                  type="text"
                  value={formData.runConditionPreview || ""}
                  onChange={(e) =>
                    handleChange("runConditionPreview", e.target.value)
                  }
                  className="w-full px-3 py-2 text-sm text-[#1d1d1f] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white transition-all duration-200"
                  placeholder="Enter condition for preview"
                />
              </div>

              {/* Source */}
              <div>
                <label className="block text-sm font-medium text-[#1d1d1f] mb-1.5">
                  Source
                </label>
                <input
                  type="text"
                  value={formData.source || ""}
                  onChange={(e) => handleChange("source", e.target.value)}
                  className="w-full px-3 py-2 text-sm text-[#1d1d1f] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white transition-all duration-200"
                  placeholder="Enter source configuration"
                />
              </div>

              {/* Enabled Toggle */}
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.enabled || false}
                    onChange={(e) => handleChange("enabled", e.target.checked)}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-2 focus:ring-purple-500 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-[#1d1d1f]">
                    Field is enabled
                  </span>
                </label>
              </div>

              {/* Timestamps (Read-only) */}
              <div className="pt-2 border-t border-gray-200">
                <div className="flex gap-6 text-xs text-gray-500">
                  <div>
                    <span className="font-medium">Created:</span>{" "}
                    {new Date(field.createdAt).toLocaleString()}
                  </div>
                  <div>
                    <span className="font-medium">Updated:</span>{" "}
                    {new Date(field.updatedAt).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-gray-200 shrink-0">
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-purple-600 rounded-lg hover:bg-purple-700 transition-colors duration-200"
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
