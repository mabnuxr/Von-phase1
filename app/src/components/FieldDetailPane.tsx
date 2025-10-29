import { useState, useEffect } from "react";
import usePreferencesStore from "../store/preferencesStore";
import type { Field } from "../store/preferencesStore";

export function FieldDetailPane() {
  const { editingFieldId, setEditingField, salesforceFields, updateField } =
    usePreferencesStore();

  // Find the field being edited
  const field = editingFieldId
    ? salesforceFields.find((f) => f.id === editingFieldId)
    : null;

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
      // Validate Salesforce object and field name
      if (
        !formData.salesforceObject ||
        formData.salesforceObject.trim() === ""
      ) {
        alert("Salesforce Object is required");
        return;
      }
      if (
        !formData.salesforceFieldName ||
        formData.salesforceFieldName.trim() === ""
      ) {
        alert("Field Name is required");
        return;
      }

      updateField(editingFieldId, formData);
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
        className={`fixed top-0 right-0 h-full w-[480px] bg-white shadow-elevated z-50 transform transition-transform duration-300 ease-out ${
          editingFieldId ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 m-0">
                Edit Field
              </h2>
              <button
                onClick={handleClose}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg
                  className="size-5"
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
              {/* Name (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1.5">
                  Field Name
                </label>
                <div className="w-full px-3 py-2 text-sm text-gray-700 bg-gray-100 border border-gray-200 rounded-lg">
                  {field.name}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1.5">
                  Description
                </label>
                <textarea
                  value={formData.description || ""}
                  onChange={(e) => handleChange("description", e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-von-purple focus:border-transparent bg-white transition-all duration-200 resize-none"
                  placeholder="Describe what this field is for"
                />
              </div>

              {/* Type (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1.5">
                  Field Type
                </label>
                <input
                  type="text"
                  value={formData.type || ""}
                  disabled
                  className="w-full px-3 py-2 text-sm text-gray-700 bg-gray-100 border border-gray-200 rounded-lg cursor-not-allowed"
                />
                <p className="mt-1.5 text-xs text-gray-500">
                  Field type is predefined for this mapping
                </p>
              </div>

              {/* Salesforce Object */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1.5">
                  Salesforce Object
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  value={formData.salesforceObject || ""}
                  onChange={(e) =>
                    handleChange("salesforceObject", e.target.value)
                  }
                  className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-von-purple focus:border-transparent bg-white transition-all duration-200"
                  placeholder="Opportunity"
                />
                <p className="mt-1.5 text-xs text-gray-500">
                  The Salesforce object (e.g., Opportunity, Account, Contact)
                </p>
              </div>

              {/* Salesforce Field Name */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1.5">
                  Field Name
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  value={formData.salesforceFieldName || ""}
                  onChange={(e) =>
                    handleChange("salesforceFieldName", e.target.value)
                  }
                  className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-von-purple focus:border-transparent bg-white transition-all duration-200"
                  placeholder={
                    field.name === "Amount" ? "Amount" : "Competition__c"
                  }
                />
                <p className="mt-1.5 text-xs text-gray-500">
                  The API name of the field (e.g., Amount, Competition__c)
                </p>
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
                className="px-4 py-2 text-sm font-medium text-white bg-von-purple border border-von-purple rounded-lg hover:bg-von-purple-600 transition-colors duration-200"
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
