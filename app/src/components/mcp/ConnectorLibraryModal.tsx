import { useState, useMemo, useEffect, useCallback } from "react";
import {
  MagnifyingGlass,
  X,
  Plus,
  CaretLeft,
  Plugs,
  ArrowSquareOut,
  Check,
  CaretDown,
  CaretUp,
} from "@phosphor-icons/react";
import { Input, Banner } from "@vonlabs/design-components";
import {
  useMCPCatalog,
  useCreateMCPServer,
  useDeleteMCPServer,
  useMCPServer,
  useDiscoverTools,
  useMCPAuthorize,
  useMCPCheckAuthStatus,
  usePublishServer,
} from "../../hooks/useMCPServers";
import type { CatalogEntry, MCPAuthType } from "../../types/mcp";
import { useToast } from "../../hooks/useToast";
import { useUser } from "../../hooks/useUser";

interface ConnectorLibraryModalProps {
  onClose: () => void;
}

export function ConnectorLibraryModal({ onClose }: ConnectorLibraryModalProps) {
  const { data: catalog, isLoading } = useMCPCatalog();
  const { user } = useUser();
  const isAdmin =
    user?.roles?.some((r) => r.toLowerCase() === "admin") ?? false;
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [detailEntry, setDetailEntry] = useState<CatalogEntry | null>(null);

  // Derive categories from catalog (keyed by category_code, display via category_name)
  const categories = useMemo(() => {
    if (!catalog) return [];
    const map = new Map<string, { name: string; count: number }>();
    catalog.forEach((e) => {
      const code = e.category_code || "other";
      const name = e.category_name || "Other";
      const existing = map.get(code);
      map.set(code, { name, count: (existing?.count ?? 0) + 1 });
    });
    return Array.from(map.entries()).map(([code, { name, count }]) => ({
      code,
      name,
      count,
    }));
  }, [catalog]);

  const totalCount = catalog?.length ?? 0;

  // Filter entries
  const filtered = useMemo(() => {
    if (!catalog) return [];
    return catalog.filter((e) => {
      if (selectedCategory && e.category_code !== selectedCategory)
        return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          e.name.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.category_name.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [catalog, selectedCategory, search]);

  if (detailEntry) {
    return (
      <ConnectorDetailView
        entry={detailEntry}
        isAdmin={isAdmin}
        onBack={() => setDetailEntry(null)}
        onClose={onClose}
      />
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-8 pointer-events-none">
        <div
          className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-4xl h-[80vh] flex flex-col pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 pt-5 pb-4 border-b border-gray-200 shrink-0">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  App Library
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Connect and manage apps for your workspace
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 cursor-pointer p-1"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex flex-1 min-h-0">
            {/* Left: Category sidebar */}
            <div className="w-48 border-r border-gray-200 py-3 overflow-y-auto shrink-0">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`w-full flex items-center justify-between px-4 py-1.5 text-sm cursor-pointer transition-colors ${
                  !selectedCategory
                    ? "font-semibold text-gray-900 bg-gray-50"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span>All apps</span>
                <span className="text-xs text-gray-400">{totalCount}</span>
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.code}
                  onClick={() => setSelectedCategory(cat.code)}
                  className={`w-full flex items-center justify-between px-4 py-1.5 text-sm cursor-pointer transition-colors ${
                    selectedCategory === cat.code
                      ? "font-semibold text-gray-900 bg-gray-50"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <span>{cat.name}</span>
                  <span className="text-xs text-gray-400">{cat.count}</span>
                </button>
              ))}
            </div>

            {/* Right: Search + Grid */}
            <div className="flex-1 flex flex-col min-h-0">
              {/* Search */}
              <div className="px-5 pt-4 pb-3 shrink-0">
                <div className="relative">
                  <MagnifyingGlass
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    placeholder="Search apps..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-5 pb-5">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12 text-sm text-gray-500">
                    Loading apps...
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="flex items-center justify-center py-12 text-sm text-gray-500">
                    No apps found
                  </div>
                ) : (
                  <AppLibraryGrid
                    entries={filtered}
                    selectedCategory={selectedCategory}
                    categories={categories}
                    onSelect={(entry) => setDetailEntry(entry)}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── App Library Grid (connected + unconnected sections) ─── */
function AppLibraryGrid({
  entries,
  selectedCategory,
  categories,
  onSelect,
}: {
  entries: CatalogEntry[];
  selectedCategory: string | null;
  categories: { code: string; name: string }[];
  onSelect: (entry: CatalogEntry) => void;
}) {
  const connected = entries.filter((e) => e.is_connected);
  const unconnected = entries.filter((e) => !e.is_connected);
  const categoryName = selectedCategory
    ? (categories.find((c) => c.code === selectedCategory)?.name ?? "")
    : "";

  return (
    <div className="space-y-5">
      {connected.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Connected
          </p>
          <div className="grid grid-cols-2 gap-3">
            {connected.map((entry) => (
              <ConnectedAppCard
                key={entry.catalog_id}
                entry={entry}
                onClick={() => onSelect(entry)}
              />
            ))}
          </div>
        </div>
      )}

      {unconnected.length > 0 && (
        <div>
          {(connected.length > 0 || categoryName) && (
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
              {categoryName ? `More in ${categoryName}` : "More apps"}
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            {unconnected.map((entry) => (
              <AppCard
                key={entry.catalog_id}
                entry={entry}
                onClick={() => onSelect(entry)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Connected App Card (full-width) ─── */
function ConnectedAppCard({
  entry,
  onClick,
}: {
  entry: CatalogEntry;
  onClick: () => void;
}) {
  const accessLabel = entry.default_access_level
    .map((l) => (l === "workspace" ? "Workspace" : "Personal"))
    .join(" · ");

  return (
    <div
      onClick={onClick}
      className="border border-gray-200 rounded-xl p-4 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer flex gap-3"
    >
      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
        {entry.logo_url ? (
          <img
            src={entry.logo_url}
            alt=""
            className="w-10 h-10 object-contain"
          />
        ) : (
          <Plugs size={18} className="text-gray-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-semibold text-gray-900 leading-tight">
                {entry.name}
              </span>
              <span className="text-[11px] font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded shrink-0">
                Connected
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{accessLabel}</p>
          </div>
          <div
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            className="w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center shrink-0 mt-0.5 hover:bg-gray-700 transition-colors cursor-pointer"
          >
            <X size={10} weight="bold" className="text-white" />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">
          {entry.description}
        </p>
      </div>
    </div>
  );
}

/* ─── Unconnected App Card (2-column grid) ─── */
function AppCard({
  entry,
  onClick,
}: {
  entry: CatalogEntry;
  onClick: () => void;
}) {
  const accessLabel = entry.default_access_level
    .map((l) => (l === "workspace" ? "Workspace" : "Personal"))
    .join(" · ");

  return (
    <div
      onClick={onClick}
      className="border border-gray-200 rounded-xl p-4 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer flex gap-3"
    >
      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
        {entry.logo_url ? (
          <img
            src={entry.logo_url}
            alt=""
            className="w-10 h-10 object-contain"
          />
        ) : (
          <Plugs size={18} className="text-gray-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 leading-tight">
              {entry.name}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{accessLabel}</p>
          </div>
          <div className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center shrink-0 mt-0.5">
            <Plus size={12} className="text-gray-500" />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">
          {entry.description}
        </p>
      </div>
    </div>
  );
}

/* ─── Connector Detail View (replaces grid inside modal) ─── */
function ConnectorDetailView({
  entry,
  isAdmin,
  onBack,
  onClose,
}: {
  entry: CatalogEntry;
  isAdmin: boolean;
  onBack: () => void;
  onClose: () => void;
}) {
  const createMutation = useCreateMCPServer();
  const publishMutation = usePublishServer();
  const deleteMutation = useDeleteMCPServer();
  const discoverMutation = useDiscoverTools();
  const authorizeMutation = useMCPAuthorize();
  const { showToast } = useToast();

  // Fetch live tool manifest from the connected server record
  const { data: connectedServer } = useMCPServer(
    entry.is_connected ? entry.connected_server_id : null,
  );
  const liveTools = connectedServer?.tool_manifest ?? entry.tool_manifest ?? [];

  const authTypes: MCPAuthType[] = [entry.auth_type];
  const [selectedAuth, setSelectedAuth] = useState<MCPAuthType>(authTypes[0]);
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [toolsExpanded, setToolsExpanded] = useState(true);

  // OAuth flow state
  const [createdServerId, setCreatedServerId] = useState<string | null>(null);
  const [waitingForOAuth, setWaitingForOAuth] = useState(false);
  const [discoverTriggered, setDiscoverTriggered] = useState(false);
  const [oauthPopup, setOauthPopup] = useState<Window | null>(null);

  // Polling fallback for OAuth (if postMessage is missed)
  const authStatusQuery = useMCPCheckAuthStatus(
    createdServerId,
    waitingForOAuth,
  );

  // Helper: auth succeeded → discover → close
  const finishOAuth = useCallback(
    (serverId: string) => {
      if (discoverTriggered) return;
      setDiscoverTriggered(true);
      setWaitingForOAuth(false);
      oauthPopup?.close();
      showToast({
        message: `${entry.name} connected — discovering tools…`,
        variant: "success",
      });
      discoverMutation.mutate(serverId, {
        onSettled: () => onClose(),
      });
    },
    [
      discoverTriggered,
      oauthPopup,
      entry.name,
      showToast,
      discoverMutation,
      onClose,
    ],
  );

  // Primary: listen for postMessage from OAuth callback page
  useEffect(() => {
    if (!waitingForOAuth || !createdServerId) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type !== "mcp_oauth_callback") return;
      if (event.data.success) {
        finishOAuth(createdServerId);
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
  }, [waitingForOAuth, createdServerId, finishOAuth, oauthPopup]);

  // Fallback: polling detects AUTHENTICATED if postMessage was missed
  useEffect(() => {
    if (!waitingForOAuth || !createdServerId || discoverTriggered) return;
    const status = authStatusQuery.data?.authentication_status;

    if (status === "AUTHENTICATED") {
      finishOAuth(createdServerId);
    } else if (status === "AUTHENTICATION_FAILED") {
      setWaitingForOAuth(false);
      oauthPopup?.close();
      setError("OAuth authorization failed. Please try again.");
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

  const accessLabels = (entry.default_access_level ?? []).map((l) =>
    l === "workspace" ? "Workspace" : "Personal",
  );

  const isWorkspaceConnector = (entry.default_access_level ?? []).some(
    (l) => l === "tenant" || l === "workspace",
  );
  const isPersonalOnly = !isWorkspaceConnector;

  const authTypeLabel =
    entry.auth_type === "oauth2"
      ? "OAuth"
      : entry.auth_type === "api_key"
        ? "API Key"
        : "No auth";

  const handleDisconnect = () => {
    if (!entry.connected_server_id) return;
    deleteMutation.mutate(entry.connected_server_id, {
      onSuccess: () => {
        showToast({
          message: `${entry.name} disconnected`,
          variant: "success",
        });
        onBack();
      },
      onError: () => setError("Failed to disconnect. Please try again."),
    });
  };

  // Personal-only: register the server and publish it so members can connect
  const handleAddToWorkspace = async () => {
    setError(null);
    try {
      const server = await createMutation.mutateAsync({
        name: entry.name,
        server_url: entry.server_url,
        auth_type: entry.auth_type,
        source: "catalog",
        catalog_id: entry.catalog_id,
      });
      await publishMutation.mutateAsync({
        id: server.id,
        data: { status: "published", type: "admin_published" },
      });
      showToast({
        message: `${entry.name} added to workspace`,
        variant: "success",
      });
      onClose();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : "Failed to add to workspace";
      setError(msg);
    }
  };

  const handleConnect = async () => {
    if (selectedAuth === "api_key" && !apiKey.trim()) {
      setError(`${entry.credential_label || "API Key"} is required`);
      return;
    }
    setError(null);

    try {
      // 1. Create the MCP server
      const server = await createMutation.mutateAsync({
        name: entry.name,
        server_url: entry.server_url,
        auth_type: selectedAuth,
        api_key: selectedAuth === "api_key" ? apiKey.trim() : undefined,
        source: "catalog",
        catalog_id: entry.catalog_id,
      });

      setCreatedServerId(server.id);

      if (selectedAuth === "oauth2") {
        // 2a. OAuth PKCE: call MCP authorize endpoint → open popup → wait
        try {
          const authData = await authorizeMutation.mutateAsync(server.id);
          const popup = window.open(
            authData.authorization_url,
            "mcp_oauth",
            "popup,width=600,height=700",
          );
          setOauthPopup(popup);
          setWaitingForOAuth(true);
        } catch (authErr: unknown) {
          const msg =
            authErr && typeof authErr === "object" && "message" in authErr
              ? (authErr as { message: string }).message
              : "Failed to start authorization";
          setError(msg);
        }
      } else {
        // 2b. API key / None: already authenticated → discover → close
        showToast({
          message: `${entry.name} connected — discovering tools…`,
          variant: "success",
        });
        try {
          await discoverMutation.mutateAsync(server.id);
        } catch {
          // non-fatal
        }
        onClose();
      }
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : "Failed to connect";
      setError(msg);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-8 pointer-events-none">
        <div
          className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-3xl max-h-[80vh] flex flex-col pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top bar */}
          <div className="px-6 pt-4 pb-0 shrink-0 flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 cursor-pointer"
            >
              <CaretLeft size={14} weight="bold" />
              Back
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 cursor-pointer p-1"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {/* Header */}
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                  {entry.logo_url ? (
                    <img
                      src={entry.logo_url}
                      alt=""
                      className="w-14 h-14 object-contain"
                    />
                  ) : (
                    <Plugs size={28} className="text-gray-400" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {entry.name}
                  </h2>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className="text-sm text-gray-500">
                      {entry.category_name}
                    </span>
                    {accessLabels.map((label) => (
                      <span
                        key={label}
                        className="px-2 py-0.5 text-[11px] font-semibold text-gray-700 bg-gray-100 rounded"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {entry.is_connected && isAdmin ? (
                <button
                  onClick={() => setShowRemoveConfirm(true)}
                  disabled={deleteMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0 transition-colors"
                >
                  Remove from Workspace
                </button>
              ) : !entry.is_connected && isAdmin && isPersonalOnly ? (
                <button
                  onClick={() =>
                    createMutation.isPending
                      ? undefined
                      : handleAddToWorkspace()
                  }
                  disabled={createMutation.isPending}
                  className="px-5 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                  {createMutation.isPending ? "Adding…" : "Add to Workspace"}
                </button>
              ) : !entry.is_connected && isAdmin && isWorkspaceConnector ? (
                <button
                  onClick={() => (isBusy ? undefined : handleConnect())}
                  disabled={isBusy}
                  className="px-5 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                  {waitingForOAuth
                    ? "Waiting for authorization…"
                    : isBusy
                      ? "Connecting…"
                      : "Connect"}
                </button>
              ) : null}
            </div>

            {/* Description */}
            <p className="text-sm text-gray-700 mb-4">{entry.description}</p>

            {/* Author */}
            {entry.author && (
              <p className="text-sm text-gray-500 mb-1">
                Developed by{" "}
                {entry.docs_url ? (
                  <a
                    href={entry.docs_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-gray-900 hover:underline inline-flex items-center gap-0.5"
                  >
                    {entry.author}
                    <ArrowSquareOut size={12} className="text-gray-400" />
                  </a>
                ) : (
                  <span className="font-semibold text-gray-900">
                    {entry.author}
                  </span>
                )}
              </p>
            )}

            {/* Trust warning */}
            <p className="text-xs text-gray-400 mb-5">
              Only use connectors from developers you trust. Von does not
              control which tools developers make available and cannot verify
              that they will work as intended or that they won't change.
            </p>

            {/* ── Connected state ── */}
            {entry.is_connected ? (
              <>
                {/* Connected status banner */}
                <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-100 rounded-lg mb-5">
                  <Check
                    size={15}
                    weight="bold"
                    className="text-green-600 shrink-0"
                  />
                  <span className="text-sm font-medium text-green-700">
                    Connected · {authTypeLabel}
                  </span>
                </div>

                {/* Tools */}
                <div className="mb-5">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">
                    Tools
                  </h3>
                  {liveTools.length === 0 ? (
                    <p className="text-sm text-gray-400">
                      No tools discovered yet.
                    </p>
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
                            <CaretUp
                              size={14}
                              weight="bold"
                              className="text-gray-500"
                            />
                          )}
                          <span className="text-sm font-medium text-gray-900">
                            {liveTools.length} tool
                            {liveTools.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                        {liveTools.filter((t) => t.is_write).length > 0 && (
                          <span className="text-xs text-gray-500">
                            <span className="text-amber-600">
                              {liveTools.filter((t) => t.is_write).length} write
                            </span>
                          </span>
                        )}
                      </button>
                      {toolsExpanded && (
                        <div className="border-t border-gray-200 divide-y divide-gray-100">
                          {liveTools.map((tool) => (
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
                </div>
              </>
            ) : (
              <>
                {/* Auth type selector */}
                {authTypes.length > 1 && (
                  <div className="flex gap-0 mb-2">
                    {authTypes.map((at) => {
                      const label =
                        at === "oauth2"
                          ? "OAuth 2.0"
                          : at === "api_key"
                            ? "API Key"
                            : "No auth";
                      return (
                        <button
                          key={at}
                          onClick={() => setSelectedAuth(at)}
                          className={`px-4 py-1.5 text-sm font-medium rounded-lg cursor-pointer transition-colors ${
                            selectedAuth === at
                              ? "bg-gray-900 text-white"
                              : "text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* OAuth info */}
                {selectedAuth === "oauth2" && (
                  <p className="text-sm text-gray-500 mb-4">
                    You'll be redirected to authorize Von's access to your{" "}
                    <strong>{entry.name}</strong> account. No credentials are
                    stored on Von.
                  </p>
                )}

                {/* API key input */}
                {selectedAuth === "api_key" && (
                  <div className="mb-4 space-y-3">
                    <div className="mcp-input-wrapper">
                      <Input
                        type="password"
                        label={entry.credential_label || "API Key"}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder={`Enter your ${(entry.credential_label || "API key").toLowerCase()}`}
                        required
                        fullWidth
                        disabled={isBusy}
                      />
                    </div>
                    {entry.credential_hint_url && (
                      <a
                        href={entry.credential_hint_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-gray-500 hover:text-gray-700 underline"
                      >
                        How to get your credentials
                      </a>
                    )}
                  </div>
                )}
              </>
            )}

            {error && (
              <div className="mb-4">
                <Banner
                  variant="error"
                  message={error}
                  onClose={() => setError(null)}
                  dismissible
                />
              </div>
            )}

            {/* Details */}
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Details
            </h3>
            <div className="grid grid-cols-2 gap-y-3 gap-x-8 text-sm mb-4">
              {entry.author && (
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    Author
                  </p>
                  <p className="text-gray-900">{entry.author}</p>
                </div>
              )}
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Connector URL
                </p>
                <p className="text-gray-700 font-mono text-xs truncate">
                  {entry.server_url}
                </p>
              </div>
            </div>

            {/* More info links */}
            {(entry.docs_url ||
              entry.support_url ||
              entry.privacy_policy_url) && (
              <>
                <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  More Info
                </h4>
                <div className="space-y-1">
                  {entry.docs_url && (
                    <a
                      href={entry.docs_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-gray-700 hover:text-gray-900"
                    >
                      Documentation{" "}
                      <ArrowSquareOut size={12} className="text-gray-400" />
                    </a>
                  )}
                  {entry.support_url && (
                    <a
                      href={entry.support_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-gray-700 hover:text-gray-900"
                    >
                      Support{" "}
                      <ArrowSquareOut size={12} className="text-gray-400" />
                    </a>
                  )}
                  {entry.privacy_policy_url && (
                    <a
                      href={entry.privacy_policy_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-gray-700 hover:text-gray-900"
                    >
                      Privacy Policy{" "}
                      <ArrowSquareOut size={12} className="text-gray-400" />
                    </a>
                  )}
                </div>
              </>
            )}
          </div>

          <style>{`.mcp-input-wrapper input::placeholder { font-size: 13px; color: #9ca3af; }`}</style>
        </div>
      </div>

      {showRemoveConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-8">
          <div
            className="fixed inset-0 bg-black/20"
            onClick={() => setShowRemoveConfirm(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-sm p-6 pointer-events-auto">
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              Remove from Workspace
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to remove <strong>{entry.name}</strong> from
              workspace? This will remove the workspace connection.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowRemoveConfirm(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowRemoveConfirm(false);
                  handleDisconnect();
                }}
                disabled={deleteMutation.isPending}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 cursor-pointer disabled:opacity-50 transition-colors"
              >
                {deleteMutation.isPending ? "Removing…" : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
