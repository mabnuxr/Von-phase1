import { useState, useMemo, useEffect, useRef } from "react";
import {
  MagnifyingGlass,
  X,
  CaretLeft,
  Plugs,
  ArrowSquareOut,
  CaretDown,
  User,
} from "@phosphor-icons/react";
import { Input, Banner } from "@vonlabs/design-components";
import {
  useMCPCatalog,
  useMCPServers,
  useCreateMCPServer,
  useDeleteMCPServer,
  useDeleteMCPServerConnections,
  usePublishServer,
} from "../../hooks/useMCPServers";
import type { CatalogEntry } from "../../types/mcp";
import { useToast } from "../../hooks/useToast";
import { useUser } from "../../hooks/useUser";

interface ConnectorLibraryModalProps {
  onClose: () => void;
}

type SourceFilter = "all" | "von" | "mcp";

function isBuiltByVon(entry: CatalogEntry): boolean {
  return entry.author?.toLowerCase().includes("von") ?? false;
}

function getSourceLabel(entry: CatalogEntry): "Built by Von" | "MCP" {
  return isBuiltByVon(entry) ? "Built by Von" : "MCP";
}

export function ConnectorLibraryModal({ onClose }: ConnectorLibraryModalProps) {
  const { data: catalog, isLoading } = useMCPCatalog();
  const { data: mcpServers } = useMCPServers();
  const { user } = useUser();
  const isAdmin =
    user?.roles?.some((r) => r.toLowerCase() === "admin") ?? false;
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [detailEntry, setDetailEntry] = useState<CatalogEntry | null>(null);

  // Augment catalog entries with actual server state so published-but-not-auth servers show as "Added"
  const augmentedCatalog = useMemo(() => {
    if (!catalog) return catalog;
    const publishedCatalogIds = new Set(
      (mcpServers ?? [])
        .filter(
          (s) =>
            s.availability_status === "published" ||
            s.authentication_status === "AUTHENTICATED",
        )
        .map((s) => s.catalog_id)
        .filter(Boolean) as string[],
    );
    return catalog.map((entry) => ({
      ...entry,
      is_connected:
        entry.is_connected || publishedCatalogIds.has(entry.catalog_id),
    }));
  }, [catalog, mcpServers]);

  // Derive categories from catalog (keyed by category_code, display via category_name)
  const categories = useMemo(() => {
    if (!augmentedCatalog) return [];
    const map = new Map<string, { name: string; count: number }>();
    augmentedCatalog.forEach((e) => {
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
  }, [augmentedCatalog]);

  const totalCount = augmentedCatalog?.length ?? 0;

  // Filter entries
  const filtered = useMemo(() => {
    if (!augmentedCatalog) return [];
    return augmentedCatalog.filter((e) => {
      if (selectedCategory && e.category_code !== selectedCategory)
        return false;
      if (sourceFilter === "von" && !isBuiltByVon(e)) return false;
      if (sourceFilter === "mcp" && isBuiltByVon(e)) return false;
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
  }, [augmentedCatalog, selectedCategory, sourceFilter, search]);

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
              {/* Search + Source filter */}
              <div className="px-5 pt-4 pb-3 shrink-0 flex items-center gap-3">
                <div className="relative flex-1">
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
                <div className="flex items-center gap-1 shrink-0">
                  {(
                    [
                      { value: "all", label: "All" },
                      { value: "von", label: "Built by Von" },
                      { value: "mcp", label: "MCP" },
                    ] as const
                  ).map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setSourceFilter(value)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-full cursor-pointer transition-colors ${
                        sourceFilter === value
                          ? "bg-gray-900 text-white"
                          : "text-gray-600 border border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
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
  onSelect,
}: {
  entries: CatalogEntry[];
  selectedCategory: string | null;
  categories: { code: string; name: string }[];
  onSelect: (entry: CatalogEntry) => void;
}) {
  const added = entries.filter((e) => e.is_connected);
  const rest = entries.filter((e) => !e.is_connected);

  return (
    <div className="space-y-5">
      {added.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Added
          </p>
          <div className="grid grid-cols-2 gap-3">
            {added.map((entry) => (
              <AppCard
                key={entry.catalog_id}
                entry={entry}
                isAdded
                onClick={() => onSelect(entry)}
              />
            ))}
          </div>
        </div>
      )}

      {rest.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
            All apps
          </p>
          <div className="grid grid-cols-2 gap-3">
            {rest.map((entry) => (
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

/* ─── App Card ─── */
function AppCard({
  entry,
  isAdded = false,
  onClick,
}: {
  entry: CatalogEntry;
  isAdded?: boolean;
  onClick: () => void;
}) {
  const sourceLabel = getSourceLabel(entry);

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
        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
          <span className="text-sm font-semibold text-gray-900 leading-tight">
            {entry.name}
          </span>
          {isAdded && (
            <span className="text-[11px] font-semibold text-green-600 shrink-0">
              Added
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400">{sourceLabel}</p>
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
  const deleteConnectionsMutation = useDeleteMCPServerConnections();

  const { showToast } = useToast();

  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [showWorkspaceConfirm, setShowWorkspaceConfirm] = useState(false);
  const [toolsExpanded, setToolsExpanded] = useState(false);
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

  const isBusy = createMutation.isPending || publishMutation.isPending;

  // Source
  const isMCPEntry = !isBuiltByVon(entry);
  const sourceLabel = getSourceLabel(entry);

  // Server state
  const entryServers = (allServers ?? []).filter(
    (s) => s.catalog_id === entry.catalog_id,
  );
  const workspaceServer = entryServers.find(
    (s) =>
      s.connection_mode === "workspace" &&
      (s.authentication_status === "AUTHENTICATED" ||
        s.availability_status === "published"),
  );
  const personalServer = entryServers.find(
    (s) =>
      s.connection_mode === "personal" && s.availability_status === "published",
  );
  const isPersonalConnected = !!personalServer;
  const isWorkspaceConnected = !!workspaceServer;

  const authTypeLabel =
    entry.auth_type === "oauth2"
      ? "OAuth"
      : entry.auth_type === "api_key"
        ? "API Key"
        : "None";

  const writeOpsCount = (entry.tool_manifest ?? []).filter((t) => t.is_write).length;
  const totalTools = (entry.tool_manifest ?? []).length;
  const isReadWrite = writeOpsCount > 0;

  const handleDisconnect = async () => {
    setError(null);
    try {
      if (isPersonalConnected && !isWorkspaceConnected) {
        await deleteMutation.mutateAsync(personalServer!.id);
      } else {
        const wsId = workspaceServer?.id ?? entry.connected_server_id;
        if (!wsId) return;
        await deleteMutation.mutateAsync(wsId);
        if (personalServer) {
          await deleteMutation.mutateAsync(personalServer.id);
        }
      }
      showToast({ message: `${entry.name} removed`, variant: "success" });
      onBack();
    } catch {
      setError("Failed to remove. Please try again.");
    }
  };

  const handlePublish = async (accessLevel: "tenant" | "user") => {
    setError(null);
    try {
      const connectionMode = accessLevel === "tenant" ? "workspace" : "personal";

      // Bulk-delete opposite-side server before switching
      const oppositeServer = accessLevel === "tenant" ? personalServer : workspaceServer;
      if (oppositeServer) {
        await deleteConnectionsMutation.mutateAsync(oppositeServer.id);
      }

      const server = await createMutation.mutateAsync({
        name: entry.name,
        server_url: entry.server_url,
        auth_type: entry.auth_type,
        source: "catalog",
        catalog_id: entry.catalog_id,
        access_level: "tenant",
        connection_mode: connectionMode,
      });

      if (connectionMode === "workspace") {
        await publishMutation.mutateAsync({
          id: server.id,
          data: { status: "published", type: "admin_published" },
        });
      }
      // personal-mode is auto-published — no publish call

      showToast({
        message:
          connectionMode === "workspace"
            ? `${entry.name} added to workspace`
            : `${entry.name} added as personal`,
        variant: "success",
      });
      onClose();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : "Failed to add";
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
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                  {entry.logo_url ? (
                    <img src={entry.logo_url} alt="" className="w-16 h-16 object-contain" />
                  ) : (
                    <Plugs size={28} className="text-gray-400" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{entry.name}</h2>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-sm text-gray-500">{entry.category_name}·</span>
                    {isPersonalConnected && (
                      <span className="text-sm font-semibold text-blue-600">Personal</span>
                    )}
                  </div>
                  <span className="inline-block mt-1.5 px-2 py-0.5 text-[11px] font-medium text-gray-600 border border-gray-300 rounded-full">
                    {sourceLabel}
                  </span>
                </div>
              </div>

              {isAdmin && (
                (isPersonalConnected || isWorkspaceConnected) ? (
                  isPersonalConnected && isWorkspaceConnected ? (
                    /* Both connected — just Remove */
                    <button
                      onClick={() => setShowRemoveConfirm(true)}
                      disabled={deleteMutation.isPending}
                      className="px-4 py-2 text-sm font-medium text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer disabled:opacity-50 shrink-0 transition-colors"
                    >
                      Remove
                    </button>
                  ) : (
                    /* One side connected — Remove + option to add the other */
                    <div ref={splitRef} className="relative flex shrink-0">
                      <button
                        onClick={() => setShowRemoveConfirm(true)}
                        disabled={deleteMutation.isPending}
                        className="px-5 py-2 text-sm font-medium text-gray-800 border border-gray-300 rounded-l-lg hover:bg-gray-50 cursor-pointer disabled:opacity-50 transition-colors"
                      >
                        Remove
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setSplitOpen((o) => !o); }}
                        disabled={isBusy}
                        className="px-2 py-2 text-gray-800 border border-gray-300 border-l-gray-200 rounded-r-lg hover:bg-gray-50 cursor-pointer disabled:opacity-50 transition-colors"
                      >
                        <CaretDown size={13} weight="bold" />
                      </button>
                      {splitOpen && (
                        <div className="absolute top-full right-0 mt-1.5 bg-white rounded-xl border border-gray-200 shadow-lg z-10 min-w-44 py-1">
                          {isPersonalConnected && !isWorkspaceConnected && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setSplitOpen(false); setShowWorkspaceConfirm(true); }}
                              disabled={isBusy}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors disabled:opacity-50"
                            >
                              <User size={12} className="text-gray-500" />
                              Add as workspace
                            </button>
                          )}
                          {isWorkspaceConnected && !isPersonalConnected && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setSplitOpen(false); handlePublish("user"); }}
                              disabled={isBusy}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors disabled:opacity-50"
                            >
                              <User size={12} className="text-gray-500" />
                              Add as personal
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )
                ) : (
                  /* Not connected — Add as workspace (split) + Add as personal */
                  <div ref={splitRef} className="relative flex shrink-0">
                    <button
                      onClick={() => setShowWorkspaceConfirm(true)}
                      disabled={isBusy || publishMutation.isPending}
                      className="px-5 py-2 text-sm font-medium text-white bg-gray-900 rounded-l-lg hover:bg-gray-800 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isBusy ? "Connecting…" : "Add as workspace"}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setSplitOpen((o) => !o); }}
                      disabled={isBusy || publishMutation.isPending}
                      className="px-2 py-2 text-white bg-gray-900 rounded-r-lg hover:bg-gray-800 cursor-pointer disabled:opacity-50 border-l border-white/20 transition-colors"
                    >
                      <CaretDown size={13} weight="bold" />
                    </button>
                    {splitOpen && (
                      <div className="absolute top-full right-0 mt-1.5 bg-white rounded-xl border border-gray-200 shadow-lg z-10 min-w-40 py-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSplitOpen(false);
                            handlePublish("user");
                          }}
                          disabled={isBusy}
                          className="w-full flex items-center gap-1.5 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors disabled:opacity-50"
                        >
                          <User size={12} className="text-gray-500" />
                          Add as personal
                        </button>
                      </div>
                    )}
                  </div>
                )
              )}
            </div>

            {/* Description */}
            <p className="text-sm text-gray-700 mb-3">{entry.description}</p>

            {/* MCP trust disclaimer */}
            {isMCPEntry && (
              <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                Only use connectors from developers you trust. Von does not control which tools
                developers make available and cannot verify that they will work as intended or
                that they won't change.
              </p>
            )}

            {/* API key input (shown when not yet connected and auth requires a key) */}
            {!entry.is_connected && entry.auth_type === "api_key" && (
              <div className="mb-4 space-y-2">
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

            {error && (
              <div className="mb-4">
                <Banner variant="error" message={error} onClose={() => setError(null)} dismissible />
              </div>
            )}

            <hr className="border-gray-100 mb-5" />

            {/* Org Memory */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-sm font-semibold text-gray-900">Org Memory</h3>
                <span className="text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                  Optional
                </span>
              </div>
              <textarea
                value={orgMemory}
                onChange={(e) => setOrgMemory(e.target.value)}
                placeholder={"Help Von decide when to use this integration and what context to pull from it.\n\ne.g. Use this when users ask about [topic]. Always pull [relevant data]."}
                rows={4}
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

            {/* Tools (collapsible) */}
            {totalTools > 0 && (
              <div className="mb-5">
                <button
                  onClick={() => setToolsExpanded((v) => !v)}
                  className="w-full flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">Tools</span>
                    <span className="text-sm text-gray-500">{totalTools}</span>
                    {writeOpsCount > 0 && (
                      <span className="text-[11px] font-semibold text-orange-600 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded-full">
                        {writeOpsCount} write
                      </span>
                    )}
                  </div>
                  <CaretDown
                    size={15}
                    weight="bold"
                    className={`text-gray-400 transition-transform ${toolsExpanded ? "rotate-180" : ""}`}
                  />
                </button>
                {toolsExpanded && (
                  <div className="mt-3 space-y-2">
                    {(entry.tool_manifest ?? []).map((tool) => (
                      <div key={tool.name} className="flex items-start gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium text-gray-800">{tool.name}</span>
                            {tool.is_write && (
                              <span className="text-[10px] font-semibold text-orange-600 bg-orange-50 px-1 py-0.5 rounded">
                                write
                              </span>
                            )}
                          </div>
                          {tool.description && (
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{tool.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Details */}
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Details</h3>
            <div className="grid grid-cols-3 gap-y-4 gap-x-6 text-sm mb-4">
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Integration Type
                </p>
                <p className="text-gray-900">{isReadWrite ? "Read & Write" : "Read"}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Authentication
                </p>
                <p className="text-gray-900">{authTypeLabel}</p>
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

      {/* Enable as Workspace confirmation */}
      {showWorkspaceConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-8">
          <div className="fixed inset-0 bg-black/20" onClick={() => setShowWorkspaceConfirm(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-sm p-6 pointer-events-auto">
            <h2 className="text-base font-semibold text-gray-900 mb-2">Enable as Workspace</h2>
            <p className="text-sm text-gray-600 mb-4">
              You are enabling <strong>{entry.name}</strong> as a workspace integration.
            </p>
            {writeOpsCount > 0 && (
              <div className="flex gap-2.5 px-3 py-3 bg-orange-50 border border-orange-200 rounded-lg mb-5">
                <span className="text-orange-500 shrink-0 mt-0.5">⚠</span>
                <p className="text-sm text-orange-700 leading-snug">
                  This integration includes{" "}
                  <strong>{writeOpsCount} write operation{writeOpsCount > 1 ? "s" : ""}</strong>.
                  All writes made by any team member will be executed under the connecting
                  admin's account.
                </p>
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setShowWorkspaceConfirm(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowWorkspaceConfirm(false);
                  handlePublish("tenant");
                }}
                disabled={isBusy}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 cursor-pointer disabled:opacity-50 transition-colors"
              >
                {isBusy ? "Connecting…" : "Proceed"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove confirmation */}
      {showRemoveConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-8">
          <div className="fixed inset-0 bg-black/20" onClick={() => setShowRemoveConfirm(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-sm p-6 pointer-events-auto">
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              {isPersonalConnected && !isWorkspaceConnected
                ? "Remove Personal Integration"
                : "Remove from Workspace"}
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              {isPersonalConnected && !isWorkspaceConnected ? (
                <>
                  Are you sure you want to remove <strong>{entry.name}</strong>? Users who have
                  connected their personal accounts will be disconnected.
                </>
              ) : (
                <>
                  Are you sure you want to remove <strong>{entry.name}</strong> from workspace?
                  This will remove the workspace connection.
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
                onClick={() => { setShowRemoveConfirm(false); handleDisconnect(); }}
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
