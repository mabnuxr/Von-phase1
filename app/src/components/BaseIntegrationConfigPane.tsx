import { useState, useEffect } from "react";
import { RadioButton, Banner, Input } from "@vonlabs/design-components";
import {
  useCreateIntegration,
  useUpdateIntegration,
  useAuthorizeIntegration,
  useIntegrations,
} from "../hooks/useIntegrations";
import type { IntegrationType } from "../services/integrationsService";
import {
  INTEGRATION_METADATA,
  getBackendIntegrationType,
} from "../constants/integrationMetadata";
import { InfoIcon } from "./icons";

// Use centralized integration metadata
const integrationDetails = INTEGRATION_METADATA;

interface BaseIntegrationConfigPaneProps {
  integrationId: string;
  accessLevel: "tenant" | "user";
  onClose: () => void;
  editData?: {
    id: string;
    environmentType?: "sandbox" | "production";
    instanceUrl?: string;
    gongApiBaseUrl?: string;
  };
}

export function BaseIntegrationConfigPane({
  integrationId,
  accessLevel,
  onClose,
  editData,
}: BaseIntegrationConfigPaneProps) {
  // Note: setIntegrationsActiveTab removed - no longer using tabs

  const integration = integrationDetails[integrationId];

  // React Query mutations and data
  const createMutation = useCreateIntegration();
  const updateMutation = useUpdateIntegration();
  const authorizeMutation = useAuthorizeIntegration();
  const { data: integrationsData } = useIntegrations();

  // Detect edit mode
  const isEditMode = Boolean(editData?.id);

  // Get backend integration data to check for existing credentials
  const backendIntegration = editData?.id
    ? integrationsData?.integrations.find((i) => i.id === editData.id)
    : null;

  const hasExistingCredentials = backendIntegration?.hasCredentials === true;

  // Form state - initialized fresh on mount, defaults to production
  const [environmentType, setEnvironmentType] = useState<
    "sandbox" | "production"
  >(editData?.environmentType || "production");

  // Salesforce sandbox option toggle (hidden by default, shown if editing sandbox)
  const [showSandboxOption, setShowSandboxOption] = useState(
    editData?.environmentType === "sandbox",
  );

  // Gong API key configuration state
  const [gongApiBaseUrl] = useState(editData?.gongApiBaseUrl || "");
  const [gongAccessKey, setGongAccessKey] = useState("");
  const [gongAccessSecret, setGongAccessSecret] = useState("");

  // Fathom API key configuration state
  const [fathomApiKey, setFathomApiKey] = useState("");

  // Attention API key configuration state
  const [attentionApiKey, setAttentionApiKey] = useState("");

  // Chorus username/password configuration state
  const [chorusUsername, setChorusUsername] = useState("");
  const [chorusPassword, setChorusPassword] = useState("");

  // Clari username/password configuration state
  const [clariUsername, setClariUsername] = useState("");
  const [clariPassword, setClariPassword] = useState("");

  // Validation errors state
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Animation state - starts hidden, animates in on mount
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation after mount using requestAnimationFrame
    // This ensures the initial hidden state is rendered first
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  const handleClose = () => {
    setIsVisible(false); // Trigger slide-out animation
    setTimeout(() => {
      onClose(); // Unmount after animation completes
    }, 300); // Match CSS transition duration
  };

  const handleSave = async () => {
    // Collect validation errors
    const errors: string[] = [];

    // Validation based on integration type
    if (integrationId === "salesforce") {
      if (!environmentType) {
        errors.push("Environment Type is required");
      }
    }

    if (integrationId === "gong") {
      if (!hasExistingCredentials) {
        if (!gongAccessKey) {
          errors.push("Access Key is required");
        }
        if (!gongAccessSecret) {
          errors.push("Access Secret is required");
        }
      }
    }

    if (integrationId === "fathom") {
      // Only require API key if no existing credentials
      if (!hasExistingCredentials) {
        if (!fathomApiKey) {
          errors.push("API Key is required");
        }
      }
    }

    if (integrationId === "attention") {
      if (!hasExistingCredentials) {
        if (!attentionApiKey) {
          errors.push("API Key is required");
        }
      }
    }

    if (integrationId === "chorus") {
      if (!hasExistingCredentials) {
        if (!chorusUsername) {
          errors.push("Username is required");
        }
        if (!chorusPassword) {
          errors.push("Password is required");
        }
      }
    }

    if (integrationId === "claricopilot") {
      if (!hasExistingCredentials) {
        if (!clariUsername) {
          errors.push("API Key is required");
        }
        if (!clariPassword) {
          errors.push("API Password is required");
        }
      }
    }

    // If there are validation errors, display them and return
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    // Clear client-side validation errors
    setValidationErrors([]);

    try {
      // Build config object based on integration type
      const config: Record<string, unknown> = {};

      if (integrationId === "salesforce") {
        config.environment_type = environmentType;
      }

      if (integrationId === "gong") {
        // Store instance URL in config (not sensitive) - standardized with Salesforce
        config.instance_url = gongApiBaseUrl;
      }

      if (isEditMode && editData?.id) {
        // Build update data
        const updateData: {
          accessLevel: "tenant" | "user";
          config: Record<string, unknown>;
          accessKey?: string;
          accessSecret?: string;
        } = {
          accessLevel,
          config,
        };

        // Only send credentials if they were provided (to update them)
        if (integrationId === "gong") {
          if (gongAccessKey) {
            updateData.accessKey = gongAccessKey;
          }
          if (gongAccessSecret) {
            updateData.accessSecret = gongAccessSecret;
          }
        } else if (integrationId === "fathom") {
          if (fathomApiKey) {
            updateData.accessKey = fathomApiKey;
          }
        } else if (integrationId === "attention") {
          if (attentionApiKey) {
            updateData.accessKey = attentionApiKey;
          }
        } else if (integrationId === "chorus") {
          if (chorusUsername) {
            updateData.accessKey = chorusUsername;
          }
          if (chorusPassword) {
            updateData.accessSecret = chorusPassword;
          }
        } else if (integrationId === "claricopilot") {
          if (clariUsername) {
            updateData.accessKey = clariUsername;
          }
          if (clariPassword) {
            updateData.accessSecret = clariPassword;
          }
        }

        // Update existing integration
        await updateMutation.mutateAsync({
          integrationId: editData.id,
          data: updateData,
        });
        // For updates, just close (don't re-authorize)
        handleClose();
      } else {
        // Create new integration
        const savedIntegration = await createMutation.mutateAsync({
          type: getBackendIntegrationType(integrationId) as IntegrationType,
          accessLevel,
          config,
          // Generic API credentials (Gong, Fathom)
          accessKey:
            integrationId === "gong"
              ? gongAccessKey
              : integrationId === "fathom"
                ? fathomApiKey
                : undefined,
          accessSecret: integrationId === "gong" ? gongAccessSecret : undefined,
          // Semantic credentials for Basic Auth and specific integrations
          username: integrationId === "chorus" ? chorusUsername : undefined,
          password:
            integrationId === "chorus"
              ? chorusPassword
              : integrationId === "claricopilot"
                ? clariPassword
                : undefined,
          apiKey:
            integrationId === "attention"
              ? attentionApiKey
              : integrationId === "claricopilot"
                ? clariUsername
                : undefined,
        });

        // Clear sensitive credentials from state after creation
        if (integrationId === "gong") {
          setGongAccessKey("");
          setGongAccessSecret("");
        }
        if (integrationId === "fathom") {
          setFathomApiKey("");
        }
        if (integrationId === "attention") {
          setAttentionApiKey("");
        }
        if (integrationId === "chorus") {
          setChorusUsername("");
          setChorusPassword("");
        }
        if (integrationId === "claricopilot") {
          setClariUsername("");
          setClariPassword("");
        }

        // Only trigger OAuth authorization if required (not for API key integrations)
        if (savedIntegration.requiresOauth === true) {
          try {
            await authorizeMutation.mutateAsync(savedIntegration.id);
            // OAuth initiated successfully - close pane
            handleClose();
          } catch (oauthError: unknown) {
            // Handle OAuth-specific errors
            const oauthErrorMessage =
              oauthError &&
              typeof oauthError === "object" &&
              "message" in oauthError
                ? (oauthError as { message: string }).message
                : "Failed to initiate authorization. Please try again from Active Integrations.";

            // Show error but still navigate (integration was saved successfully)
            setValidationErrors([
              "Integration saved successfully, but authorization failed to start: " +
                oauthErrorMessage,
            ]);

            // Close after showing error for 2 seconds
            setTimeout(() => {
              handleClose();
            }, 2000);
          }
        } else {
          // API key integration - no OAuth needed, just close
          handleClose();
        }
      }
    } catch (error: unknown) {
      console.error("[BaseIntegrationConfigPane] Save error:", error);

      // Handle 409 Conflict errors (duplicate integration)
      // Try multiple error structures that different libraries might use
      if (error && typeof error === "object") {
        // Check for HTTP response with status code
        const response =
          "response" in error
            ? (
                error as {
                  response?: {
                    status?: number;
                    data?: { detail?: string; message?: string };
                  };
                }
              ).response
            : null;

        if (response?.status === 409) {
          const detail = response.data?.detail || response.data?.message;
          setValidationErrors([
            detail ||
              "An integration of this type already exists. Please use the existing integration or contact your admin.",
          ]);
          return;
        }

        // Check for error message that contains duplicate info
        if ("message" in error) {
          const message = (error as { message: string }).message;
          if (
            message.toLowerCase().includes("duplicate") ||
            message.includes("409")
          ) {
            setValidationErrors([
              "An integration of this type already exists. Please use the existing integration or contact your admin.",
            ]);
            return;
          }
        }
      }

      // Handle other errors
      const errorMessage =
        error && typeof error === "object" && "message" in error
          ? (error as { message: string }).message
          : "Failed to save integration. Please try again.";
      setValidationErrors([errorMessage]);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/20 transition-opacity duration-300 z-40 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      />

      {/* Side Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-[480px] p-2 z-50 transform transition-transform duration-300 ease-in-out ${
          isVisible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col bg-white rounded-xl border border-gray-200 shadow-xs">
          {/* Header */}
          <div className="px-5 py-3 border-b border-gray-200 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {integration && (
                  <img
                    src={integration.logoPath}
                    alt={integration.name}
                    className="w-6 h-6 object-contain"
                  />
                )}
                <h2 className="text-lg font-semibold text-gray-900 m-0">
                  {integration?.name} Configuration
                </h2>
              </div>
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
            <div className="space-y-6">
              {/* Workspace Integration Banner */}
              {accessLevel === "tenant" && (
                <div className="rounded-lg border p-3 bg-purple-50 border-purple-200">
                  <div className="flex items-center gap-2">
                    <InfoIcon className="w-4 h-4 text-purple-600 shrink-0" />
                    <p className="text-sm text-purple-700">
                      This integration will be shared with your entire
                      workspace.
                    </p>
                  </div>
                </div>
              )}

              {/* Personal Integration Banner */}
              {accessLevel === "user" && (
                <div className="rounded-lg border p-3 bg-blue-50 border-blue-200">
                  <div className="flex items-center gap-2">
                    <InfoIcon className="w-4 h-4 text-blue-600 shrink-0" />
                    <p className="text-sm text-blue-700">
                      Personal integration, private to your account.
                    </p>
                  </div>
                </div>
              )}

              {/* OAuth Authentication Info - for OAuth integrations */}
              {(integrationId === "salesforce" ||
                integrationId === "googlecalendar") && (
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Authentication type
                  </label>
                  <div
                    className={`flex items-center gap-1.5 text-sm ${accessLevel === "tenant" ? "text-purple-600" : "text-blue-600"}`}
                  >
                    <svg
                      className="size-4 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                    <span>OAuth 2.0</span>
                  </div>
                </div>
              )}

              {/* Salesforce-specific fields */}
              {integrationId === "salesforce" && (
                <>
                  {/* Hidden sandbox option - defaults to production */}
                  {!showSandboxOption ? (
                    <button
                      type="button"
                      onClick={() => setShowSandboxOption(true)}
                      className="text-xs text-gray-400 hover:text-gray-600 underline cursor-pointer"
                    >
                      Connecting to a sandbox?
                    </button>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-3">
                        Environment Type
                      </label>
                      <div className="space-y-2">
                        <RadioButton
                          name="environmentType"
                          value="production"
                          checked={environmentType === "production"}
                          onChange={(e) =>
                            setEnvironmentType(
                              e.target.value as "production" | "sandbox",
                            )
                          }
                          label="Production"
                          helperText="For production Salesforce instances"
                        />
                        <RadioButton
                          name="environmentType"
                          value="sandbox"
                          checked={environmentType === "sandbox"}
                          onChange={(e) =>
                            setEnvironmentType(
                              e.target.value as "production" | "sandbox",
                            )
                          }
                          label="Sandbox"
                          helperText="For sandbox and development environments"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Gong-specific fields */}
              {integrationId === "gong" && (
                <>
                  {/* Access Key */}
                  <div className="gong-input-wrapper">
                    <Input
                      type="password"
                      label="Access Key"
                      value={gongAccessKey}
                      onChange={(e) => setGongAccessKey(e.target.value)}
                      placeholder={
                        hasExistingCredentials ? "••••••••" : "Enter access key"
                      }
                      helperText={
                        hasExistingCredentials
                          ? "Leave empty to keep existing credentials"
                          : "Your Gong access key"
                      }
                      required={!hasExistingCredentials}
                      fullWidth
                    />
                  </div>

                  {/* Access Secret */}
                  <div className="gong-input-wrapper">
                    <Input
                      type="password"
                      label="Access Secret"
                      value={gongAccessSecret}
                      onChange={(e) => setGongAccessSecret(e.target.value)}
                      placeholder={
                        hasExistingCredentials
                          ? "••••••••"
                          : "Enter access secret"
                      }
                      helperText={
                        hasExistingCredentials
                          ? "Leave empty to keep existing credentials"
                          : "Your Gong access secret"
                      }
                      required={!hasExistingCredentials}
                      fullWidth
                    />
                  </div>

                  <style>{`
                      .gong-input-wrapper input::placeholder {
                        font-size: 13px;
                        color: #9ca3af;
                      }
                    `}</style>
                </>
              )}

              {/* Fathom-specific fields */}
              {integrationId === "fathom" && (
                <>
                  {/* API Key */}
                  <div className="fathom-input-wrapper">
                    <Input
                      type="password"
                      label="API Key"
                      value={fathomApiKey}
                      onChange={(e) => setFathomApiKey(e.target.value)}
                      placeholder={
                        hasExistingCredentials
                          ? "••••••••"
                          : "Enter your Fathom API key"
                      }
                      helperText={
                        hasExistingCredentials
                          ? "Leave empty to keep existing API key"
                          : "Your Fathom API key from the Fathom dashboard"
                      }
                      required={!hasExistingCredentials}
                      fullWidth
                    />
                  </div>

                  <style>{`
                      .fathom-input-wrapper input::placeholder {
                        font-size: 13px;
                        color: #9ca3af;
                      }
                    `}</style>
                </>
              )}

              {/* Attention-specific fields */}
              {integrationId === "attention" && (
                <>
                  {/* API Key */}
                  <div className="attention-input-wrapper">
                    <Input
                      type="password"
                      label="API Key"
                      value={attentionApiKey}
                      onChange={(e) => setAttentionApiKey(e.target.value)}
                      placeholder={
                        hasExistingCredentials
                          ? "••••••••"
                          : "Enter your Attention API key"
                      }
                      helperText={
                        hasExistingCredentials
                          ? "Leave empty to keep existing API key"
                          : "Your Attention API key"
                      }
                      required={!hasExistingCredentials}
                      fullWidth
                    />
                  </div>

                  <style>{`
                      .attention-input-wrapper input::placeholder {
                        font-size: 13px;
                        color: #9ca3af;
                      }
                    `}</style>
                </>
              )}

              {/* Chorus-specific fields */}
              {integrationId === "chorus" && (
                <>
                  {/* Username */}
                  <div className="chorus-input-wrapper">
                    <Input
                      type="text"
                      label="Username"
                      value={chorusUsername}
                      onChange={(e) => setChorusUsername(e.target.value)}
                      placeholder={
                        hasExistingCredentials
                          ? "••••••••"
                          : "Enter your Chorus username"
                      }
                      helperText={
                        hasExistingCredentials
                          ? "Leave empty to keep existing username"
                          : "Your Chorus username"
                      }
                      required={!hasExistingCredentials}
                      fullWidth
                    />
                  </div>

                  {/* Password */}
                  <div className="chorus-input-wrapper">
                    <Input
                      type="password"
                      label="Password"
                      value={chorusPassword}
                      onChange={(e) => setChorusPassword(e.target.value)}
                      placeholder={
                        hasExistingCredentials
                          ? "••••••••"
                          : "Enter your Chorus password"
                      }
                      helperText={
                        hasExistingCredentials
                          ? "Leave empty to keep existing password"
                          : "Your Chorus password"
                      }
                      required={!hasExistingCredentials}
                      fullWidth
                    />
                  </div>

                  <style>{`
                      .chorus-input-wrapper input::placeholder {
                        font-size: 13px;
                        color: #9ca3af;
                      }
                    `}</style>
                </>
              )}

              {/* Clari Co-pilot-specific fields */}
              {integrationId === "claricopilot" && (
                <>
                  {/* API Key (stored as username) */}
                  <div className="clari-input-wrapper">
                    <Input
                      type="text"
                      label="API Key"
                      value={clariUsername}
                      onChange={(e) => setClariUsername(e.target.value)}
                      placeholder={
                        hasExistingCredentials
                          ? "••••••••"
                          : "Enter your Clari API key"
                      }
                      helperText={
                        hasExistingCredentials
                          ? "Leave empty to keep existing API key"
                          : "Your Clari API key"
                      }
                      required={!hasExistingCredentials}
                      fullWidth
                    />
                  </div>

                  {/* API Password */}
                  <div className="clari-input-wrapper">
                    <Input
                      type="password"
                      label="API Password"
                      value={clariPassword}
                      onChange={(e) => setClariPassword(e.target.value)}
                      placeholder={
                        hasExistingCredentials
                          ? "••••••••"
                          : "Enter your Clari API password"
                      }
                      helperText={
                        hasExistingCredentials
                          ? "Leave empty to keep existing API password"
                          : "Your Clari API password"
                      }
                      required={!hasExistingCredentials}
                      fullWidth
                    />
                  </div>

                  <style>{`
                      .clari-input-wrapper input::placeholder {
                        font-size: 13px;
                        color: #9ca3af;
                      }
                    `}</style>
                </>
              )}
            </div>

            {/* Validation Errors Banner */}
            {validationErrors.length > 0 && (
              <div className="px-6 pb-4">
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
          </div>

          {/* Help & Security Notice - shown for API key integrations */}
          {(integrationId === "gong" || integrationId === "fathom") && (
            <div className="px-6 py-3 mb-6 border-b border-gray-200 shrink-0">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <a
                  href={
                    integrationId === "gong"
                      ? "https://help.gong.io/docs/receive-access-to-the-api"
                      : "https://developers.fathom.ai/quickstart"
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-gray-700 underline"
                >
                  How to generate{" "}
                  {integrationId === "gong" ? "API credentials" : "an API key"}
                </a>
                <div className="flex items-center gap-1.5">
                  <svg
                    className="size-3 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  <span>Encrypted and secure</span>
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div
            className={`px-6 py-4 border-t border-gray-200 shrink-0 ${integrationId === "gong" || integrationId === "fathom" ? "border-t-0 pt-0" : ""}`}
          >
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                disabled={
                  createMutation.isPending ||
                  updateMutation.isPending ||
                  authorizeMutation.isPending
                }
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={
                  createMutation.isPending ||
                  updateMutation.isPending ||
                  authorizeMutation.isPending
                }
                className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {authorizeMutation.isPending
                  ? "Authorizing..."
                  : createMutation.isPending || updateMutation.isPending
                    ? "Saving..."
                    : isEditMode
                      ? "Update integration"
                      : "Create integration"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
