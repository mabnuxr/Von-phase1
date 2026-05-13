import { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useConnectCatalog,
  useConnectCatalogStatus,
  APP_CATALOG_KEY,
} from "../../hooks/useAppCatalog";
import { appCatalogService } from "../../services/appCatalogService";
import { useToast } from "../../hooks/useToast";
import type { CatalogEntry } from "../../types/mcp";

interface MCPConnectDrawerProps {
  entry: CatalogEntry;
  onClose: () => void;
}

export function MCPConnectDrawer({ entry, onClose }: MCPConnectDrawerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  const handleClose = useCallback(() => {
    oauthPopup?.close();
    setIsVisible(false);
    setTimeout(onClose, 300);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose]);

  const qc = useQueryClient();
  const connectMutation = useConnectCatalog();
  const { showToast } = useToast();

  const connectionMode = entry.connection_mode ?? "workspace";

  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [waitingForOAuth, setWaitingForOAuth] = useState(false);
  const [oauthPopup, setOauthPopup] = useState<Window | null>(null);

  const statusQuery = useConnectCatalogStatus(
    entry.catalog_id,
    connectionMode,
    "mcp",
    waitingForOAuth,
  );

  const runDiscover = useCallback(async () => {
    try {
      const tis = await appCatalogService.getTenantIntegrations({
        catalogType: "mcp",
      });
      const ti = tis.find(
        (t) =>
          t.catalog_id === entry.catalog_id &&
          t.connection_mode === connectionMode,
      );
      if (ti) {
        await appCatalogService.discoverTools(ti.id);
        qc.invalidateQueries({ queryKey: [...APP_CATALOG_KEY] });
      }
    } catch {
      // discover is best-effort
    }
  }, [qc, entry.catalog_id, connectionMode]);

  const finishConnect = useCallback(() => {
    setWaitingForOAuth(false);
    oauthPopup?.close();
    qc.invalidateQueries({ queryKey: [...APP_CATALOG_KEY] });
    qc.invalidateQueries({ queryKey: ["integrations"] });
    runDiscover();
    showToast({ message: `${entry.name} connected`, variant: "success" });
    handleClose();
  }, [qc, oauthPopup, entry.name, showToast, handleClose, runDiscover]);

  useEffect(() => {
    if (!waitingForOAuth) return;
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== "mcp_oauth_callback") return;
      if (event.data.success) {
        finishConnect();
      } else {
        setWaitingForOAuth(false);
        oauthPopup?.close();
        setError(
          event.data.error || "OAuth authorization failed. Please try again.",
        );
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [waitingForOAuth, finishConnect, oauthPopup]);

  useEffect(() => {
    if (!waitingForOAuth) return;
    const status = statusQuery.data?.authentication_status;
    if (status === "AUTHENTICATED") {
      finishConnect();
    } else if (status === "AUTHENTICATION_FAILED") {
      setWaitingForOAuth(false);
      oauthPopup?.close();
      setError("OAuth authorization failed. Please try again.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusQuery.data?.authentication_status, waitingForOAuth]);

  const isBusy = connectMutation.isPending || waitingForOAuth;

  const handleSave = async () => {
    if (entry.auth_type === "api_key" && !apiKey.trim()) {
      setError(`${entry.credential_label || "API Key"} is required`);
      return;
    }
    setError(null);

    try {
      const result = await connectMutation.mutateAsync({
        catalogId: entry.catalog_id,
        payload: {
          catalog_type: "mcp",
          connection_mode: connectionMode,
          ...(entry.auth_type !== "oauth2" && apiKey.trim()
            ? { api_key: apiKey.trim() }
            : {}),
        },
      });

      if (result.authorization_url) {
        const popup = window.open(
          result.authorization_url,
          "mcp_oauth",
          "popup,width=600,height=700",
        );
        if (!popup) {
          setError(
            "Popup was blocked. Please allow popups for this site and try again.",
          );
          return;
        }
        setOauthPopup(popup);
        setWaitingForOAuth(true);
      } else {
        runDiscover();
        showToast({ message: `${entry.name} connected`, variant: "success" });
        handleClose();
      }
    } catch (err: unknown) {
      setError(
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : "Failed to connect",
      );
    }
  };

  const isOAuth = entry.auth_type === "oauth2";

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
                {entry.logo_url && (
                  <img
                    src={entry.logo_url}
                    alt={entry.name}
                    className="w-6 h-6 object-contain"
                  />
                )}
                <h2 className="text-lg font-semibold text-gray-900 m-0">
                  {entry.name} Configuration
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
              {/* OAuth */}
              {isOAuth && (
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Authentication type
                  </label>
                  <div className="flex items-center gap-1.5 text-sm text-blue-600">
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

              {/* API Key */}
              {!isOAuth && (
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    {entry.credential_label || "API Key"}
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="password"
                    placeholder={`Enter your ${entry.credential_label || entry.name + " API key"}`}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    autoFocus
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                  {entry.credential_hint_url && (
                    <p className="mt-1.5 text-sm text-gray-500">
                      Your {entry.credential_label || entry.name + " API key"}
                    </p>
                  )}
                </div>
              )}

              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
          </div>

          {/* Footer */}
          <div className="shrink-0">
            {/* API key hint link + encrypted */}
            {!isOAuth && (
              <div className="px-6 py-3 flex items-center justify-between text-xs text-gray-500">
                {entry.credential_hint_url ? (
                  <a
                    href={entry.credential_hint_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-gray-700 underline"
                  >
                    How to generate an API key
                  </a>
                ) : (
                  <span />
                )}
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
            )}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={handleClose}
                disabled={isBusy}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isBusy}
                className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {waitingForOAuth
                  ? "Waiting for authorization…"
                  : connectMutation.isPending
                    ? "Connecting..."
                    : "Connect"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
