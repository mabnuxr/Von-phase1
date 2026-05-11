import { useState, useEffect, useCallback } from "react";
import { Input, Banner } from "@vonlabs/design-components";
import {
  Plugs,
  Check,
  CaretRight,
  CaretDown,
  WarningCircle,
} from "@phosphor-icons/react";
import {
  useCreateCustomMCP,
  useAuthorizeIntegration,
  useCheckAuthStatus,
  useDiscoverMCPTools,
} from "../hooks/useIntegrations";

type AuthMethod = "oauth" | "bearer_token" | "api_key";
type Step = "configure" | "connecting" | "review";

interface DiscoveredTool {
  name: string;
  description?: string;
  is_write?: boolean;
}

interface AddCustomMCPPaneProps {
  onClose: () => void;
}

/* ─── Stepper ─── */
function Stepper({ currentStep }: { currentStep: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: "configure", label: "Configure" },
    { key: "connecting", label: "Connect" },
    { key: "review", label: "Review tools" },
  ];
  const order: Step[] = ["configure", "connecting", "review"];
  const currentIdx = order.indexOf(currentStep);

  return (
    <div className="flex items-center gap-2 px-6 py-3">
      {steps.map((step, i) => {
        const isCompleted = i < currentIdx;
        const isActive = i === currentIdx;
        return (
          <div key={step.key} className="flex items-center gap-2">
            {i > 0 && (
              <div
                className={`w-8 h-px ${isCompleted || isActive ? "bg-green-400" : "bg-gray-200"}`}
              />
            )}
            <div className="flex items-center gap-1.5">
              {isCompleted ? (
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                  <Check size={12} weight="bold" className="text-white" />
                </div>
              ) : (
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-semibold ${
                    isActive
                      ? "border-gray-900 text-gray-900"
                      : "border-gray-300 text-gray-400"
                  }`}
                >
                  {i + 1}
                </div>
              )}
              <span
                className={`text-sm ${isActive ? "font-medium text-gray-900" : isCompleted ? "text-gray-500" : "text-gray-400"}`}
              >
                {step.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Auth Selector (segmented control) ─── */
function AuthSelector({
  value,
  onChange,
  disabled,
}: {
  value: AuthMethod;
  onChange: (v: AuthMethod) => void;
  disabled?: boolean;
}) {
  const options: { key: AuthMethod; label: string }[] = [
    { key: "oauth", label: "OAuth" },
    { key: "bearer_token", label: "Bearer Token" },
    { key: "api_key", label: "API Key" },
  ];
  return (
    <div className="flex rounded-lg border border-gray-200 overflow-hidden">
      {options.map((opt) => (
        <button
          key={opt.key}
          type="button"
          disabled={disabled}
          onClick={() => onChange(opt.key)}
          className={`flex-1 px-3 py-2 text-sm font-medium transition-colors cursor-pointer disabled:cursor-not-allowed ${
            value === opt.key
              ? "bg-gray-900 text-white"
              : "bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/* ─── Main Component ─── */
export function AddCustomMCPPane({ onClose }: AddCustomMCPPaneProps) {
  const createMutation = useCreateCustomMCP();
  const authorizeMutation = useAuthorizeIntegration();
  const discoverMutation = useDiscoverMCPTools();

  // Wizard step
  const [step, setStep] = useState<Step>("configure");

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [serverUrl, setServerUrl] = useState("");
  const [authMethod, setAuthMethod] = useState<AuthMethod>("oauth");
  const [credential, setCredential] = useState("");
  const [trustAcknowledged, setTrustAcknowledged] = useState(false);
  const [iconPreview, setIconPreview] = useState<string | null>(null);

  // Flow state
  const [createdIntegrationId, setCreatedIntegrationId] = useState<
    string | null
  >(null);
  const [discoveredTools, setDiscoveredTools] = useState<DiscoveredTool[]>([]);
  const [toolsExpanded, setToolsExpanded] = useState(false);
  const [discoverTriggered, setDiscoverTriggered] = useState(false);

  // Validation
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Animation state
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => onClose(), 300);
  }, [onClose]);

  // Poll OAuth status — same pattern as Salesforce/Gmail
  const isPollingOAuth =
    step === "connecting" && authMethod === "oauth" && !!createdIntegrationId;
  const authStatusQuery = useCheckAuthStatus(
    createdIntegrationId,
    isPollingOAuth,
  );

  // React to OAuth status changes
  useEffect(() => {
    if (!isPollingOAuth || !createdIntegrationId || discoverTriggered) return;
    const status = authStatusQuery.data?.status;

    if (status === "AUTHENTICATED") {
      setDiscoverTriggered(true);
      discoverMutation.mutate(createdIntegrationId, {
        onSuccess: (data) => {
          setDiscoveredTools(data.tools as DiscoveredTool[]);
          setStep("review");
        },
        onError: (err) => {
          const msg =
            err && typeof err === "object" && "message" in err
              ? (err as { message: string }).message
              : "Failed to discover tools";
          setValidationErrors([msg]);
          setStep("review");
        },
      });
    } else if (status === "AUTHENTICATION_FAILED") {
      setStep("configure");
      setValidationErrors(["OAuth authorization failed. Please try again."]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    authStatusQuery.data?.status,
    isPollingOAuth,
    createdIntegrationId,
    discoverTriggered,
  ]);

  /* ─── Step 1: Connect button handler ─── */
  const handleConnect = async () => {
    const errors: string[] = [];

    if (!name.trim()) errors.push("Name is required");

    if (!serverUrl.trim()) {
      errors.push("MCP Server URL is required");
    } else {
      try {
        const url = new URL(serverUrl.trim());
        if (url.protocol !== "https:" && url.protocol !== "http:")
          errors.push("URL must start with https:// or http://");
      } catch {
        errors.push("Please enter a valid URL");
      }
    }

    if (authMethod !== "oauth" && !credential.trim()) {
      errors.push(
        `${authMethod === "bearer_token" ? "Bearer Token" : "API Key"} is required`,
      );
    }

    if (!trustAcknowledged) {
      errors.push("You must acknowledge the trust notice to continue");
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    setValidationErrors([]);

    try {
      // 1. Create the integration (or reuse if already created from a failed retry)
      let integrationId = createdIntegrationId;

      if (!integrationId) {
        const integration = await createMutation.mutateAsync({
          name: name.trim(),
          serverUrl: serverUrl.trim(),
          description: description.trim() || undefined,
          authType: authMethod,
          apiKey: authMethod !== "oauth" ? credential.trim() : undefined,
          iconUrl: iconPreview || undefined,
        });
        integrationId = integration.id;
        setCreatedIntegrationId(integrationId);
      }

      if (authMethod !== "oauth") {
        // API key / Bearer Token — already authenticated, discover tools
        setStep("connecting");
        discoverMutation.mutate(integrationId, {
          onSuccess: (data) => {
            setDiscoveredTools(data.tools as DiscoveredTool[]);
            setStep("review");
          },
          onError: (err) => {
            // Show error but still advance — user can retry via Refresh
            const msg =
              err && typeof err === "object" && "message" in err
                ? (err as { message: string }).message
                : "Failed to discover tools";
            setValidationErrors([msg]);
            setStep("review");
          },
        });
      } else {
        // OAuth — authorize (hook opens popup), then poll for status
        setStep("connecting");
        try {
          await authorizeMutation.mutateAsync(integrationId);
          // Popup is already open — useCheckAuthStatus polling will detect
          // when status changes to AUTHENTICATED and trigger discover
        } catch (authErr: unknown) {
          setStep("configure");
          const msg =
            authErr && typeof authErr === "object" && "message" in authErr
              ? (authErr as { message: string }).message
              : "Failed to start authorization";
          setValidationErrors([msg]);
        }
      }
    } catch (error: unknown) {
      setStep("configure");
      const message =
        error && typeof error === "object" && "message" in error
          ? (error as { message: string }).message
          : "Failed to add connector. Please try again.";
      setValidationErrors([message]);
    }
  };

  const isBusy =
    createMutation.isPending ||
    authorizeMutation.isPending ||
    discoverMutation.isPending;

  const writeTools = discoveredTools.filter((t) => t.is_write);
  const totalTools = discoveredTools.length;

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024) {
      setValidationErrors(["Icon must be under 10 KB"]);
      e.target.value = "";
      return;
    }
    if (!file.type.startsWith("image/png")) {
      setValidationErrors(["Icon must be a PNG file"]);
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setIconPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/20 transition-opacity duration-300 z-40 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={!isBusy && step === "configure" ? handleClose : undefined}
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
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                  {iconPreview ? (
                    <img
                      src={iconPreview}
                      alt=""
                      className="w-8 h-8 rounded-lg object-cover"
                    />
                  ) : (
                    <Plugs size={16} className="text-gray-500" />
                  )}
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900 m-0">
                    Add Custom App
                  </h2>
                  <p className="text-xs text-gray-500 m-0">
                    MCP &middot; Workspace integration
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={isBusy && step === "connecting"}
                className="text-gray-500 hover:text-gray-700 transition-colors cursor-pointer disabled:opacity-50"
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

          {/* Stepper */}
          <Stepper currentStep={step} />

          {/* ─── Step 1: Configure ─── */}
          {step === "configure" && (
            <>
              <div className="flex-1 overflow-y-auto settings-scrollbar px-6 py-4">
                <div className="space-y-5">
                  {/* Icon upload */}
                  <div className="flex items-center gap-4">
                    <label className="cursor-pointer shrink-0">
                      <div className="w-14 h-14 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-gray-400 transition-colors">
                        {iconPreview ? (
                          <img
                            src={iconPreview}
                            alt=""
                            className="w-14 h-14 rounded-full object-cover"
                          />
                        ) : (
                          <svg
                            className="size-5 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 4v16m8-8H4"
                            />
                          </svg>
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/png"
                        className="hidden"
                        onChange={handleIconUpload}
                      />
                    </label>
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Icon{" "}
                        <span className="text-gray-400 font-normal">
                          (optional)
                        </span>
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        PNG only. Minimum size: 128&times;128 px.
                        <br />
                        Max file size: 10 KB.
                      </p>
                    </div>
                  </div>

                  {/* Name */}
                  <div className="mcp-input-wrapper">
                    <Input
                      type="text"
                      label="Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Acme Internal Tools"
                      required
                      fullWidth
                      disabled={isBusy}
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Description{" "}
                      <span className="text-gray-400 font-normal">
                        (optional)
                      </span>
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Explain what it does in a few words"
                      rows={3}
                      disabled={isBusy}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-vertical placeholder:text-[13px] placeholder:text-gray-400 disabled:opacity-50"
                    />
                  </div>

                  {/* MCP Server URL */}
                  <div className="mcp-input-wrapper">
                    <Input
                      type="url"
                      label="MCP Server URL"
                      value={serverUrl}
                      onChange={(e) => setServerUrl(e.target.value)}
                      placeholder="https://example.com/sse"
                      required
                      fullWidth
                      disabled={isBusy}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Must expose{" "}
                      <code className="px-1 py-0.5 bg-gray-100 rounded text-[11px]">
                        tools/list
                      </code>{" "}
                      and{" "}
                      <code className="px-1 py-0.5 bg-gray-100 rounded text-[11px]">
                        tools/call
                      </code>{" "}
                      over HTTPS.
                    </p>
                  </div>

                  {/* Authentication */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Authentication
                    </label>
                    <AuthSelector
                      value={authMethod}
                      onChange={setAuthMethod}
                      disabled={isBusy}
                    />
                  </div>

                  {/* Credential field for non-OAuth */}
                  {authMethod !== "oauth" && (
                    <div className="mcp-input-wrapper">
                      <Input
                        type="password"
                        label={
                          authMethod === "bearer_token"
                            ? "Bearer Token"
                            : "API Key"
                        }
                        value={credential}
                        onChange={(e) => setCredential(e.target.value)}
                        placeholder={
                          authMethod === "bearer_token"
                            ? "Enter your bearer token"
                            : "Enter your API key"
                        }
                        required
                        fullWidth
                        disabled={isBusy}
                      />
                    </div>
                  )}

                  {/* Trust acknowledgment */}
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={trustAcknowledged}
                        onChange={(e) => setTrustAcknowledged(e.target.checked)}
                        disabled={isBusy}
                        className="mt-0.5 w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500 accent-amber-600 shrink-0"
                      />
                      <span className="text-sm text-amber-800 leading-relaxed">
                        <strong>I understand and want to continue.</strong> This
                        MCP server has not been reviewed by Von. I am connecting
                        a server from a developer I trust. Each team member will
                        individually approve their own write operations before
                        they execute.
                      </span>
                    </label>
                  </div>
                </div>

                {/* Validation Errors */}
                {validationErrors.length > 0 && (
                  <div className="mt-4">
                    <Banner
                      variant="error"
                      message={
                        validationErrors.length === 1
                          ? validationErrors[0]
                          : validationErrors.map((e) => `• ${e}`).join("\n")
                      }
                      onClose={() => setValidationErrors([])}
                      dismissible={true}
                    />
                  </div>
                )}
              </div>

              {/* Footer — Step 1 */}
              <div className="px-6 py-3 border-t border-gray-200 shrink-0">
                <div className="flex items-center justify-between">
                  <a
                    href="https://docs.vonlabs.ai/reference/custom-mcp"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gray-500 hover:text-gray-700 underline"
                  >
                    How to build an MCP server
                  </a>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleClose}
                      disabled={isBusy}
                      className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConnect}
                      disabled={isBusy}
                      className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {createMutation.isPending ? "Creating..." : "Connect"}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ─── Step 2: Connecting ─── */}
          {step === "connecting" && (
            <div className="flex-1 flex flex-col items-center justify-center px-6">
              <svg
                className="size-10 text-purple-600 animate-spin mb-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <p className="text-sm font-medium text-gray-900">
                {authMethod === "oauth"
                  ? "Waiting for authorization..."
                  : "Discovering tools..."}
              </p>
              {authMethod === "oauth" && (
                <p className="text-xs text-gray-500 mt-1">
                  Complete sign-in in the popup window
                </p>
              )}
            </div>
          )}

          {/* ─── Step 3: Review Tools ─── */}
          {step === "review" && (
            <>
              <div className="flex-1 overflow-y-auto settings-scrollbar px-6 py-6">
                {/* Success header */}
                <div className="flex flex-col items-center mb-6">
                  <div className="w-12 h-12 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center mb-3">
                    <Check size={24} weight="bold" className="text-green-600" />
                  </div>
                  <p className="text-base font-semibold text-gray-900">
                    {totalTools} tool{totalTools !== 1 ? "s" : ""} discovered
                  </p>
                  {writeTools.length > 0 && (
                    <p className="text-sm text-gray-500 mt-0.5 text-center">
                      {writeTools.length} write tool
                      {writeTools.length !== 1 ? "s" : ""} — each team member
                      approves their own write actions
                    </p>
                  )}
                </div>

                {/* Discovered tools collapsible */}
                {totalTools > 0 && (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setToolsExpanded(!toolsExpanded)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        {toolsExpanded ? (
                          <CaretDown
                            size={14}
                            weight="bold"
                            className="text-gray-500"
                          />
                        ) : (
                          <CaretRight
                            size={14}
                            weight="bold"
                            className="text-gray-500"
                          />
                        )}
                        <span className="text-sm font-medium text-gray-900">
                          Discovered tools
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {totalTools} total
                        {writeTools.length > 0 && (
                          <>
                            {" "}
                            &middot;{" "}
                            <span className="text-amber-600">
                              {writeTools.length} write
                            </span>
                          </>
                        )}
                      </span>
                    </button>

                    {toolsExpanded && (
                      <div className="border-t border-gray-200 divide-y divide-gray-100">
                        {discoveredTools.map((tool) => (
                          <div key={tool.name} className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-mono font-medium text-gray-900">
                                {tool.name}
                              </span>
                              {tool.is_write && (
                                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-700 rounded">
                                  Write
                                </span>
                              )}
                            </div>
                            {tool.description && (
                              <p className="text-xs text-gray-500 mt-0.5">
                                {tool.description}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Write tools notice */}
                {writeTools.length > 0 && (
                  <div className="mt-4 flex items-start gap-2 px-3 py-2.5 bg-gray-50 rounded-lg">
                    <WarningCircle
                      size={16}
                      className="text-gray-400 shrink-0 mt-0.5"
                    />
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Write operations are sent to the team member who triggered
                      them for individual approval before executing.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer — Step 3 */}
              <div className="px-6 py-3 border-t border-gray-200 shrink-0">
                <div className="flex justify-end">
                  <button
                    onClick={handleClose}
                    className="px-5 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              </div>
            </>
          )}

          <style>{`
            .mcp-input-wrapper input::placeholder {
              font-size: 13px;
              color: #9ca3af;
            }
          `}</style>
        </div>
      </div>
    </>
  );
}
