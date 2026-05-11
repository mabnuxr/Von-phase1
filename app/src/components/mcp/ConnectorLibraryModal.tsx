import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  MagnifyingGlass,
  X,
  CaretLeft,
  Plugs,
  ArrowSquareOut,
  Check,
  CaretDown,
  User,
  ArrowsLeftRight,
} from "@phosphor-icons/react";
import vonFilledLogo from "../../assets/von-filled-logo.svg";
import { Input, Banner } from "@vonlabs/design-components";
import {
  useMCPCatalog,
  useMCPServers,
  useCreateMCPServer,
  useDeleteMCPServer,
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

  const hasPersonalLevel = entry.default_access_level.some(
    (l) => l === "user" || l === "personal",
  );
  const badge =
    hasPersonalLevel && !entry.is_personal_connected ? "Added" : "Connected";

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
                {badge}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{accessLabel}</p>
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
  const { data: allServers } = useMCPServers();
  const createMutation = useCreateMCPServer();
  const publishMutation = usePublishServer();
  const deleteMutation = useDeleteMCPServer();
  const discoverMutation = useDiscoverTools();
  const authorizeMutation = useMCPAuthorize();
  const { showToast } = useToast();

  const authTypes: MCPAuthType[] = [entry.auth_type];
  const [selectedAuth, setSelectedAuth] = useState<MCPAuthType>(authTypes[0]);
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [showPermissions, setShowPermissions] = useState<"personal" | null>(
    null,
  );
  const [splitOpen, setSplitOpen] = useState(false);
  const [orgMemory, setOrgMemory] = useState("");
  const splitRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!splitOpen) return;
    const handler = (e: MouseEvent) => {
      if (splitRef.current && !splitRef.current.contains(e.target as Node)) {
        setSplitOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [splitOpen]);

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
  const isPersonalSupported = (entry.default_access_level ?? []).some(
    (l) => l === "user" || l === "personal",
  );
  const isPersonalOnly = !isWorkspaceConnector;
  const isBothLevels = isWorkspaceConnector && isPersonalSupported;
  // Personal-only app enabled for team but current user hasn't personally connected
  const isAddedForTeam =
    isPersonalOnly &&
    entry.is_connected &&
    entry.authentication_status !== "AUTHENTICATED";
  // Derive real connection state from server list (catalog fields are unreliable)
  const entryServers = (allServers ?? []).filter(
    (s) => s.catalog_id === entry.catalog_id,
  );
  const workspaceServer = entryServers.find(
    (s) =>
      s.access_level === "tenant" &&
      s.authentication_status === "AUTHENTICATED",
  );
  const personalServer = entryServers.find(
    (s) =>
      s.access_level === "user" && s.authentication_status === "AUTHENTICATED",
  );
  // Both-levels app where personal is connected but workspace is not yet
  const isOnlyPersonalConnected =
    isBothLevels && !!personalServer && !workspaceServer;

  const authTypeLabel =
    entry.auth_type === "oauth2"
      ? "OAuth"
      : entry.auth_type === "api_key"
        ? "API Key"
        : "No auth";

  const handleDisconnect = async () => {
    setError(null);
    try {
      if (isOnlyPersonalConnected) {
        if (!personalServer) return;
        await deleteMutation.mutateAsync(personalServer.id);
      } else {
        const wsId = workspaceServer?.id ?? entry.connected_server_id;
        if (!wsId) return;
        await deleteMutation.mutateAsync(wsId);
        // Cascade: remove personal server too so the entry fully disappears
        if (personalServer) {
          await deleteMutation.mutateAsync(personalServer.id);
        }
      }
      showToast({ message: `${entry.name} disconnected`, variant: "success" });
      onBack();
    } catch {
      setError("Failed to disconnect. Please try again.");
    }
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
        access_level: "tenant",
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

  const handleConnect = async (accessLevel?: "tenant" | "user") => {
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
        access_level: accessLevel,
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
                        className={`px-2 py-0.5 text-[11px] font-semibold rounded ${
                          label === "Personal"
                            ? "text-blue-600 bg-blue-50"
                            : "text-gray-700 bg-gray-100"
                        }`}
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {isAddedForTeam && isAdmin ? (
                <button
                  onClick={() => setShowRemoveConfirm(true)}
                  disabled={deleteMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0 transition-colors"
                >
                  Disable for Team
                </button>
              ) : isOnlyPersonalConnected && isAdmin ? (
                /* Personal connected, workspace not yet — Disconnect + Connect as Workspace */
                <div ref={splitRef} className="relative flex shrink-0">
                  <button
                    onClick={() => setShowRemoveConfirm(true)}
                    disabled={deleteMutation.isPending}
                    className="px-5 py-2 text-sm font-medium text-red-600 border border-red-300 rounded-l-lg hover:bg-red-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Disconnect
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSplitOpen((o) => !o);
                    }}
                    disabled={isBusy}
                    className="px-2 py-2 text-red-600 border border-red-300 border-l-red-200 rounded-r-lg hover:bg-red-50 cursor-pointer disabled:opacity-50 transition-colors"
                  >
                    <CaretDown size={13} weight="bold" />
                  </button>
                  {splitOpen && (
                    <div className="absolute top-full right-0 mt-1.5 bg-white rounded-xl border border-gray-200 shadow-lg z-10 min-w-44 py-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSplitOpen(false);
                          handleConnect("tenant");
                        }}
                        disabled={isBusy}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors disabled:opacity-50"
                      >
                        <User size={12} className="text-gray-500" />
                        Connect as Workspace
                      </button>
                    </div>
                  )}
                </div>
              ) : entry.is_connected && isAdmin ? (
                <button
                  onClick={() => setShowRemoveConfirm(true)}
                  disabled={deleteMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0 transition-colors"
                >
                  Remove from Workspace
                </button>
              ) : !entry.is_connected &&
                isAdmin &&
                (isPersonalOnly || isBothLevels) ? (
                /* Split button for personal-only or workspace+personal apps */
                <div ref={splitRef} className="relative flex shrink-0">
                  <button
                    onClick={() =>
                      isPersonalOnly
                        ? handleAddToWorkspace()
                        : handleConnect("tenant")
                    }
                    disabled={isBusy || publishMutation.isPending}
                    className="px-5 py-2 text-sm font-medium text-white bg-gray-900 rounded-l-lg hover:bg-gray-800 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isBusy || publishMutation.isPending
                      ? "Connecting…"
                      : isPersonalOnly
                        ? "Enable for Team"
                        : "Connect as Workspace"}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSplitOpen((o) => !o);
                    }}
                    disabled={isBusy || publishMutation.isPending}
                    className="px-2 py-2 text-white bg-gray-900 rounded-r-lg hover:bg-gray-800 cursor-pointer disabled:opacity-50 border-l border-white/20 transition-colors"
                  >
                    <CaretDown size={13} weight="bold" />
                  </button>
                  {splitOpen && (
                    <div className="absolute top-full right-0 mt-1.5 bg-white rounded-xl border border-gray-200 shadow-lg z-10 min-w-36 py-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSplitOpen(false);
                          setShowPermissions("personal");
                        }}
                        disabled={isBusy}
                        className="w-full flex items-center gap-1.5 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors disabled:opacity-50"
                      >
                        <User size={12} className="text-gray-500" />
                        Personal Access
                      </button>
                    </div>
                  )}
                </div>
              ) : !entry.is_connected && isAdmin && isWorkspaceConnector ? (
                <button
                  onClick={() => (isBusy ? undefined : handleConnect("tenant"))}
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

            {/* ── Connected state ── */}
            {(entry.is_connected || isOnlyPersonalConnected) &&
            !isAddedForTeam ? (
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

            {/* Org Memory */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-sm font-semibold text-gray-900">
                  Org Memory
                </h3>
                <span className="text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                  Optional
                </span>
              </div>
              <textarea
                value={orgMemory}
                onChange={(e) => setOrgMemory(e.target.value)}
                placeholder={
                  "Help Von decide when to use this integration and what context to pull from it.\n\ne.g. Use this when users ask about [topic]. Always pull [relevant data]."
                }
                rows={5}
                className="w-full px-3 py-3 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-gray-900 placeholder:text-gray-400 leading-relaxed"
              />
              <div className="flex justify-end mt-2">
                <button
                  disabled={!orgMemory.trim()}
                  className="px-4 py-1.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Save
                </button>
              </div>
            </div>

            {/* Details */}
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Details
            </h3>
            <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm mb-4">
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Integration Type
                </p>
                <p className="text-gray-900">
                  {entry.tool_manifest?.some((t) => t.is_write)
                    ? "Read & Write"
                    : "Read Only"}
                </p>
              </div>
              {entry.docs_url && (
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    More Info
                  </p>
                  <a
                    href={entry.docs_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-gray-700 hover:text-gray-900"
                  >
                    Documentation{" "}
                    <ArrowSquareOut size={12} className="text-gray-400" />
                  </a>
                </div>
              )}
            </div>
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
              {isAddedForTeam
                ? "Disable for Team"
                : isOnlyPersonalConnected
                  ? "Disconnect Personal Access"
                  : "Remove from Workspace"}
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              {isAddedForTeam ? (
                <>
                  Are you sure you want to disable <strong>{entry.name}</strong>{" "}
                  for your team? Members won't be able to connect their personal
                  accounts.
                </>
              ) : isOnlyPersonalConnected ? (
                <>
                  Are you sure you want to disconnect your personal{" "}
                  <strong>{entry.name}</strong> connection?
                </>
              ) : (
                <>
                  Are you sure you want to remove <strong>{entry.name}</strong>{" "}
                  from workspace? This will remove the workspace connection.
                </>
              )}
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
                {deleteMutation.isPending
                  ? "Removing…"
                  : isAddedForTeam
                    ? "Disable"
                    : "Disconnect"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPermissions && (
        <PermissionsModal
          entry={entry}
          onDeny={() => setShowPermissions(null)}
          onAllow={() => {
            setShowPermissions(null);
            handleConnect("user");
          }}
        />
      )}
    </>
  );
}

/* ─── Permissions consent modal ─── */
function PermissionsModal({
  entry,
  onDeny,
  onAllow,
}: {
  entry: CatalogEntry;
  onDeny: () => void;
  onAllow: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-8">
      <div className="fixed inset-0 bg-black/20" onClick={onDeny} />
      <div className="relative bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-sm p-6 pointer-events-auto">
        {/* App + Von logos */}
        <div className="flex items-center justify-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
            {entry.logo_url ? (
              <img
                src={entry.logo_url}
                alt=""
                className="w-12 h-12 object-contain"
              />
            ) : (
              <Plugs size={24} className="text-gray-400" />
            )}
          </div>
          <ArrowsLeftRight size={18} className="text-gray-400" />
          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
            <img
              src={vonFilledLogo}
              alt="Von"
              className="w-8 h-8 object-contain"
            />
          </div>
        </div>

        <h2 className="text-base font-semibold text-gray-900 mb-1 text-center">
          {entry.name} wants to connect to Von
        </h2>
        <p className="text-sm text-gray-500 mb-5 text-center">
          Von is requesting access to your {entry.name} workspace to use the
          following tools on your team&apos;s behalf.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onDeny}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
          >
            Deny
          </button>
          <button
            onClick={onAllow}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 cursor-pointer transition-colors"
          >
            Allow access
          </button>
        </div>
      </div>
    </div>
  );
}
