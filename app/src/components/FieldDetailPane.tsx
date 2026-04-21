import { useState, useEffect } from "react";
import usePreferencesStore, {
  DEFAULT_VONIQ_FIELDS,
} from "../store/preferencesStore";
import type { Field, VonIQField } from "../store/preferencesStore";
import { Banner, SingleSelect } from "@vonlabs/design-components";
import { Streamdown } from "streamdown";
import { useOpportunityFields } from "../hooks/useSalesforceOpportunityFields";

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

  // Fetch Salesforce Opportunity fields for dropdown
  const {
    data: opportunityFields,
    isLoading: isLoadingFields,
    error: fieldsError,
  } = useOpportunityFields();

  // Clear salesforceFieldName when error occurs to prevent stale data
  useEffect(() => {
    if (fieldsError && editingFieldType === "salesforce") {
      setFormData((prev) => ({
        ...prev,
        salesforceFieldName: "",
      }));
    }
  }, [fieldsError, editingFieldType]);

  // Find the field being editing based on type
  const salesforceField =
    editingFieldType === "salesforce" && editingFieldId
      ? salesforceFields.find((f) => f.id === editingFieldId)
      : null;

  const voniqField =
    editingFieldType === "voniq" && editingFieldId
      ? userDefinedVonIQFields.find(
          (f: VonIQField) => f.id === editingFieldId,
        ) ||
        DEFAULT_VONIQ_FIELDS.find((f: VonIQField) => f.id === editingFieldId)
      : null;

  const field = salesforceField || voniqField;

  // Check if VonIQ field is a default (read-only) field
  const isDefaultVonIQField =
    editingFieldType === "voniq" && voniqField && !voniqField.isCustom
      ? true
      : false;

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
      // For Salesforce fields, ensure salesforceObject defaults to "Opportunity"
      if (editingFieldType === "salesforce") {
        setFormData({
          ...field,
          salesforceObject: (field as Field).salesforceObject || "Opportunity",
        });
      } else {
        setFormData(field);
      }
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
  }, [field, isCreatingNewVonIQField, editingFieldType]);

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

      // Ensure salesforceObject is always "Opportunity"
      updateField(editingFieldId, {
        ...sfData,
        salesforceObject: "Opportunity",
      });
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

  /**
   * Get user-friendly error message based on error type
   */
  const getSalesforceErrorMessage = (error: Error): string => {
    const message = error.message.toLowerCase();
    if (message.includes("not found") || message.includes("404")) {
      return "Salesforce integration not connected.";
    }
    if (
      message.includes("not authenticated") ||
      message.includes("401") ||
      message.includes("403") ||
      message.includes("unauthorized")
    ) {
      return "Salesforce integration needs reconnection.";
    }
    if (
      message.includes("timeout") ||
      message.includes("503") ||
      message.includes("service unavailable")
    ) {
      return "Salesforce is temporarily unavailable. Please try again.";
    }
    if (message.includes("500") || message.includes("internal server")) {
      return "Salesforce server error. Please try again later.";
    }
    if (message.includes("network") || message.includes("fetch")) {
      return "Network error. Please check your connection.";
    }
    return "Failed to load Salesforce fields.";
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
        className={`fixed top-0 right-0 h-full w-[480px] p-2 z-50 transform transition-transform duration-300 ease-in-out ${
          isPanelOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col bg-white rounded-xl border border-gray-200 shadow-xs">
          {/* Header */}
          <div className="px-5 py-3 border-b border-gray-100 shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 m-0">
                {isCreatingNewVonIQField
                  ? "Add New VonIQ Field"
                  : isDefaultVonIQField
                    ? "View Field"
                    : "Edit Field"}
              </h2>
              <button
                onClick={handleClose}
                className="text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
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

                  {/* Salesforce Connection Banner */}
                  {fieldsError && (
                    <div className="px-3 py-2 flex flex-row justify-between bg-amber-50 border border-amber-200 rounded-xl">
                      <p className="text-sm text-amber-800">
                        {getSalesforceErrorMessage(fieldsError)}
                      </p>
                      <a
                        href="/settings?tab=integrations"
                        className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        Go to Integrations →
                      </a>
                    </div>
                  )}

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

                  {/* Salesforce Object (Disabled, defaulted to Opportunity) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1.5">
                      Salesforce Object
                    </label>
                    <input
                      type="text"
                      value="Opportunity"
                      disabled
                      className="w-full px-3 py-2 text-sm text-gray-700 bg-gray-100 border border-gray-200 rounded-lg cursor-not-allowed"
                    />
                  </div>

                  {/* Salesforce Field Name (Dropdown) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1.5">
                      Field Name
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    {isLoadingFields ? (
                      <div className="w-full px-3 py-2 text-sm text-gray-500 border border-gray-300 rounded-lg bg-gray-50">
                        Loading fields...
                      </div>
                    ) : fieldsError ? (
                      <input
                        type="text"
                        value={
                          (formData as Partial<Field>).salesforceFieldName || ""
                        }
                        disabled
                        className="w-full px-3 py-2 text-sm text-gray-500 bg-gray-50 border border-gray-300 rounded-lg cursor-not-allowed"
                        placeholder="Connect Salesforce to load fields"
                      />
                    ) : (
                      <SingleSelect
                        value={
                          (formData as Partial<Field>).salesforceFieldName || ""
                        }
                        onChange={(value: string) =>
                          handleChange("salesforceFieldName", value)
                        }
                        options={
                          opportunityFields?.map((fieldName) => ({
                            value: fieldName,
                            label: fieldName,
                          })) || []
                        }
                        placeholder="Select a field..."
                        fullWidth
                      />
                    )}
                    <p className="mt-1.5 text-xs text-gray-500">
                      Select the field name that corresponds to{" "}
                      {(field as Field)?.name} from the Opportunity object.{" "}
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
                      {!isDefaultVonIQField && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
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
                      disabled={isDefaultVonIQField}
                      className={`w-full px-3 py-2 text-sm ${isDefaultVonIQField ? "text-gray-600 bg-gray-50 cursor-not-allowed" : "text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-von-purple focus:border-transparent"} border border-gray-300 rounded-lg transition-all duration-200`}
                      placeholder="Custom Field Display Name"
                    />
                  </div>

                  {/* Field Name (API) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1.5">
                      Field Name (API)
                      {!isDefaultVonIQField && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={(formData as Partial<VonIQField>).name || ""}
                      onChange={(e) => handleChange("name", e.target.value)}
                      disabled={isDefaultVonIQField}
                      className={`w-full px-3 py-2 text-sm ${isDefaultVonIQField ? "text-gray-600 bg-gray-50 cursor-not-allowed" : "text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-von-purple focus:border-transparent"} border border-gray-300 rounded-lg transition-all duration-200`}
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
                      disabled={isDefaultVonIQField}
                      rows={3}
                      className={`w-full px-3 py-2 text-sm ${isDefaultVonIQField ? "text-gray-600 bg-gray-50 cursor-not-allowed" : "text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-von-purple focus:border-transparent"} border border-gray-300 rounded-lg transition-all duration-200 resize-none`}
                      placeholder="Describe what this field is for"
                    />
                  </div>

                  {/* Data Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1.5">
                      Data Type
                    </label>
                    <SingleSelect
                      value={
                        (formData as Partial<VonIQField>).sourceFieldDataType ||
                        "Text"
                      }
                      onChange={(value: string) =>
                        handleChange("sourceFieldDataType", value)
                      }
                      disabled={isDefaultVonIQField}
                      options={[
                        { value: "Text", label: "Text" },
                        { value: "Picklist", label: "Picklist" },
                        { value: "LONG TEXT AREA", label: "Long Text Area" },
                        { value: "Checkbox", label: "Checkbox" },
                        { value: "Number", label: "Number" },
                        { value: "Date", label: "Date" },
                      ]}
                      fullWidth
                    />
                  </div>

                  {/* Prompt - Only show if prompt exists */}
                  {(formData as Partial<VonIQField>).prompt && (
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1.5">
                        Prompt
                      </label>
                      {isDefaultVonIQField ? (
                        <div className="w-full px-3 py-2 text-sm text-gray-600 bg-gray-50 border border-gray-300 rounded-lg min-h-[200px] max-h-[400px] overflow-y-auto">
                          <Streamdown>
                            {(formData as Partial<VonIQField>).prompt || ""}
                          </Streamdown>
                        </div>
                      ) : (
                        <textarea
                          value={(formData as Partial<VonIQField>).prompt || ""}
                          onChange={(e) =>
                            handleChange("prompt", e.target.value)
                          }
                          rows={10}
                          className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-von-purple focus:border-transparent bg-white transition-all duration-200 resize-none font-mono"
                          placeholder="Enter the prompt for this field (supports markdown)"
                        />
                      )}
                      {!isDefaultVonIQField && (
                        <p className="mt-1.5 text-xs text-gray-500">
                          Markdown formatting is supported
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-gray-200 shrink-0">
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
              >
                {isDefaultVonIQField ? "Close" : "Cancel"}
              </button>
              {!isDefaultVonIQField && (
                <button
                  onClick={handleSave}
                  className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors duration-200 cursor-pointer"
                >
                  Save changes
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
