import { useState, useEffect } from "react";
import usePreferencesStore from "../store/preferencesStore";
import type { Field, VonIQField } from "../store/preferencesStore";
import { Banner } from "@vonlabs/design-components";

export function FieldDetailPane() {
  const {
    editingFieldId,
    editingFieldType,
    setEditingField,
    salesforceFields,
    updateField,
    userDefinedVonIQFields,
    updateUserDefinedVonIQField,
    addUserDefinedVonIQField,
  } = usePreferencesStore();

  // Find the field being edited based on type
  const salesforceField =
    editingFieldType === "salesforce" && editingFieldId
      ? salesforceFields.find((f) => f.id === editingFieldId)
      : null;

  const voniqField =
    editingFieldType === "voniq" && editingFieldId
      ? userDefinedVonIQFields.find((f) => f.id === editingFieldId)
      : null;

  const field = salesforceField || voniqField;

  // Check if we're creating a new VonIQ field (editingFieldId is null and type is voniq)
  const isCreatingNewVonIQField =
    editingFieldType === "voniq" && !editingFieldId;

  // Form state
  const [formData, setFormData] = useState<
    Partial<Field> | Partial<VonIQField>
  >({});
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Initialize form data when field changes or when creating new VonIQ field
  useEffect(() => {
    if (field) {
      setFormData(field);
    } else if (isCreatingNewVonIQField) {
      // Initialize empty form for new VonIQ field
      setFormData({
        name: "",
        sourceFieldDisplayName: "",
        sourceFieldDescription: "",
        sourceFieldDataType: "Text",
        type: "string",
      });
    }
  }, [field, isCreatingNewVonIQField]);

  const handleClose = () => {
    setEditingField(null);
    setFormData({});
    setValidationErrors([]);
  };

  const handleSave = () => {
    const errors: string[] = [];

    if (editingFieldType === "salesforce") {
      if (!field || !editingFieldId) return;

      // Validate Salesforce fields
      const sfData = formData as Partial<Field>;
      if (!sfData.salesforceObject || sfData.salesforceObject.trim() === "") {
        errors.push("Salesforce Object is required");
      }
      if (
        !sfData.salesforceFieldName ||
        sfData.salesforceFieldName.trim() === ""
      ) {
        errors.push("Field Name is required");
      }

      if (errors.length > 0) {
        setValidationErrors(errors);
        return;
      }

      updateField(editingFieldId, sfData);
    } else if (editingFieldType === "voniq") {
      const voniqData = formData as Partial<VonIQField>;

      // Validate VonIQ fields (both new and existing)
      if (!voniqData.name || voniqData.name.trim() === "") {
        errors.push("Field Name (API) is required");
      }
      if (
        !voniqData.sourceFieldDisplayName ||
        voniqData.sourceFieldDisplayName.trim() === ""
      ) {
        errors.push("Display Name is required");
      }

      if (errors.length > 0) {
        setValidationErrors(errors);
        return;
      }

      if (isCreatingNewVonIQField) {
        // Create new VonIQ field
        const newField: VonIQField = {
          id: `user-voniq-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: voniqData.name!,
          type: voniqData.type || "string",
          sourceFieldDisplayName: voniqData.sourceFieldDisplayName!,
          sourceFieldDescription: voniqData.sourceFieldDescription || "",
          sourceFieldDataType: voniqData.sourceFieldDataType || "Text",
          isCustom: true,
        };
        addUserDefinedVonIQField(newField);
      } else if (editingFieldId) {
        // Update existing VonIQ field
        updateUserDefinedVonIQField(editingFieldId, voniqData);
      }
    }

    setValidationErrors([]);
    handleClose();
  };

  const handleChange = (fieldName: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const isPanelOpen = editingFieldId || isCreatingNewVonIQField;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/20 transition-opacity duration-300 z-40 ${
          isPanelOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={handleClose}
      />

      {/* Side Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-[480px] bg-white shadow-elevated z-50 transform transition-transform duration-300 ease-in-out ${
          isPanelOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 m-0">
                {isCreatingNewVonIQField ? "Add New VonIQ Field" : "Edit Field"}
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
            {/* Validation Error Banner */}
            {validationErrors.length > 0 && (
              <div className="mb-4">
                <Banner
                  variant="error"
                  message={
                    validationErrors.length === 1
                      ? validationErrors[0]
                      : `Please fix the following errors:\n${validationErrors.map((e) => `• ${e}`).join("\n")}`
                  }
                  onClose={() => setValidationErrors([])}
                  dismissible={true}
                />
              </div>
            )}

            <div className="space-y-4">
              {editingFieldType === "salesforce" ? (
                <>
                  {/* Salesforce Field Form */}
                  {/* Name (Read-only) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1.5">
                      Field Name
                    </label>
                    <div className="w-full px-3 py-2 text-sm text-gray-700 bg-gray-100 border border-gray-200 rounded-lg">
                      {(field as Field)?.name}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1.5">
                      Description
                    </label>
                    <textarea
                      value={(formData as Partial<Field>).description || ""}
                      onChange={(e) =>
                        handleChange("description", e.target.value)
                      }
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
                      value={(formData as Partial<Field>).type || ""}
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
                      value={
                        (formData as Partial<Field>).salesforceObject || ""
                      }
                      onChange={(e) =>
                        handleChange("salesforceObject", e.target.value)
                      }
                      className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-von-purple focus:border-transparent bg-white transition-all duration-200"
                      placeholder="Opportunity"
                    />
                    <p className="mt-1.5 text-xs text-gray-500">
                      The Salesforce object (e.g., Opportunity, Account,
                      Contact)
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
                      value={
                        (formData as Partial<Field>).salesforceFieldName || ""
                      }
                      onChange={(e) =>
                        handleChange("salesforceFieldName", e.target.value)
                      }
                      className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-von-purple focus:border-transparent bg-white transition-all duration-200"
                      placeholder={
                        (field as Field)?.name === "Amount"
                          ? "Amount"
                          : "Competition__c"
                      }
                    />
                    <p className="mt-1.5 text-xs text-gray-500">
                      The API name of the field (e.g., Amount, Competition__c)
                    </p>
                  </div>
                </>
              ) : (
                <>
                  {/* VonIQ Field Form */}
                  {/* Display Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1.5">
                      Display Name
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      value={
                        (formData as Partial<VonIQField>)
                          .sourceFieldDisplayName || ""
                      }
                      onChange={(e) =>
                        handleChange("sourceFieldDisplayName", e.target.value)
                      }
                      className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-von-purple focus:border-transparent bg-white transition-all duration-200"
                      placeholder="Custom Field Display Name"
                    />
                  </div>

                  {/* Field Name (API) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1.5">
                      Field Name (API)
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      value={(formData as Partial<VonIQField>).name || ""}
                      onChange={(e) => handleChange("name", e.target.value)}
                      className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-von-purple focus:border-transparent bg-white transition-all duration-200"
                      placeholder="field_api_name"
                    />
                    <p className="mt-1.5 text-xs text-gray-500">
                      The API name for this field (e.g., custom_field_name)
                    </p>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1.5">
                      Description
                    </label>
                    <textarea
                      value={
                        (formData as Partial<VonIQField>)
                          .sourceFieldDescription || ""
                      }
                      onChange={(e) =>
                        handleChange("sourceFieldDescription", e.target.value)
                      }
                      rows={3}
                      className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-von-purple focus:border-transparent bg-white transition-all duration-200 resize-none"
                      placeholder="Describe what this field is for"
                    />
                  </div>

                  {/* Data Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1.5">
                      Data Type
                    </label>
                    <select
                      value={
                        (formData as Partial<VonIQField>).sourceFieldDataType ||
                        "Text"
                      }
                      onChange={(e) =>
                        handleChange("sourceFieldDataType", e.target.value)
                      }
                      className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-von-purple focus:border-transparent bg-white transition-all duration-200"
                    >
                      <option value="Text">Text</option>
                      <option value="Picklist">Picklist</option>
                      <option value="LONG TEXT AREA">Long Text Area</option>
                      <option value="Checkbox">Checkbox</option>
                      <option value="Number">Number</option>
                      <option value="Date">Date</option>
                    </select>
                  </div>
                </>
              )}
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
