import { useState, useEffect, useRef } from "react";
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
import usePreferencesStore from "../store/preferencesStore";
import { report } from "../lib/analytics/tracker";

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

  // Get loading state setter from store
  const { setLoadingIntegrationId } = usePreferencesStore();

  // React Query mutations and data
  const createMutation = useCreateIntegration();
  const updateMutation = useUpdateIntegration();
  const authorizeMutation = useAuthorizeIntegration();
  const { data: integrationsData } = useIntegrations();

  // Detect edit mode
  const isEditMode = Boolean(editData?.id);

  // Tracks whether close is coming from a successful save so handleClose
  // doesn't misfire integrationsIntegrationCreateCancelled.
  const closingAfterSuccessRef = useRef(false);

  // Derive auth_method and connection_type for analytics
  const OAUTH_INTEGRATION_IDS = new Set([
    "salesforce",
    "hubspot",
    "googlecalendar",
    "googledrive",
    "box",
    "gmail",
    "granola",
    "notion",
    "outreachengage",
  ]);
  const authMethod = OAUTH_INTEGRATION_IDS.has(integrationId)
    ? "OAuth"
    : "API Key";
  const connectionType = accessLevel === "tenant" ? "Workspace" : "Personal";

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

  // Salesloft API key configuration state
  const [salesloftApiKey, setSalesloftApiKey] = useState("");
  // Jiminny API key configuration state
  const [jiminnyApiKey, setJiminnyApiKey] = useState("");
  // Gainsight API key + per-tenant domain configuration state
  const [gainsightApiKey, setGainsightApiKey] = useState("");
  const [gainsightDomain, setGainsightDomain] = useState(
    editData?.instanceUrl || "",
  );
  const [gainsightDomainError, setGainsightDomainError] = useState("");

  // Chorus username/password configuration state
  const [chorusUsername, setChorusUsername] = useState("");
  const [chorusPassword, setChorusPassword] = useState("");

  // Clari username/password configuration state
  const [clariUsername, setClariUsername] = useState("");
  const [clariPassword, setClariPassword] = useState("");

  // Zendesk API token configuration state
  const [zendeskSubdomain, setZendeskSubdomain] = useState(
    editData?.instanceUrl || "",
  );
  const [zendeskSubdomainError, setZendeskSubdomainError] = useState("");
  const [zendeskEmail, setZendeskEmail] = useState("");
  const [zendeskApiToken, setZendeskApiToken] = useState("");

  // Snowflake key-pair configuration state
  const [snowflakeDomain, setSnowflakeDomain] = useState("");
  const [snowflakeAccountId, setSnowflakeAccountId] = useState("");
  const [snowflakeUsername, setSnowflakeUsername] = useState("");
  const [snowflakePrivateKey, setSnowflakePrivateKey] = useState("");

  // Databricks OAuth M2M configuration state
  const [databricksWorkspaceUrl, setDatabricksWorkspaceUrl] = useState("");
  const [databricksClientId, setDatabricksClientId] = useState("");
  const [databricksClientSecret, setDatabricksClientSecret] = useState("");
  const [databricksWarehouseId, setDatabricksWarehouseId] = useState("");

  // BigQuery service account configuration state
  const [bigqueryServiceAccountJson, setBigqueryServiceAccountJson] =
    useState("");

  // Slack Workspace bot-token state. The token is stored in Scalekit (not Von),
  // but Von captures it from the user here and forwards to Scalekit via the
  // standard API-key create path. Channel-pattern config is a separate pane
  // surfaced via the gear icon on the connected tile.
  const [slackWorkspaceBotToken, setSlackWorkspaceBotToken] = useState("");

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
    if (!isEditMode && !closingAfterSuccessRef.current) {
      report.integrationsIntegrationCreateCancelled({
        integrationName: integration?.name ?? integrationId,
        integrationCategory:
          INTEGRATION_METADATA[integrationId]?.category ?? "",
        connectionType,
        authMethod,
      });
    }
    closingAfterSuccessRef.current = false;
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

    if (integrationId === "slack_workspace") {
      if (!hasExistingCredentials && !slackWorkspaceBotToken) {
        errors.push("Bot Token is required");
      }
    }

    if (integrationId === "salesloft_engagement") {
      if (!hasExistingCredentials) {
        if (!salesloftApiKey) {
          errors.push("API Key is required");
        }
      }
    }

    if (integrationId === "jiminny") {
      if (!hasExistingCredentials) {
        if (!jiminnyApiKey) {
          errors.push("API Key is required");
        }
      }
    }

    if (integrationId === "gainsight") {
      // Domain required on every save — Scalekit URL template substitutes {{domain}}.
      setGainsightDomainError("");
      if (!gainsightDomain) {
        errors.push("Gainsight Domain is required");
        setGainsightDomainError("Gainsight Domain is required");
      } else if (/^https?:\/\//i.test(gainsightDomain)) {
        errors.push("Domain should not include http:// or https://");
        setGainsightDomainError(
          "Domain should not include http:// or https://",
        );
      } else if (!/\.gainsightcloud\.com$/i.test(gainsightDomain)) {
        errors.push(
          "Enter the full Gainsight host (e.g. yourcompany.gainsightcloud.com)",
        );
        setGainsightDomainError(
          "Enter the full Gainsight host (e.g. yourcompany.gainsightcloud.com)",
        );
      }
      if (!hasExistingCredentials) {
        if (!gainsightApiKey) {
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

    if (integrationId === "zendesk") {
      if (!zendeskSubdomain) {
        errors.push("Subdomain is required");
      } else if (/^https?:\/\//i.test(zendeskSubdomain)) {
        errors.push("Subdomain should not include http:// or https://");
      } else if (!/\.zendesk\.com$/i.test(zendeskSubdomain)) {
        errors.push("Enter the full domain (e.g. yourcompany.zendesk.com)");
      }
      if (!hasExistingCredentials) {
        if (!zendeskEmail) {
          errors.push("Email is required");
        }
        if (!zendeskApiToken) {
          errors.push("API Token is required");
        }
      }
    }

    if (integrationId === "snowflake") {
      if (!hasExistingCredentials) {
        if (!snowflakeDomain) {
          errors.push("Snowflake Domain is required");
        }
        if (!snowflakeAccountId) {
          errors.push("Account ID is required");
        }
        if (!snowflakeUsername) {
          errors.push("Username is required");
        }
        if (!snowflakePrivateKey) {
          errors.push("Private Key is required");
        }
      }
    }

    if (integrationId === "bigquery") {
      if (!hasExistingCredentials) {
        if (!bigqueryServiceAccountJson.trim()) {
          errors.push("Service Account JSON is required");
        } else {
          try {
            const parsed = JSON.parse(bigqueryServiceAccountJson);
            if (parsed.type !== "service_account") {
              errors.push(
                'Invalid service account key — the JSON must have "type": "service_account"',
              );
            }
          } catch {
            errors.push(
              "Invalid JSON — paste the full contents of your .json key file",
            );
          }
        }
      }
    }

    if (integrationId === "databricks") {
      if (!hasExistingCredentials) {
        if (!databricksWorkspaceUrl) {
          errors.push("Workspace URL is required");
        } else if (
          !/^[a-z0-9-]+\.cloud\.databricks\.com$/.test(databricksWorkspaceUrl)
        ) {
          errors.push(
            "Workspace URL must be a valid Databricks hostname (e.g. dbc-b69d7b3c-a430.cloud.databricks.com)",
          );
        }
        if (!databricksClientId) {
          errors.push("Client ID is required");
        }
        if (!databricksClientSecret) {
          errors.push("Client Secret is required");
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

      if (integrationId === "zendesk") {
        config.instance_url = zendeskSubdomain;
      }

      if (integrationId === "gainsight") {
        config.instance_url = gainsightDomain;
      }

      if (integrationId === "databricks" && databricksWarehouseId) {
        config.warehouse_id = databricksWarehouseId;
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
        } else if (integrationId === "slack_workspace") {
          // BE config (slack_workspace.py) maps `api_key` → Scalekit static_auth.
          // Sending `accessKey` was silently dropped, so the token never reached
          // Scalekit and get_bot_token failed with an empty access_token.
          if (slackWorkspaceBotToken) {
            (updateData as Record<string, unknown>).apiKey =
              slackWorkspaceBotToken;
          }
        } else if (integrationId === "salesloft_engagement") {
          if (salesloftApiKey) {
            updateData.accessKey = salesloftApiKey;
          }
        } else if (integrationId === "jiminny") {
          if (jiminnyApiKey) {
            (updateData as Record<string, unknown>).apiKey = jiminnyApiKey;
          }
        } else if (integrationId === "gainsight") {
          if (gainsightApiKey) {
            (updateData as Record<string, unknown>).apiKey = gainsightApiKey;
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
        } else if (integrationId === "zendesk") {
          if (zendeskEmail) {
            updateData.accessKey = zendeskEmail;
          }
          if (zendeskApiToken) {
            updateData.accessSecret = zendeskApiToken;
          }
        } else if (integrationId === "snowflake") {
          if (snowflakeDomain) {
            updateData.accessKey = snowflakeDomain;
          }
          if (snowflakePrivateKey) {
            updateData.accessSecret = snowflakePrivateKey;
          }
          if (snowflakeUsername) {
            (updateData as Record<string, unknown>).username =
              snowflakeUsername;
          }
          if (snowflakeAccountId) {
            (updateData as Record<string, unknown>).apiKey = snowflakeAccountId;
          }
        } else if (integrationId === "bigquery") {
          if (bigqueryServiceAccountJson.trim()) {
            (updateData as Record<string, unknown>).serviceAccountJson =
              bigqueryServiceAccountJson.trim();
          }
        } else if (integrationId === "databricks") {
          if (databricksClientId) {
            updateData.accessKey = databricksClientId;
          }
          if (databricksClientSecret) {
            updateData.accessSecret = databricksClientSecret;
          }
          if (databricksWorkspaceUrl) {
            (updateData as Record<string, unknown>).apiKey =
              databricksWorkspaceUrl;
          }
          if (databricksWarehouseId) {
            if (!updateData.config) updateData.config = {};
            (updateData.config as Record<string, unknown>).warehouse_id =
              databricksWarehouseId;
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
          // Generic API credentials (Gong, Fathom, Snowflake)
          accessKey:
            integrationId === "gong"
              ? gongAccessKey
              : integrationId === "fathom"
                ? fathomApiKey
                : integrationId === "zendesk"
                  ? zendeskEmail
                  : integrationId === "snowflake"
                    ? snowflakeDomain
                    : integrationId === "databricks"
                      ? databricksClientId
                      : undefined,
          accessSecret:
            integrationId === "gong"
              ? gongAccessSecret
              : integrationId === "zendesk"
                ? zendeskApiToken
                : integrationId === "snowflake"
                  ? snowflakePrivateKey
                  : integrationId === "databricks"
                    ? databricksClientSecret
                    : undefined,
          // Semantic credentials for Basic Auth and specific integrations
          username:
            integrationId === "chorus"
              ? chorusUsername
              : integrationId === "snowflake"
                ? snowflakeUsername
                : undefined,
          password:
            integrationId === "chorus"
              ? chorusPassword
              : integrationId === "claricopilot"
                ? clariPassword
                : undefined,
          apiKey:
            integrationId === "attention"
              ? attentionApiKey
              : integrationId === "slack_workspace"
                ? slackWorkspaceBotToken
                : integrationId === "salesloft_engagement"
                  ? salesloftApiKey
                  : integrationId === "jiminny"
                    ? jiminnyApiKey
                    : integrationId === "gainsight"
                      ? gainsightApiKey
                      : integrationId === "claricopilot"
                        ? clariUsername
                        : integrationId === "snowflake"
                          ? snowflakeAccountId
                          : integrationId === "databricks"
                            ? databricksWorkspaceUrl
                            : undefined,
          // BigQuery service account JSON
          serviceAccountJson:
            integrationId === "bigquery"
              ? bigqueryServiceAccountJson
              : undefined,
          name: integrationId === "bigquery" ? "BigQuery" : undefined,
        });

        report.integrationsIntegrationCreated({
          integrationName: integration?.name ?? integrationId,
          integrationCategory:
            INTEGRATION_METADATA[integrationId]?.category ?? "",
          connectionType,
          authMethod,
          success: true,
          error: null,
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
        if (integrationId === "slack_workspace") {
          setSlackWorkspaceBotToken("");
        }
        if (integrationId === "salesloft_engagement") {
          setSalesloftApiKey("");
        }
        if (integrationId === "jiminny") {
          setJiminnyApiKey("");
        }
        if (integrationId === "gainsight") {
          setGainsightApiKey("");
        }
        if (integrationId === "chorus") {
          setChorusUsername("");
          setChorusPassword("");
        }
        if (integrationId === "claricopilot") {
          setClariUsername("");
          setClariPassword("");
        }
        if (integrationId === "zendesk") {
          setZendeskEmail("");
          setZendeskApiToken("");
        }
        if (integrationId === "snowflake") {
          setSnowflakeDomain("");
          setSnowflakeAccountId("");
          setSnowflakeUsername("");
          setSnowflakePrivateKey("");
        }
        if (integrationId === "databricks") {
          setDatabricksWorkspaceUrl("");
          setDatabricksClientId("");
          setDatabricksClientSecret("");
          setDatabricksWarehouseId("");
        }
        if (integrationId === "bigquery") {
          setBigqueryServiceAccountJson("");
        }

        // Only trigger OAuth authorization if required (not for API key integrations)
        if (savedIntegration.requiresOauth === true) {
          try {
            await authorizeMutation.mutateAsync(savedIntegration.id);
            // Set loading state AFTER authorize completes to start polling with correct status
            setLoadingIntegrationId(savedIntegration.id);
            // OAuth initiated successfully - close pane
            closingAfterSuccessRef.current = true;
            handleClose();
          } catch (oauthError: unknown) {
            // Clear loading state on error
            setLoadingIntegrationId(null);

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
              closingAfterSuccessRef.current = true;
              handleClose();
            }, 2000);
          }
        } else {
          // API key integration - no OAuth needed, just close
          closingAfterSuccessRef.current = true;
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

        // BigQuery-specific error handling using ApiError.statusCode
        const statusCode =
          "statusCode" in error
            ? (error as { statusCode: number }).statusCode
            : response?.status;

        if (integrationId === "bigquery" && statusCode) {
          if (statusCode === 403) {
            setValidationErrors([
              "BigQuery integration is not enabled for this account.",
            ]);
            return;
          }
          if (statusCode === 400) {
            setValidationErrors([
              "Invalid service account key — paste the full JSON file contents.",
            ]);
            return;
          }
          if (statusCode === 500) {
            setValidationErrors([
              "Could not validate service account. Check that the key is valid and the service account exists.",
            ]);
            return;
          }
        }

        if (statusCode === 409 || response?.status === 409) {
          const detail = response?.data?.detail || response?.data?.message;
          setValidationErrors([
            detail ||
              (integrationId === "bigquery"
                ? "A BigQuery integration already exists. Use Reconnect to update credentials."
                : "An integration of this type already exists. Please use the existing integration or contact your admin."),
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
      if (!isEditMode) {
        report.integrationsIntegrationCreated({
          integrationName: integration?.name ?? integrationId,
          integrationCategory:
            INTEGRATION_METADATA[integrationId]?.category ?? "",
          connectionType,
          authMethod,
          success: false,
          error: errorMessage,
        });
      }
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
        className={`fixed top-0 right-0 h-full w-120 p-2 z-50 transform transition-transform duration-300 ease-in-out ${
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
                  {integration?.name}
                  {integration?.configTitleSuffix ?? " Configuration"}
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
              {/* OAuth Authentication Info - for OAuth integrations */}
              {(integrationId === "salesforce" ||
                integrationId === "hubspot" ||
                integrationId === "googlecalendar" ||
                integrationId === "googledrive" ||
                integrationId === "box" ||
                integrationId === "gmail" ||
                integrationId === "granola" ||
                integrationId === "notion" ||
                integrationId === "outreachengage" ||
                integrationId === "slack_personal") && (
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
              {integrationId === "slack_workspace" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Authentication type
                    </label>
                    <div className="flex items-center gap-1.5 text-sm text-purple-600">
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
                      <span>Bearer Token</span>
                    </div>
                  </div>
                  <Input
                    type="password"
                    label="Bot Token"
                    value={slackWorkspaceBotToken}
                    onChange={(e) => setSlackWorkspaceBotToken(e.target.value)}
                    placeholder={
                      hasExistingCredentials ? "••••••••" : "xoxb-..."
                    }
                    helperText={
                      hasExistingCredentials
                        ? "Leave empty to keep existing bot token"
                        : "Your Slack workspace bot token"
                    }
                    required={!hasExistingCredentials}
                    fullWidth
                  />
                </>
              )}

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

              {/* Jiminny-specific fields */}
              {integrationId === "jiminny" && (
                <>
                  <div className="jiminny-input-wrapper">
                    <Input
                      type="password"
                      label="API Key"
                      value={jiminnyApiKey}
                      onChange={(e) => setJiminnyApiKey(e.target.value)}
                      placeholder={
                        hasExistingCredentials
                          ? "••••••••"
                          : "Enter your Jiminny API key"
                      }
                      helperText={
                        hasExistingCredentials
                          ? "Leave empty to keep existing API key"
                          : "Your Jiminny API key"
                      }
                      required={!hasExistingCredentials}
                      fullWidth
                    />
                  </div>

                  <style>{`
                      .jiminny-input-wrapper input::placeholder {
                        font-size: 13px;
                        color: #9ca3af;
                      }
                    `}</style>
                </>
              )}

              {/* Gainsight-specific fields */}
              {integrationId === "gainsight" && (
                <>
                  {/* Per-tenant Gainsight host — substituted into Scalekit's {{domain}} URL template */}
                  <div className="gainsight-input-wrapper">
                    <Input
                      type="text"
                      label="Gainsight Domain"
                      value={gainsightDomain}
                      onChange={(e) => {
                        setGainsightDomain(e.target.value);
                        if (gainsightDomainError) setGainsightDomainError("");
                      }}
                      placeholder="yourcompany.gainsightcloud.com"
                      helperText="Full Gainsight host (without https://). Each tenant has their own subdomain."
                      required
                      fullWidth
                      error={!!gainsightDomainError}
                      errorMessage={gainsightDomainError}
                    />
                  </div>

                  <div className="gainsight-input-wrapper">
                    <Input
                      type="password"
                      label="API Access Key"
                      value={gainsightApiKey}
                      onChange={(e) => setGainsightApiKey(e.target.value)}
                      placeholder={
                        hasExistingCredentials
                          ? "••••••••"
                          : "Enter your Gainsight API access key"
                      }
                      helperText={
                        hasExistingCredentials
                          ? "Leave empty to keep existing API key"
                          : "Your Gainsight API access key"
                      }
                      required={!hasExistingCredentials}
                      fullWidth
                    />
                  </div>

                  <style>{`
                      .gainsight-input-wrapper input::placeholder {
                        font-size: 13px;
                        color: #9ca3af;
                      }
                    `}</style>
                </>
              )}

              {/* Salesloft Engagement-specific fields */}
              {integrationId === "salesloft_engagement" && (
                <>
                  {/* API Key */}
                  <div className="salesloft-input-wrapper">
                    <Input
                      type="password"
                      label="API Key"
                      value={salesloftApiKey}
                      onChange={(e) => setSalesloftApiKey(e.target.value)}
                      placeholder={
                        hasExistingCredentials
                          ? "••••••••"
                          : "Enter your Salesloft API key"
                      }
                      helperText={
                        hasExistingCredentials
                          ? "Leave empty to keep existing API key"
                          : "Your Salesloft API key"
                      }
                      required={!hasExistingCredentials}
                      fullWidth
                    />
                  </div>

                  <style>{`
                      .salesloft-input-wrapper input::placeholder {
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

              {/* Zendesk-specific fields */}
              {integrationId === "zendesk" && (
                <>
                  {/* Subdomain */}
                  <div className="zendesk-input-wrapper">
                    <Input
                      type="text"
                      label="Subdomain"
                      value={zendeskSubdomain}
                      onChange={(e) => {
                        const value = e.target.value;
                        setZendeskSubdomain(value);
                        if (/^https?:\/\//i.test(value)) {
                          setZendeskSubdomainError(
                            "Please enter the subdomain without http:// or https://",
                          );
                        } else if (value && !/\.zendesk\.com$/i.test(value)) {
                          setZendeskSubdomainError(
                            "Enter the full domain (e.g. yourcompany.zendesk.com)",
                          );
                        } else {
                          setZendeskSubdomainError("");
                        }
                      }}
                      placeholder="yourcompany.zendesk.com"
                      helperText="Your Zendesk subdomain (e.g. yourcompany.zendesk.com)"
                      error={!!zendeskSubdomainError}
                      errorMessage={zendeskSubdomainError}
                      required
                      fullWidth
                    />
                  </div>

                  {/* Email */}
                  <div className="zendesk-input-wrapper">
                    <Input
                      type="text"
                      label="Email"
                      value={zendeskEmail}
                      onChange={(e) => setZendeskEmail(e.target.value)}
                      placeholder={
                        hasExistingCredentials
                          ? "••••••••"
                          : "you@yourcompany.com"
                      }
                      helperText={
                        hasExistingCredentials
                          ? "Leave empty to keep existing email"
                          : "Your Zendesk account email"
                      }
                      required={!hasExistingCredentials}
                      fullWidth
                    />
                  </div>

                  {/* API Token */}
                  <div className="zendesk-input-wrapper">
                    <Input
                      type="password"
                      label="API Token"
                      value={zendeskApiToken}
                      onChange={(e) => setZendeskApiToken(e.target.value)}
                      placeholder={
                        hasExistingCredentials
                          ? "••••••••"
                          : "Enter your Zendesk API token"
                      }
                      helperText={
                        hasExistingCredentials
                          ? "Leave empty to keep existing API token"
                          : "Your Zendesk API token"
                      }
                      required={!hasExistingCredentials}
                      fullWidth
                    />
                  </div>

                  <style>{`
                    .zendesk-input-wrapper input::placeholder {
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

              {/* Snowflake-specific fields */}
              {integrationId === "snowflake" && (
                <>
                  {/* Snowflake Domain */}
                  <div className="snowflake-input-wrapper">
                    <Input
                      type="text"
                      label="Snowflake Domain"
                      value={snowflakeDomain}
                      onChange={(e) => setSnowflakeDomain(e.target.value)}
                      placeholder={
                        hasExistingCredentials
                          ? "••••••••"
                          : "e.g. myorg-myaccount.snowflakecomputing.com"
                      }
                      helperText={
                        hasExistingCredentials
                          ? "Leave empty to keep existing value"
                          : "Your Snowflake account URL (from browser address bar)"
                      }
                      required={!hasExistingCredentials}
                      fullWidth
                    />
                  </div>

                  {/* Account ID */}
                  <div className="snowflake-input-wrapper">
                    <Input
                      type="text"
                      label="Account ID"
                      value={snowflakeAccountId}
                      onChange={(e) => setSnowflakeAccountId(e.target.value)}
                      placeholder={
                        hasExistingCredentials
                          ? "••••••••"
                          : "e.g. GUDBKFU-PIB99761"
                      }
                      helperText={
                        hasExistingCredentials
                          ? "Leave empty to keep existing value"
                          : "Your Snowflake account identifier (orgname-accountname)"
                      }
                      required={!hasExistingCredentials}
                      fullWidth
                    />
                  </div>

                  {/* Username */}
                  <div className="snowflake-input-wrapper">
                    <Input
                      type="text"
                      label="Username"
                      value={snowflakeUsername}
                      onChange={(e) => setSnowflakeUsername(e.target.value)}
                      placeholder={
                        hasExistingCredentials
                          ? "••••••••"
                          : "Enter your Snowflake username"
                      }
                      helperText={
                        hasExistingCredentials
                          ? "Leave empty to keep existing username"
                          : "Your Snowflake user for key-pair authentication"
                      }
                      required={!hasExistingCredentials}
                      fullWidth
                    />
                  </div>

                  {/* Private Key */}
                  <div className="snowflake-input-wrapper">
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Private Key{" "}
                      {!hasExistingCredentials && (
                        <span className="text-red-500">*</span>
                      )}
                    </label>
                    <textarea
                      value={snowflakePrivateKey}
                      onChange={(e) => setSnowflakePrivateKey(e.target.value)}
                      placeholder={
                        hasExistingCredentials
                          ? "••••••••"
                          : "Paste your RSA private key (PEM format)"
                      }
                      rows={6}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none font-mono"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {hasExistingCredentials
                        ? "Leave empty to keep existing private key"
                        : "RSA private key in PEM format (begins with -----BEGIN PRIVATE KEY-----)"}
                    </p>
                  </div>

                  <style>{`
                      .snowflake-input-wrapper input::placeholder,
                      .snowflake-input-wrapper textarea::placeholder {
                        font-size: 13px;
                        color: #9ca3af;
                      }
                    `}</style>
                </>
              )}

              {/* BigQuery-specific fields */}
              {integrationId === "bigquery" && (
                <>
                  {/* Service Account JSON */}
                  <div className="bigquery-input-wrapper">
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Service Account JSON{" "}
                      {!hasExistingCredentials && (
                        <span className="text-red-500">*</span>
                      )}
                    </label>
                    <textarea
                      value={bigqueryServiceAccountJson}
                      onChange={(e) =>
                        setBigqueryServiceAccountJson(e.target.value)
                      }
                      placeholder={
                        hasExistingCredentials
                          ? "••••••••"
                          : "Paste the full contents of your .json key file..."
                      }
                      rows={8}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none font-mono"
                    />
                    <div className="mt-1.5 flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        {hasExistingCredentials
                          ? "Leave empty to keep existing credentials"
                          : "Full JSON contents of the service account key file"}
                      </p>
                      <label className="text-xs text-gray-500 hover:text-gray-700 underline cursor-pointer">
                        Upload .json file
                        <input
                          type="file"
                          accept=".json,application/json"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const MAX_SIZE = 1 * 1024 * 1024; // 1 MB
                              if (file.size > MAX_SIZE) {
                                setValidationErrors([
                                  "Service account JSON file must be under 1 MB.",
                                ]);
                                e.target.value = "";
                                return;
                              }
                              const reader = new FileReader();
                              reader.onload = (ev) =>
                                setBigqueryServiceAccountJson(
                                  ev.target?.result as string,
                                );
                              reader.readAsText(file);
                            }
                            e.target.value = "";
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  <style>{`
                    .bigquery-input-wrapper textarea::placeholder {
                      font-size: 13px;
                      color: #9ca3af;
                    }
                  `}</style>
                </>
              )}

              {integrationId === "databricks" && (
                <>
                  {/* Workspace URL */}
                  <div className="databricks-input-wrapper">
                    <Input
                      type="text"
                      label="Workspace URL"
                      value={databricksWorkspaceUrl}
                      onChange={(e) =>
                        setDatabricksWorkspaceUrl(
                          e.target.value.replace(/^https?:\/\//i, ""),
                        )
                      }
                      placeholder={
                        hasExistingCredentials
                          ? "••••••••"
                          : "e.g. dbc-a1b2c3d4-e5f6.cloud.databricks.com"
                      }
                      helperText={
                        hasExistingCredentials
                          ? "Leave empty to keep existing value"
                          : "Hostname only — no https:// prefix"
                      }
                      required={!hasExistingCredentials}
                      fullWidth
                    />
                  </div>

                  {/* Client ID */}
                  <div className="databricks-input-wrapper">
                    <Input
                      type="text"
                      label="Client ID"
                      value={databricksClientId}
                      onChange={(e) => setDatabricksClientId(e.target.value)}
                      placeholder={
                        hasExistingCredentials
                          ? "••••••••"
                          : "e.g. 697842dc-73a9-4268-8097-dc08391a6000"
                      }
                      helperText={
                        hasExistingCredentials
                          ? "Leave empty to keep existing value"
                          : "Service principal Client ID from Databricks Account Console"
                      }
                      required={!hasExistingCredentials}
                      fullWidth
                    />
                  </div>

                  {/* Client Secret */}
                  <div className="databricks-input-wrapper">
                    <Input
                      type="password"
                      label="Client Secret"
                      value={databricksClientSecret}
                      onChange={(e) =>
                        setDatabricksClientSecret(e.target.value)
                      }
                      placeholder={
                        hasExistingCredentials
                          ? "••••••••"
                          : "Paste your service principal secret"
                      }
                      helperText={
                        hasExistingCredentials
                          ? "Leave empty to keep existing value"
                          : "OAuth secret generated for the service principal"
                      }
                      required={!hasExistingCredentials}
                      fullWidth
                    />
                  </div>

                  {/* Warehouse ID (optional) */}
                  <div className="databricks-input-wrapper">
                    <Input
                      type="text"
                      label="Warehouse ID"
                      value={databricksWarehouseId}
                      onChange={(e) => setDatabricksWarehouseId(e.target.value)}
                      placeholder={
                        hasExistingCredentials
                          ? "••••••••"
                          : "e.g. 019baf45ad4c311e"
                      }
                      helperText={
                        hasExistingCredentials
                          ? "Leave empty to keep existing value"
                          : "SQL Warehouses → Connection details → last segment of HTTP Path (optional)"
                      }
                      fullWidth
                    />
                  </div>

                  <style>{`
                      .databricks-input-wrapper input::placeholder {
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

          {/* Help & Security Notice - shown for credential-based integrations */}
          {(integrationId === "gong" ||
            integrationId === "fathom" ||
            integrationId === "jiminny" ||
            integrationId === "gainsight" ||
            integrationId === "zendesk" ||
            integrationId === "snowflake" ||
            integrationId === "databricks" ||
            integrationId === "bigquery" ||
            integrationId === "salesloft_engagement") && (
            <div className="px-6 py-3 mb-6 border-b border-gray-200 shrink-0">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <a
                  href={
                    integrationId === "gong"
                      ? "https://help.gong.io/docs/receive-access-to-the-api"
                      : integrationId === "jiminny"
                        ? "https://help.jiminny.com/en/articles/9527212-what-is-the-jiminny-api"
                        : integrationId === "gainsight"
                          ? "https://support.gainsight.com/gainsight_nxt/Connectors/API_Integrations/Generate_REST_API_Access_Key"
                          : integrationId === "zendesk"
                            ? "https://support.zendesk.com/hc/en-us/articles/4408889192858-Managing-API-token-access-to-the-Zendesk-API"
                            : integrationId === "snowflake"
                              ? "https://docs.snowflake.com/en/user-guide/key-pair-auth"
                              : integrationId === "databricks"
                                ? "https://docs.databricks.com/en/dev-tools/auth/oauth-m2m.html"
                                : integrationId === "bigquery"
                                  ? "https://cloud.google.com/iam/docs/keys-create-delete"
                                  : integrationId === "salesloft_engagement"
                                    ? "https://developers.salesloft.com/docs/platform/api-basics/api-key-authentication"
                                    : "https://developers.fathom.ai/quickstart"
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-gray-700 underline"
                  onClick={() =>
                    report.integrationsAPICredentialsLinkClicked(
                      integration?.name ?? integrationId,
                      INTEGRATION_METADATA[integrationId]?.category ?? "",
                      connectionType,
                    )
                  }
                >
                  {integrationId === "gong"
                    ? "How to generate API credentials"
                    : integrationId === "jiminny"
                      ? "How to generate API credentials"
                      : integrationId === "gainsight"
                        ? "How to generate an API access key"
                        : integrationId === "zendesk"
                          ? "Generating a new API token"
                          : integrationId === "snowflake"
                            ? "How to generate a key pair"
                            : integrationId === "databricks"
                              ? "How to set up OAuth M2M"
                              : integrationId === "bigquery"
                                ? "How to create a service account key"
                                : integrationId === "salesloft_engagement"
                                  ? "How to generate an API key"
                                  : "How to generate an API key"}
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
            className={`px-6 py-4 border-t border-gray-200 shrink-0 ${integrationId === "gong" || integrationId === "fathom" || integrationId === "jiminny" || integrationId === "gainsight" || integrationId === "zendesk" || integrationId === "snowflake" || integrationId === "databricks" || integrationId === "bigquery" || integrationId === "salesloft_engagement" ? "border-t-0 pt-0" : ""}`}
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
