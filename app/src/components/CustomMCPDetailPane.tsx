import { useState, useEffect } from "react";
import { Check, CaretRight, CaretDown, Plugs } from "@phosphor-icons/react";
import { AuthenticationStatus } from "../services";
import type { Integration } from "./IntegrationsPanel";

interface DiscoveredTool {
  name: string;
  description?: string;
  is_write?: boolean;
}

interface CustomMCPDetailPaneProps {
  integration: Integration;
  backendData: {
    id: string;
    name: string;
    config: Record<string, unknown>;
    authenticationStatus: string;
    accessLevel: string;
  };
  onClose: () => void;
  onDisconnect: () => void;
}

export function CustomMCPDetailPane({
  integration,
  backendData,
  onClose,
  onDisconnect,
}: CustomMCPDetailPaneProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [toolsExpanded, setToolsExpanded] = useState(true);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(), 300);
  };

  const isAuthenticated =
    integration.authenticationStatus === AuthenticationStatus.AUTHENTICATED;

  const toolManifest = (backendData.config?.tool_manifest ||
    []) as DiscoveredTool[];
  const totalTools = toolManifest.length;
  const writeTools = toolManifest.filter((t) => t.is_write);
  const authType = (backendData.config?.auth_type as string) || "api_key";
  const authLabel =
    authType === "oauth"
      ? "OAuth"
      : authType === "bearer_token"
        ? "Bearer Token"
        : "API Key";
  const iconUrl = backendData.config?.icon_url as string | undefined;
  const displayName = backendData.name || integration.name || "Custom MCP";

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
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                  {iconUrl ? (
                    <img
                      src={iconUrl}
                      alt=""
                      className="w-8 h-8 object-cover rounded-lg"
                    />
                  ) : (
                    <Plugs size={16} className="text-gray-500" />
                  )}
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900 m-0">
                    {displayName}
                  </h2>
                  <p className="text-xs text-gray-500 m-0">
                    MCP &middot; Workspace integration
                  </p>
                </div>
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

          {/* Content */}
          <div className="flex-1 overflow-y-auto settings-scrollbar px-6 py-4">
            {/* Status Banner */}
            {isAuthenticated ? (
              <div className="flex items-start gap-3 px-4 py-3 bg-green-50 rounded-lg mb-5">
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shrink-0 mt-0.5">
                  <Check size={14} weight="bold" className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-green-900">
                    Connected
                  </p>
                  <p className="text-xs text-green-700 mt-0.5">
                    {authLabel} &middot; {totalTools} of {totalTools} tools
                    active
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg mb-5">
                <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center shrink-0">
                  <Plugs size={14} className="text-white" />
                </div>
                <p className="text-sm font-medium text-gray-600">
                  Not connected
                </p>
              </div>
            )}

            {/* Connection Info */}
            <div className="mb-5">
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                Connection
              </h3>
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-sm text-gray-500">Auth</span>
                  <span className="text-sm font-medium text-gray-900">
                    {authLabel}
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-sm text-gray-500">Scope</span>
                  <span className="text-sm font-medium text-gray-900">
                    Workspace
                  </span>
                </div>
              </div>
            </div>

            {/* Tools */}
            {totalTools > 0 && (
              <div>
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
                        Tools
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
                      {toolManifest.map((tool) => (
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
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-gray-200 shrink-0">
            <div className="flex items-center justify-between">
              <button
                onClick={onDisconnect}
                className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors cursor-pointer"
              >
                Disconnect
              </button>
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
