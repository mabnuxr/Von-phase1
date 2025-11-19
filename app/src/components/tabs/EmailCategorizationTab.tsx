import { useState, useEffect } from "react";
import { Banner } from "@vonlabs/design-components";
import usePreferencesStore from "../../store/preferencesStore";
import type { EmailCategorizationSettings } from "../../store/preferencesStore";
import { useUpdatePreferences } from "../../hooks/usePreferences";

export function EmailCategorizationTab() {
  const { emailCategorization: storeConfig, updateEmailCategorization } =
    usePreferencesStore();

  // Get tenant and user info for API call
  const tenantId = localStorage.getItem("tenant_id") || "";
  const userId = localStorage.getItem("user_id") || "";

  // Hook for saving preferences
  const {
    queueUpdate,
    isSaving,
    error: saveError,
  } = useUpdatePreferences(tenantId, userId);

  // Local form state (separate from store)
  const [formData, setFormData] =
    useState<EmailCategorizationSettings>(storeConfig);

  // Track unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Validation errors
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Success message
  const [showSuccess, setShowSuccess] = useState(false);

  // Initialize form data when store changes
  useEffect(() => {
    setFormData(storeConfig);
  }, [storeConfig]);

  // Track changes
  useEffect(() => {
    const hasChanges = JSON.stringify(formData) !== JSON.stringify(storeConfig);
    setHasUnsavedChanges(hasChanges);
  }, [formData, storeConfig]);

  // Handle save errors
  useEffect(() => {
    if (saveError) {
      setValidationErrors([
        saveError.message || "Failed to save configuration. Please try again.",
      ]);
      setShowSuccess(false);
    }
  }, [saveError]);

  const handleFieldChange = (
    field: keyof EmailCategorizationSettings,
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!formData.emailObjectType) {
      errors.push("Email object type is required");
    }
    if (!formData.opportunityField) {
      errors.push("Opportunity field is required");
    }
    if (!formData.accountField) {
      errors.push("Account field is required");
    }
    if (!formData.emailBodyField) {
      errors.push("Email body field is required");
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSave = () => {
    // Clear previous messages
    setValidationErrors([]);
    setShowSuccess(false);

    // Validate form
    if (!validateForm()) {
      return;
    }

    // Update store first (optimistic update)
    updateEmailCategorization(formData);

    // Save to backend using queueUpdate
    queueUpdate({
      emailCategorization: formData,
    });

    // Show success message (optimistic)
    setShowSuccess(true);
    setHasUnsavedChanges(false);

    // Hide success message after 3 seconds
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Form Content - Scrollable */}
      <div className="flex-1 overflow-y-scroll px-6">
        {/* Heading with separator */}
        <div className="pt-6 pb-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Email Correspondence
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Configure how emails are identified and filtered in your CRM
          </p>
        </div>

        <div className="py-6 space-y-6">
          {/* Success Banner */}
          {showSuccess && (
            <Banner
              variant="success"
              message="Configuration saved successfully!"
              onClose={() => setShowSuccess(false)}
              dismissible={true}
            />
          )}

          {/* Error Banner */}
          {validationErrors.length > 0 && (
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
          )}

          {/* Which object are emails logged to? */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-800 mb-3">
              Which object are emails logged to?
              <span
                className="inline-flex items-center justify-center size-4 bg-von-purple-50 text-von-purple-700 rounded-full text-xs cursor-help"
                title="Select the Salesforce object where email activities are logged"
              >
                ?
              </span>
            </label>
            <input
              type="text"
              value={formData.emailObjectType}
              onChange={(e) =>
                handleFieldChange("emailObjectType", e.target.value)
              }
              placeholder="e.g., Task, Email, Activity"
              className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-von-purple-300 focus:border-transparent transition-all duration-200 bg-white hover:border-gray-300"
              required
            />
          </div>

          {/* Which field identifies the opportunity? */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-800 mb-3">
              Which field identifies the opportunity?
              <span
                className="inline-flex items-center justify-center size-4 bg-von-purple-50 text-von-purple-700 rounded-full text-xs cursor-help"
                title="The field that links the email to an opportunity"
              >
                ?
              </span>
            </label>
            <input
              type="text"
              value={formData.opportunityField}
              onChange={(e) =>
                handleFieldChange("opportunityField", e.target.value)
              }
              placeholder="e.g., Related To ID, WhatId"
              className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-von-purple-300 focus:border-transparent transition-all duration-200 bg-white hover:border-gray-300"
              required
            />
          </div>

          {/* Which field identifies the account? */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-800 mb-3">
              Which field identifies the account?
              <span
                className="inline-flex items-center justify-center size-4 bg-von-purple-50 text-von-purple-700 rounded-full text-xs cursor-help"
                title="The field that links the email to an account"
              >
                ?
              </span>
            </label>
            <input
              type="text"
              value={formData.accountField}
              onChange={(e) =>
                handleFieldChange("accountField", e.target.value)
              }
              placeholder="e.g., Account ID, AccountId"
              className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-von-purple-300 focus:border-transparent transition-all duration-200 bg-white hover:border-gray-300"
              required
            />
          </div>

          {/* Which field identifies the email body? */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-800 mb-3">
              Which field identifies the email body?
              <span
                className="inline-flex items-center justify-center size-4 bg-von-purple-50 text-von-purple-700 rounded-full text-xs cursor-help"
                title="The field containing the email content"
              >
                ?
              </span>
            </label>
            <input
              type="text"
              value={formData.emailBodyField}
              onChange={(e) =>
                handleFieldChange("emailBodyField", e.target.value)
              }
              placeholder="e.g., Description, Body"
              className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-von-purple-300 focus:border-transparent transition-all duration-200 bg-white hover:border-gray-300"
              required
            />
          </div>

          {/* Filter records section */}
          {/* TODO: Add a filter emails section */}
        </div>
      </div>

      {/* Footer Actions - Sticky */}
      <div className="px-6 py-4 shrink-0 border-gray-200">
        <div className="flex items-center justify-end gap-4">
          {hasUnsavedChanges && (
            <span className="text-sm text-amber-600 font-medium">
              Unsaved changes
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving || !hasUnsavedChanges}
            className="px-5 py-2.5 text-sm font-medium text-white bg-von-purple rounded-lg hover:bg-von-purple-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
