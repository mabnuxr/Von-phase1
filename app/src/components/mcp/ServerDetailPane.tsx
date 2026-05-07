import { useState, useEffect } from "react";
import { Banner } from "@vonlabs/design-components";
import {
  Check,
  CaretRight,
  CaretDown,
  Plugs,
  ArrowsClockwise,
  WarningCircle,
} from "@phosphor-icons/react";
import {
  useMCPServer,
  useDiscoverTools,
  useRefreshTools,
  usePublishServer,
  useUpdateMCPServer,
  useDeleteMCPServer,
  useRequestPromotion,
  usePromoteServer,
  useDeclinePromotion,
} from "../../hooks/useMCPServers";
import { useUser } from "../../hooks/useUser";
import type { MCPToolInfo } from "../../types/mcp";

interface ServerDetailPaneProps {
  serverId: string;
  onClose: () => void;
}

export function ServerDetailPane({ serverId, onClose }: ServerDetailPaneProps) {
  const { data: server, isLoading } = useMCPServer(serverId);
  const { user } = useUser();
  const isAdmin =
    user?.roles?.some((r) => r.toLowerCase() === "admin") ?? false;
  const discoverMutation = useDiscoverTools();
  const refreshMutation = useRefreshTools();
  const publishMutation = usePublishServer();
  const updateMutation = useUpdateMCPServer();
  const deleteMutation = useDeleteMCPServer();
  const promotionMutation = useRequestPromotion();
  const promoteMutation = usePromoteServer();
  const declineMutation = useDeclinePromotion();

  const [isVisible, setIsVisible] = useState(false);
  const [toolsExpanded, setToolsExpanded] = useState(true);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(), 300);
  };

  if (isLoading || !server) {
    return (
      <>
        <div
          className={`fixed inset-0 bg-black/20 z-40 ${isVisible ? "opacity-100" : "opacity-0"}`}
        />
        <div
          className={`fixed top-0 right-0 h-full w-120 p-2 z-50 transform ${isVisible ? "translate-x-0" : "translate-x-full"}`}
        >
          <div className="h-full flex items-center justify-center bg-white rounded-xl border border-gray-200">
            <p className="text-sm text-gray-500">Loading…</p>
          </div>
        </div>
      </>
    );
  }

  const isAuthenticated = server.authentication_status === "AUTHENTICATED";
  const tools = server.tool_manifest ?? [];
  const writeTools = tools.filter((t) => t.is_write);
  const isDraft = server.availability_status === "draft";
  const isPublished = server.availability_status === "published";
  const isArchived = server.availability_status === "archived";
  const isPersonal = server.access_level === "user";
  const hasTools = tools.length > 0;

  const handleDisconnect = () => {
    deleteMutation.mutate(serverId, { onSuccess: handleClose });
  };

  const handlePublish = (type: string, roles?: string[]) => {
    publishMutation.mutate({
      id: serverId,
      data: { status: "published", type, roles },
    });
  };

  const handleArchive = () => {
    updateMutation.mutate({
      id: serverId,
      data: { availability_status: "archived" },
    });
  };

  const authLabel =
    server.auth_type === "api_key"
      ? "API Key"
      : server.auth_type === "oauth2"
        ? "OAuth"
        : "None";

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/20 transition-opacity duration-300 z-40 ${isVisible ? "opacity-100" : "opacity-0"}`}
        onClick={handleClose}
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
                <div>
                  <h2 className="text-base font-semibold text-gray-900 m-0">
                    {server.name}
                  </h2>
                  <p className="text-xs text-gray-500 m-0">
                    MCP &middot;{" "}
                    {server.access_level === "tenant"
                      ? "Workspace"
                      : "Personal"}{" "}
                    &middot; {server.source}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-500 hover:text-gray-700 cursor-pointer"
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

          <div className="flex-1 overflow-y-auto settings-scrollbar px-6 py-4 space-y-6">
            {/* ── Section 1: Status ── */}
            {isAuthenticated ? (
              <div className="flex items-start gap-3 px-4 py-3 bg-green-50 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shrink-0 mt-0.5">
                  <Check size={14} weight="bold" className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-green-900">
                    Connected
                  </p>
                  <p className="text-xs text-green-700 mt-0.5">
                    {authLabel} &middot; {tools.length} tool
                    {tools.length !== 1 ? "s" : ""} active
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg">
                <WarningCircle size={20} className="text-gray-400 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Not authenticated
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Re-authenticate to use this server.
                  </p>
                </div>
              </div>
            )}

            {/* ── Section 1b: Connection info ── */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                Connection
              </h3>
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-200 text-sm">
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-gray-500">Auth</span>
                  <span className="font-medium text-gray-900">{authLabel}</span>
                </div>
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-gray-500">Scope</span>
                  <span className="font-medium text-gray-900">
                    {server.access_level === "tenant"
                      ? "Workspace"
                      : "Personal"}
                  </span>
                </div>
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-gray-500">URL</span>
                  <span className="font-mono text-xs text-gray-700 truncate max-w-[260px]">
                    {server.server_url}
                  </span>
                </div>
              </div>
            </div>

            {/* ── Section 2: Tools ── */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Tools</h3>
              {!hasTools ? (
                <div className="border border-gray-200 rounded-lg px-4 py-6 text-center">
                  <p className="text-sm text-gray-500 mb-3">
                    No tools discovered yet.
                  </p>
                  <button
                    onClick={() => discoverMutation.mutate(serverId)}
                    disabled={discoverMutation.isPending}
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer disabled:opacity-50"
                  >
                    {discoverMutation.isPending
                      ? "Connecting to server…"
                      : "Discover tools"}
                  </button>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setToolsExpanded(!toolsExpanded)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 cursor-pointer"
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
                        {tools.length} tool{tools.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    {writeTools.length > 0 && (
                      <span className="text-xs text-gray-500">
                        {tools.length} total &middot;{" "}
                        <span className="text-amber-600">
                          {writeTools.length} write
                        </span>
                      </span>
                    )}
                  </button>

                  {toolsExpanded && (
                    <div className="border-t border-gray-200 divide-y divide-gray-100">
                      {tools.map((tool: MCPToolInfo) => (
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

                  {/* Footer: last refreshed + refresh button */}
                  <div className="border-t border-gray-200 px-4 py-2 flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      {server.manifest_refreshed_at
                        ? `Last updated ${new Date(server.manifest_refreshed_at).toLocaleDateString()}`
                        : ""}
                    </span>
                    <button
                      onClick={() => refreshMutation.mutate(serverId)}
                      disabled={refreshMutation.isPending}
                      className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 cursor-pointer disabled:opacity-50"
                    >
                      <ArrowsClockwise
                        size={12}
                        className={
                          refreshMutation.isPending ? "animate-spin" : ""
                        }
                      />
                      Refresh tools
                    </button>
                  </div>
                </div>
              )}

              {writeTools.length > 0 && (
                <p className="text-xs text-gray-400 mt-2">
                  Write tools require approval before the agent executes them.
                </p>
              )}
            </div>

            {/* ── Section 3: Publishing (workspace only) ── */}
            {server.access_level === "tenant" && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  Publishing
                </h3>
                {isDraft && (
                  <div className="border border-gray-200 rounded-lg px-4 py-4 bg-gray-50">
                    <p className="text-sm text-gray-600 mb-1">
                      This server is not published.
                    </p>
                    <p className="text-xs text-gray-400 mb-3">
                      Members cannot use it until you publish.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePublish("admin_published")}
                        disabled={!hasTools || publishMutation.isPending}
                        title={!hasTools ? "Discover tools first" : undefined}
                        className="px-3 py-1.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {publishMutation.isPending
                          ? "Publishing…"
                          : "Publish to all members"}
                      </button>
                    </div>
                    {writeTools.length > 0 && hasTools && (
                      <p className="text-xs text-amber-600 mt-2">
                        This server includes {writeTools.length} write tool
                        {writeTools.length !== 1 ? "s" : ""}. Write tool calls
                        will require user approval.
                      </p>
                    )}
                  </div>
                )}

                {isPublished && (
                  <div className="border border-green-200 rounded-lg px-4 py-3 bg-green-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-sm font-medium text-green-900">
                          Published
                        </span>
                        <span className="text-xs text-green-700">
                          Visible to:{" "}
                          {server.availability_type === "role_restricted"
                            ? server.availability_allowed_roles.join(", ")
                            : "All members"}
                        </span>
                      </div>
                      <button
                        onClick={handleArchive}
                        className="text-xs text-gray-500 hover:text-gray-700 cursor-pointer"
                      >
                        Archive
                      </button>
                    </div>
                  </div>
                )}

                {isArchived && (
                  <div className="border border-yellow-200 rounded-lg px-4 py-3 bg-yellow-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium text-yellow-800">
                          Archived
                        </span>
                        <p className="text-xs text-yellow-600 mt-0.5">
                          Members cannot use this server.
                        </p>
                      </div>
                      <button
                        onClick={() => handlePublish("admin_published")}
                        disabled={publishMutation.isPending}
                        className="px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-white cursor-pointer disabled:opacity-50"
                      >
                        Re-publish
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Section 4: Promotion (personal only) ── */}
            {isPersonal && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  Workspace access
                </h3>
                {isAdmin ? (
                  <div className="border border-gray-200 rounded-lg px-4 py-4 bg-gray-50">
                    <p className="text-sm text-gray-600 mb-1">
                      Publish this MCP to make it available to all workspace
                      members.
                    </p>
                    <p className="text-xs text-gray-400 mb-3">
                      As an admin you can publish directly without requesting
                      approval.
                    </p>
                    <button
                      onClick={() =>
                        promoteMutation.mutate(serverId, {
                          onSuccess: handleClose,
                        })
                      }
                      disabled={!hasTools || promoteMutation.isPending}
                      title={!hasTools ? "Discover tools first" : undefined}
                      className="px-3 py-1.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {promoteMutation.isPending
                        ? "Publishing…"
                        : "Publish to workspace"}
                    </button>
                    {!hasTools && (
                      <p className="text-xs text-gray-400 mt-2">
                        Discover tools before publishing.
                      </p>
                    )}
                  </div>
                ) : !server.promotion_requested ? (
                  <div className="border border-gray-200 rounded-lg px-4 py-4 bg-gray-50">
                    <p className="text-sm text-gray-600 mb-2">
                      This is your personal MCP. Only you can see it.
                    </p>
                    <button
                      onClick={() => promotionMutation.mutate(serverId)}
                      disabled={promotionMutation.isPending}
                      className="px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-white cursor-pointer disabled:opacity-50"
                    >
                      {promotionMutation.isPending
                        ? "Requesting…"
                        : "Request workspace access"}
                    </button>
                  </div>
                ) : (
                  <Banner
                    variant="info"
                    message="Workspace access requested — waiting for admin approval."
                  />
                )}
              </div>
            )}

            {/* Admin: promotion review */}
            {server.promotion_requested && server.access_level === "tenant" && (
              <div className="border border-amber-200 rounded-lg px-4 py-3 bg-amber-50">
                <p className="text-sm text-amber-800 mb-2">
                  This server was submitted for workspace access.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => promoteMutation.mutate(serverId)}
                    disabled={promoteMutation.isPending}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 cursor-pointer disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => declineMutation.mutate(serverId)}
                    disabled={declineMutation.isPending}
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-white cursor-pointer disabled:opacity-50"
                  >
                    Decline
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-gray-200 shrink-0">
            <div className="flex items-center justify-between">
              <button
                onClick={handleDisconnect}
                disabled={deleteMutation.isPending}
                className="text-sm font-medium text-red-600 hover:text-red-700 cursor-pointer disabled:opacity-50"
              >
                {deleteMutation.isPending ? "Removing…" : "Disconnect"}
              </button>
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
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
