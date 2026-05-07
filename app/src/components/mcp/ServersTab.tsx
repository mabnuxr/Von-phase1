import { useState, useMemo } from "react";
import { Plus, Plugs, CaretDown, Lightning } from "@phosphor-icons/react";
import { Text, Banner } from "@vonlabs/design-components";
import { useMCPServers } from "../../hooks/useMCPServers";
import { useFeatureFlag } from "../../hooks/useFeatureFlag";
import type { MCPServer, MCPAvailabilityStatus } from "../../types/mcp";
import { CreateCustomMCPModal } from "./CreateCustomMCPModal";
import { ServerDetailPane } from "./ServerDetailPane";

const STATUS_BADGE: Record<
  MCPAvailabilityStatus,
  { bg: string; text: string; label: string }
> = {
  draft: { bg: "bg-gray-100", text: "text-gray-600", label: "Draft" },
  published: { bg: "bg-green-100", text: "text-green-700", label: "Published" },
  archived: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Archived" },
};

export function ServersTab() {
  const { data: servers, isLoading, error } = useMCPServers();
  const { isCustomMcpEnabled } = useFeatureFlag();
  const [showCreate, setShowCreate] = useState(false);
  const [detailServerId, setDetailServerId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const { active, archived, promotionRequests } = useMemo(() => {
    if (!servers) return { active: [], archived: [], promotionRequests: [] };
    return {
      active: servers.filter((s) => s.availability_status !== "archived"),
      archived: servers.filter((s) => s.availability_status === "archived"),
      promotionRequests: servers.filter((s) => s.promotion_requested),
    };
  }, [servers]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-48">
        <Text variant="body" color="secondary">
          Loading servers...
        </Text>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-600 text-sm">
        Failed to load servers. Please try again.
      </div>
    );
  }

  return (
    <>
      {/* Promotion banner */}
      {promotionRequests.length > 0 && (
        <div className="mb-4">
          <Banner
            variant="info"
            message={`${promotionRequests.length} MCP server${promotionRequests.length > 1 ? "s" : ""} requesting workspace access.`}
          />
        </div>
      )}

      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          {active.length} server{active.length !== 1 ? "s" : ""}
        </p>
        {isCustomMcpEnabled && (
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <Plus size={14} weight="bold" />
            Add custom MCP
          </button>
        )}
      </div>

      {active.length === 0 && archived.length === 0 ? (
        <div className="text-center py-16">
          <Plugs size={36} className="mx-auto mb-3 text-gray-300" />
          <p className="text-sm text-gray-500 mb-1">No MCP servers yet</p>
          <p className="text-xs text-gray-400">
            Connect one from the Catalog or add a custom server.
          </p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Tools
                  </th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Auth
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {active.map((server) => (
                  <ServerRow
                    key={server.id}
                    server={server}
                    onClick={() => setDetailServerId(server.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Archived disclosure */}
          {archived.length > 0 && (
            <div className="mt-4">
              <button
                onClick={() => setShowArchived(!showArchived)}
                className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                <CaretDown
                  size={12}
                  weight="bold"
                  className={`transition-transform ${showArchived ? "" : "-rotate-90"}`}
                />
                Archived ({archived.length})
              </button>
              {showArchived && (
                <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden bg-white">
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-gray-100">
                      {archived.map((server) => (
                        <ServerRow
                          key={server.id}
                          server={server}
                          onClick={() => setDetailServerId(server.id)}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {showCreate && (
        <CreateCustomMCPModal
          onClose={() => setShowCreate(false)}
          onCreated={(serverId) => {
            setShowCreate(false);
            setDetailServerId(serverId);
          }}
        />
      )}

      {detailServerId && (
        <ServerDetailPane
          serverId={detailServerId}
          onClose={() => setDetailServerId(null)}
        />
      )}
    </>
  );
}

function ServerRow({
  server,
  onClick,
}: {
  server: MCPServer;
  onClick: () => void;
}) {
  const badge = STATUS_BADGE[server.availability_status];
  const authLabel =
    server.auth_type === "api_key"
      ? "API Key"
      : server.auth_type === "oauth2"
        ? "OAuth"
        : "None";
  const toolCount = server.tool_manifest?.length ?? 0;

  return (
    <tr
      onClick={onClick}
      className="hover:bg-gray-50 cursor-pointer transition-colors"
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">{server.name}</span>
          {server.access_level === "user" && (
            <span className="px-1.5 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-500 rounded">
              Personal
            </span>
          )}
          {server.promotion_requested && (
            <Lightning size={14} className="text-amber-500" weight="fill" />
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-gray-500 capitalize">{server.source}</td>
      <td className="px-4 py-3">
        <span
          className={`px-2 py-0.5 text-[11px] font-medium rounded ${badge.bg} ${badge.text}`}
        >
          {badge.label}
        </span>
      </td>
      <td className="px-4 py-3 text-gray-500">{toolCount}</td>
      <td className="px-4 py-3 text-right text-gray-500">{authLabel}</td>
    </tr>
  );
}
