import { useState } from "react";
import {
  Plus,
  TrashSimple,
  Plugs,
  ArrowsClockwise,
} from "@phosphor-icons/react";
import { IntegrationType, AuthenticationStatus } from "../services";
import type { Integration } from "./IntegrationsPanel";
import { AddCustomMCPPane } from "./AddCustomMCPPane";
import { CustomMCPDetailPane } from "./CustomMCPDetailPane";
import { useRefreshMCPTools } from "../hooks/useIntegrations";

interface MCPBackendData {
  id: string;
  type: string;
  authenticationStatus: string;
  config: Record<string, unknown>;
  accessLevel: string;
  readonly: boolean;
  name: string;
}

interface CustomMCPSectionProps {
  integrations: Integration[];
  integrationsData: { integrations: MCPBackendData[] } | undefined;
  onDelete: (
    id: string,
    connectionType: "workspace" | "personal" | "both",
  ) => void;
  showAddPane: boolean;
  onShowAddPane: (show: boolean) => void;
}

export function CustomMCPSection({
  integrations,
  integrationsData,
  onDelete,
  showAddPane,
  onShowAddPane,
}: CustomMCPSectionProps) {
  const [detailId, setDetailId] = useState<string | null>(null);

  const mcpIntegrations = integrations.filter(
    (i) => i.type === IntegrationType.MCP_SERVER,
  );

  const connectedCount = mcpIntegrations.filter(
    (i) => i.authenticationStatus === AuthenticationStatus.AUTHENTICATED,
  ).length;

  const detailBackend = detailId
    ? integrationsData?.integrations.find((i) => i.id === detailId)
    : undefined;
  const detailIntegration = detailId
    ? mcpIntegrations.find((i) => i.id === detailId)
    : undefined;

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 overflow-visible">
        {/* Section Header */}
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Custom MCP Apps
            </h3>
          </div>
          <button
            onClick={() => onShowAddPane(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-white transition-colors cursor-pointer"
          >
            <Plus size={12} weight="bold" />
            Add
          </button>
        </div>

        {/* Content */}
        {mcpIntegrations.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Plugs size={32} className="mx-auto mb-2 text-gray-300" />
            <p className="text-sm text-gray-500">
              No custom MCP apps added yet
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Connect your own MCP servers to extend Von with custom tools
            </p>
          </div>
        ) : (
          <>
            {/* Connected count sub-header */}
            <div className="px-4 py-2 border-b border-gray-100">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                Connected
              </span>
              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-500 rounded">
                {connectedCount}
              </span>
            </div>

            <div className="divide-y divide-gray-200">
              {mcpIntegrations.map((mcp) => {
                const backend = integrationsData?.integrations.find(
                  (i) => i.id === mcp.id,
                );
                return (
                  <CustomMCPItem
                    key={mcp.id}
                    integration={mcp}
                    backendData={backend}
                    onDelete={() => onDelete(mcp.id, "workspace")}
                    onClick={() => setDetailId(mcp.id)}
                  />
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Add Custom MCP Pane */}
      {showAddPane && <AddCustomMCPPane onClose={() => onShowAddPane(false)} />}

      {/* Detail Pane */}
      {detailId && detailBackend && detailIntegration && (
        <CustomMCPDetailPane
          integration={detailIntegration}
          backendData={detailBackend}
          onClose={() => setDetailId(null)}
          onDisconnect={() => {
            onDelete(detailId, "workspace");
            setDetailId(null);
          }}
        />
      )}
    </>
  );
}

function CustomMCPItem({
  integration,
  backendData,
  onDelete,
  onClick,
}: {
  integration: Integration;
  backendData?: MCPBackendData;
  onDelete: () => void;
  onClick: () => void;
}) {
  const refreshMutation = useRefreshMCPTools();

  const isAuthenticated =
    integration.authenticationStatus === AuthenticationStatus.AUTHENTICATED;
  const isAuthenticating =
    integration.authenticationStatus === AuthenticationStatus.AUTHENTICATING;

  const toolManifest = backendData?.config?.tool_manifest as
    | { name: string }[]
    | undefined;
  const toolCount = toolManifest?.length ?? 0;
  const authType = (backendData?.config?.auth_type as string) || "api_key";
  const authLabel =
    authType === "oauth"
      ? "OAuth"
      : authType === "bearer_token"
        ? "Bearer Token"
        : "API Key";
  const iconUrl = backendData?.config?.icon_url as string | undefined;
  const displayName = backendData?.name || integration.name || "Custom MCP";

  return (
    <div
      className="flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors cursor-pointer"
      onClick={onClick}
    >
      {/* Left: Icon + Info */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
          {iconUrl ? (
            <img
              src={iconUrl}
              alt=""
              className="w-10 h-10 object-cover rounded-lg"
            />
          ) : (
            <Plugs size={20} className="text-gray-400" />
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900 truncate">
              {displayName}
            </span>
            <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-orange-100 text-orange-700 rounded shrink-0">
              Custom
            </span>
            <span className="px-1.5 py-0.5 text-[10px] font-medium bg-purple-100 text-purple-700 rounded shrink-0">
              Workspace
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5 truncate">
            {isAuthenticated && toolCount > 0 ? (
              <span className="text-green-600">
                {toolCount} of {toolCount} tools active
              </span>
            ) : isAuthenticating ? (
              "Authenticating..."
            ) : (
              "Not connected"
            )}
            {" · "}
            {authLabel}
          </p>
        </div>
      </div>

      {/* Right: Actions */}
      <div
        className="flex items-center gap-2 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        {isAuthenticated && (
          <>
            <button
              onClick={() => refreshMutation.mutate(integration.id)}
              disabled={refreshMutation.isPending}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh tools"
            >
              <ArrowsClockwise
                size={15}
                className={refreshMutation.isPending ? "animate-spin" : ""}
              />
            </button>
            <span className="px-2.5 py-1 text-[11px] font-medium bg-green-100 text-green-700 rounded-full">
              Connected
            </span>
          </>
        )}
        {!isAuthenticated && !isAuthenticating && (
          <span className="px-2.5 py-1 text-[11px] font-medium text-gray-700 border border-gray-200 rounded-full">
            Connect
          </span>
        )}
        <button
          onClick={onDelete}
          className="p-1.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
          title="Remove app"
        >
          <TrashSimple size={15} />
        </button>
      </div>
    </div>
  );
}
