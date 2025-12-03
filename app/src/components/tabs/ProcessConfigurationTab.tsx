import { useState, useEffect } from "react";
import {
  MultiSelect,
  type MultiSelectOption,
  SingleSelect,
  Banner,
} from "@vonlabs/design-components";
import usePreferencesStore from "../../store/preferencesStore";
import type {
  BusinessStage,
  CustomerStage,
  ProcessConfigurationSettings,
} from "../../store/preferencesStore";
import { useUpdatePreferences } from "../../hooks/usePreferences";
import { useOpportunityStages } from "../../hooks/useSalesforceStages";

export function ProcessConfigurationTab() {
  const { processConfiguration: storeConfig, updateProcessConfiguration } =
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
    useState<ProcessConfigurationSettings>(storeConfig);

  // Track unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Validation errors
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Success message
  const [showSuccess, setShowSuccess] = useState(false);

  // Initialize form data when store changes (only on mount or external changes)
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

  // Fetch opportunity stages from Salesforce
  const {
    data: opportunityStages,
    isLoading: isLoadingStages,
    error: stagesError,
    refetch: refetchStages,
  } = useOpportunityStages();

  // Business stage options for multi-select (dynamic from Salesforce)
  const businessStageOptions: MultiSelectOption[] =
    opportunityStages?.map((stage) => ({
      value: stage.label,
      label: stage.label,
    })) || [];

  // Customer stage options for multi-select (same as business stages - from Salesforce)
  const customerStageOptions: MultiSelectOption[] =
    opportunityStages?.map((stage) => ({
      value: stage.label,
      label: stage.label,
    })) || [];

  const handleBusinessStagesChange = (selected: string[]) => {
    setFormData((prev) => ({
      ...prev,
      businessStages: selected as BusinessStage[],
    }));
  };

  const handleCustomerStagesChange = (selected: string[]) => {
    setFormData((prev) => ({
      ...prev,
      customerStages: selected as CustomerStage[],
    }));
  };

  const handleFieldChange = (
    field: keyof ProcessConfigurationSettings,
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];

    // Optional: Add validation rules if needed
    // For now, all fields are optional

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
    updateProcessConfiguration(formData);

    // Save to backend using queueUpdate
    queueUpdate({
      processConfiguration: formData,
    });

    // Show success message (optimistic)
    setShowSuccess(true);
    setHasUnsavedChanges(false);

    // Hide success message after 3 seconds
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="flex flex-col h-full p-2">
      {/* Heading - Fixed */}
      <div className="">
        <div className="px-4 pt-4 pb-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Process Configuration
          </h2>
          <p className="text-sm text-gray-600">
            Configure your business processes and sales methodology
          </p>
        </div>
      </div>

      {/* Form Content - Scrollable */}
      <div className="flex-1 justify-center overflow-y-auto settings-scrollbar px-6">
        <div className="pt-6 pb-12 space-y-6 w-2xl mx-auto">
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

          {/* Business Stages Section */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-800 mb-3">
              Choose your business and customer stages
            </label>

            {/* Business Stages Multi-Select */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-700">Business stage</p>
                {stagesError && (
                  <button
                    onClick={() => refetchStages()}
                    className="text-xs text-von-purple hover:text-von-purple-600 font-medium"
                  >
                    Retry
                  </button>
                )}
              </div>
              {stagesError ? (
                <div className="px-3 py-2 flex flex-row justify-between bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-sm text-amber-800 ">
                    {stagesError.message.includes("not found") ||
                    stagesError.message.includes("404")
                      ? "Salesforce integration not connected."
                      : stagesError.message.includes("not authenticated") ||
                          stagesError.message.includes("401")
                        ? "Salesforce integration needs reconnection."
                        : "Failed to load opportunity stages from Salesforce."}
                  </p>
                  <a
                    href="/settings?tab=integrations"
                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Go to Integrations →
                  </a>
                </div>
              ) : (
                <MultiSelect
                  options={businessStageOptions}
                  value={formData.businessStages}
                  onChange={handleBusinessStagesChange}
                  placeholder={
                    isLoadingStages
                      ? "Loading stages from Salesforce..."
                      : "Select business stages..."
                  }
                  disabled={isLoadingStages}
                  fullWidth
                />
              )}
            </div>

            {/* Customer Stages Multi-Select */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-700">Customer stage</p>
                {stagesError && (
                  <button
                    onClick={() => refetchStages()}
                    className="text-xs text-von-purple hover:text-von-purple-600 font-medium"
                  >
                    Retry
                  </button>
                )}
              </div>
              {stagesError ? (
                <div className="px-3 py-2 flex flex-row justify-between bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-sm text-amber-800">
                    {stagesError.message.includes("not found") ||
                    stagesError.message.includes("404")
                      ? "Salesforce integration not connected."
                      : stagesError.message.includes("not authenticated") ||
                          stagesError.message.includes("401")
                        ? "Salesforce integration needs reconnection."
                        : "Failed to load opportunity stages from Salesforce."}
                  </p>
                  <a
                    href="/settings?tab=integrations"
                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Go to Integrations →
                  </a>
                </div>
              ) : (
                <MultiSelect
                  options={customerStageOptions}
                  value={formData.customerStages}
                  onChange={handleCustomerStagesChange}
                  placeholder={
                    isLoadingStages
                      ? "Loading stages from Salesforce..."
                      : "Select customer stages..."
                  }
                  disabled={isLoadingStages}
                  fullWidth
                />
              )}
            </div>
          </div>

          {/* Churn Signal Field */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-800 mb-2 pl-1">
              How do you signify churn in Salesforce?
            </label>
            <textarea
              value={formData.churnSignalField}
              onChange={(e) =>
                handleFieldChange("churnSignalField", e.target.value)
              }
              placeholder="Opportunity type is partial churn or churn"
              className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-gray-100 focus:border-2 focus:border-gray-300 resize-none transition-all duration-200 bg-white hover:border-gray-300 shadow-xs"
              style={{
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
              }}
              rows={2}
            />
          </div>

          {/* Renewal Detection Field */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-800 mb-2 pl-1">
              How do you mark a renewal opportunity?
            </label>
            <textarea
              value={formData.renewalDetectionField}
              onChange={(e) =>
                handleFieldChange("renewalDetectionField", e.target.value)
              }
              placeholder='Either opportunity type contains the word "renewal" or the opportunity name contains the word "renewal"'
              className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-gray-100 focus:border-2 focus:border-gray-300 resize-none transition-all duration-200 bg-white hover:border-gray-300 shadow-xs"
              style={{
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
              }}
              rows={2}
            />
          </div>

          {/* Customer Identification Field */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-800 mb-2 pl-1">
              How do you tell who is a customer?
            </label>
            <textarea
              value={formData.customerIdentificationField}
              onChange={(e) =>
                handleFieldChange("customerIdentificationField", e.target.value)
              }
              placeholder='Account type field, on the account object, is "Customer"'
              className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-gray-100 focus:border-2 focus:border-gray-300 resize-none transition-all duration-200 bg-white hover:border-gray-300 shadow-xs"
              style={{
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
              }}
              rows={2}
            />
          </div>

          {/* Sales Quarter */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-800 mb-2 pl-1">
              What is your sales quarter?
            </label>
            <SingleSelect
              value={formData.salesQuarter}
              onChange={(value: string) =>
                setFormData((prev) => ({
                  ...prev,
                  salesQuarter: value as "Fiscal" | "Calendar",
                }))
              }
              options={[
                { value: "Fiscal", label: "Fiscal" },
                { value: "Calendar", label: "Calendar" },
              ]}
              fullWidth
              showSearch={false}
            />
          </div>

          {/* Business Process */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-800 mb-2 pl-1">
              Business process
            </label>
            <textarea
              value={formData.businessProcess}
              onChange={(e) =>
                handleFieldChange("businessProcess", e.target.value)
              }
              placeholder="1. When someone one is asking about a specific deal. Always use LIMIT 10 - And always give context about the latest deal&#10;&#10;2. While Grouping never use text fields. Especially for user grouping use Id fields never use string fields"
              className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-gray-100 focus:border-2 focus:border-gray-300 resize-none transition-all duration-200 bg-white hover:border-gray-300 shadow-xs"
              style={{
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
              }}
              rows={4}
            />
          </div>

          {/* Tell us more about your company */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-800 mb-2 pl-1">
              Tell us more about your company
            </label>
            <textarea
              value={formData.companyDescription}
              onChange={(e) =>
                handleFieldChange("companyDescription", e.target.value)
              }
              placeholder="Tell us more about your company"
              className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-gray-100 focus:border-2 focus:border-gray-300 resize-none transition-all duration-200 bg-white hover:border-gray-300 shadow-xs"
              style={{
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
              }}
              rows={3}
            />
          </div>

          {/* Keywords */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-800 mb-2 pl-1">
              Keywords
            </label>
            <textarea
              value={formData.keywords}
              onChange={(e) => handleFieldChange("keywords", e.target.value)}
              placeholder="Type comma separated keywords"
              className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-gray-100 focus:border-2 focus:border-gray-300 resize-none transition-all duration-200 bg-white hover:border-gray-300 shadow-xs"
              style={{
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
              }}
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Footer Actions - Sticky */}
      <div className="px-4 py-4 shrink-0 border-t border-gray-200">
        <div className="flex items-center justify-end gap-4">
          {hasUnsavedChanges && (
            <span className="text-sm text-amber-600 font-medium">
              Unsaved changes
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving || !hasUnsavedChanges}
            className="cursor-pointer px-4 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {isSaving ? "Saving..." : "Save Configuration"}
          </button>
        </div>
      </div>
    </div>
  );
}
