import { useState, useEffect, useCallback } from "react";
import { Input, Banner, RadioButton } from "@vonlabs/design-components";
import { Plugs } from "@phosphor-icons/react";
import {
  useCreateMCPServer,
  useDeleteMCPServer,
  useDiscoverTools,
  useMCPAuthorize,
  useMCPCheckAuthStatus,
} from "../../hooks/useMCPServers";
import type { MCPAuthType } from "../../types/mcp";

interface CreateCustomMCPModalProps {
  onClose: () => void;
  onCreated: (serverId: string) => void;
}

export function CreateCustomMCPModal({
  onClose,
  onCreated,
}: CreateCustomMCPModalProps) {
  const createMutation = useCreateMCPServer();
  const deleteMutation = useDeleteMCPServer();
  const discoverMutation = useDiscoverTools();
  const authorizeMutation = useMCPAuthorize();

  const [name, setName] = useState("");
  const [serverUrl, setServerUrl] = useState("");
  const [authType, setAuthType] = useState<MCPAuthType>("api_key");
  const [apiKey, setApiKey] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  // OAuth flow state
  const [createdServerId, setCreatedServerId] = useState<string | null>(null);
  const [waitingForOAuth, setWaitingForOAuth] = useState(false);
  const [discoverTriggered, setDiscoverTriggered] = useState(false);
  const [oauthPopup, setOauthPopup] = useState<Window | null>(null);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    oauthPopup?.close();
    setTimeout(() => onClose(), 300);
  }, [onClose, oauthPopup]);

  // Polling fallback for OAuth
  const authStatusQuery = useMCPCheckAuthStatus(
    createdServerId,
    waitingForOAuth,
  );

  const finishOAuth = useCallback(
    (serverId: string) => {
      if (discoverTriggered) return;
      setDiscoverTriggered(true);
      setWaitingForOAuth(false);
      oauthPopup?.close();
      discoverMutation.mutate(serverId, {
        onSettled: () => onCreated(serverId),
      });
    },
    [discoverTriggered, oauthPopup, discoverMutation, onCreated],
  );

  // Listen for postMessage from OAuth callback page
  useEffect(() => {
    if (!waitingForOAuth || !createdServerId) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== "mcp_oauth_callback") return;
      if (event.data.success) {
        finishOAuth(createdServerId);
      } else {
        setWaitingForOAuth(false);
        oauthPopup?.close();
        deleteMutation.mutate(createdServerId);
        setCreatedServerId(null);
        setErrors([
          event.data.error || "OAuth authorization failed. Please try again.",
        ]);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [
    waitingForOAuth,
    createdServerId,
    finishOAuth,
    oauthPopup,
    deleteMutation,
  ]);

  // Polling fallback: detect AUTHENTICATED if postMessage was missed
  useEffect(() => {
    if (!waitingForOAuth || !createdServerId || discoverTriggered) return;
    const status = authStatusQuery.data?.authentication_status;

    if (status === "AUTHENTICATED") {
      finishOAuth(createdServerId);
    } else if (status === "AUTHENTICATION_FAILED") {
      setWaitingForOAuth(false);
      oauthPopup?.close();
      if (createdServerId) deleteMutation.mutate(createdServerId);
      setCreatedServerId(null);
      setErrors(["OAuth authorization failed. Please try again."]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    authStatusQuery.data?.authentication_status,
    waitingForOAuth,
    createdServerId,
    discoverTriggered,
  ]);

  const isBusy =
    createMutation.isPending ||
    discoverMutation.isPending ||
    authorizeMutation.isPending ||
    waitingForOAuth;

  const handleCreate = async () => {
    const errs: string[] = [];
    if (!name.trim()) errs.push("Name is required");
    if (!serverUrl.trim()) {
      errs.push("Server URL is required");
    } else if (!/^https:\/\//i.test(serverUrl.trim())) {
      errs.push("Server URL must start with https://");
    }
    if (authType === "api_key" && !apiKey.trim())
      errs.push("API Key is required");

    if (errs.length) {
      setErrors(errs);
      return;
    }
    setErrors([]);

    try {
      const server = await createMutation.mutateAsync({
        name: name.trim(),
        server_url: serverUrl.trim(),
        auth_type: authType,
        api_key: authType === "api_key" ? apiKey.trim() : undefined,
        source: "custom",
        description: description.trim() || undefined,
      });

      setCreatedServerId(server.id);

      if (authType === "oauth2") {
        try {
          const authData = await authorizeMutation.mutateAsync(server.id);
          const popup = window.open(
            authData.authorization_url,
            "mcp_oauth",
            "popup,width=600,height=700",
          );
          if (!popup) {
            deleteMutation.mutate(server.id);
            setCreatedServerId(null);
            setErrors([
              "Popup was blocked. Please allow popups for this site and try again.",
            ]);
            return;
          }
          setOauthPopup(popup);
          setWaitingForOAuth(true);
        } catch (authErr: unknown) {
          deleteMutation.mutate(server.id);
          setCreatedServerId(null);
          const msg =
            authErr && typeof authErr === "object" && "message" in authErr
              ? (authErr as { message: string }).message
              : "Failed to start authorization";
          setErrors([msg]);
        }
      } else {
        if (authType === "api_key" || authType === "none") {
          try {
            await discoverMutation.mutateAsync(server.id);
          } catch {
            // non-fatal
          }
        }
        onCreated(server.id);
      }
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : "Failed to create server";
      setErrors([msg]);
    }
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/20 transition-opacity duration-300 z-40 ${isVisible ? "opacity-100" : "opacity-0"}`}
        onClick={!isBusy ? handleClose : undefined}
      />
      <div
        className={`fixed top-0 right-0 h-full w-120 p-2 z-50 transform transition-transform duration-300 ease-in-out ${isVisible ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="h-full flex flex-col bg-white rounded-xl border border-gray-200 shadow-xs">
          {/* Header */}
          <div className="px-5 py-3 border-b border-gray-200 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Plugs size={16} className="text-gray-500" />
                </div>
                <h2 className="text-base font-semibold text-gray-900 m-0">
                  Add Custom MCP
                </h2>
              </div>
              <button
                onClick={handleClose}
                disabled={waitingForOAuth}
                className="text-gray-500 hover:text-gray-700 cursor-pointer disabled:opacity-50"
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

          {/* OAuth waiting state */}
          {waitingForOAuth ? (
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
                Waiting for authorization…
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Complete sign-in in the popup window
              </p>
            </div>
          ) : (
            <>
              {/* Form */}
              <div className="flex-1 overflow-y-auto settings-scrollbar px-6 py-4">
                <div className="space-y-5">
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

                  <div className="mcp-input-wrapper">
                    <Input
                      type="url"
                      label="Server URL"
                      value={serverUrl}
                      onChange={(e) => setServerUrl(e.target.value)}
                      placeholder="https://example.com/sse"
                      required
                      fullWidth
                      disabled={isBusy}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Must start with{" "}
                      <code className="px-1 py-0.5 bg-gray-100 rounded text-[11px]">
                        https://
                      </code>
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Authentication
                    </label>
                    <div className="space-y-2">
                      <RadioButton
                        name="authType"
                        value="api_key"
                        checked={authType === "api_key"}
                        onChange={() => setAuthType("api_key")}
                        label="API Key"
                        disabled={isBusy}
                      />
                      <RadioButton
                        name="authType"
                        value="oauth2"
                        checked={authType === "oauth2"}
                        onChange={() => setAuthType("oauth2")}
                        label="OAuth 2.0"
                        disabled={isBusy}
                      />
                      <RadioButton
                        name="authType"
                        value="none"
                        checked={authType === "none"}
                        onChange={() => setAuthType("none")}
                        label="None"
                        disabled={isBusy}
                      />
                    </div>
                  </div>

                  {authType === "api_key" && (
                    <div className="mcp-input-wrapper">
                      <Input
                        type="password"
                        label="API Key"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Enter your API key"
                        required
                        fullWidth
                        disabled={isBusy}
                      />
                    </div>
                  )}

                  {authType === "oauth2" && (
                    <p className="text-sm text-gray-500">
                      You'll be redirected to authorize access in a popup
                      window. No credentials are stored on Von.
                    </p>
                  )}

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
                </div>

                {errors.length > 0 && (
                  <div className="mt-4">
                    <Banner
                      variant="error"
                      message={
                        errors.length === 1
                          ? errors[0]
                          : errors.map((e) => `• ${e}`).join("\n")
                      }
                      onClose={() => setErrors([])}
                      dismissible
                    />
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-3 border-t border-gray-200 shrink-0">
                <div className="flex justify-end gap-3">
                  <button
                    onClick={handleClose}
                    disabled={isBusy}
                    className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={isBusy}
                    className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {createMutation.isPending
                      ? "Creating…"
                      : discoverMutation.isPending
                        ? "Discovering…"
                        : authorizeMutation.isPending
                          ? "Authorizing…"
                          : "Create"}
                  </button>
                </div>
              </div>
            </>
          )}

          <style>{`.mcp-input-wrapper input::placeholder { font-size: 13px; color: #9ca3af; }`}</style>
        </div>
      </div>
    </>
  );
}
