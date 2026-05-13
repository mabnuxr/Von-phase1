import { useState, useMemo, useEffect, useRef } from "react";
import {
  MagnifyingGlassIcon,
  XIcon,
  CaretLeftIcon,
  PlugsIcon,
  ArrowSquareOutIcon,
  CaretDownIcon,
  UserIcon,
} from "@phosphor-icons/react";
import { Input, Banner } from "@vonlabs/design-components";
import {
  useAppCatalog,
  useAppTools,
  usePublishApp,
  useDeleteConnections,
  useDeleteTenantIntegration,
  useTenantIntegrations,
} from "../../hooks/useAppCatalog";

import type {
  AppCatalogEntry,
  TenantIntegrationEnriched,
} from "../../types/appCatalog";
import { useToast } from "../../hooks/useToast";
import { useUser } from "../../hooks/useUser";
import { getIntegrationLogoPath } from "../../constants/integrationMetadata";

interface ConnectorLibraryModalProps {
  onClose: () => void;
}

type SourceFilter = "all" | "von" | "mcp";

function entryCategoryCode(e: AppCatalogEntry): string {
  return e.category_code || "other";
}

function entryCategoryName(e: AppCatalogEntry): string {
  return e.category_name || "Other";
}

function isEntryBuiltByVon(e: AppCatalogEntry): boolean {
  if (e.catalog_type === "native_integration") return e.is_builtin;
  return e.author?.toLowerCase().includes("von") ?? false;
}

type TISlots = {
  workspace: TenantIntegrationEnriched | null;
  personal: TenantIntegrationEnriched | null;
};

function buildTiMap(tis: TenantIntegrationEnriched[]): Map<string, TISlots> {
  const map = new Map<string, TISlots>();
  for (const ti of tis) {
    if (!map.has(ti.catalog_id))
      map.set(ti.catalog_id, { workspace: null, personal: null });
    const slot = map.get(ti.catalog_id)!;
    if (ti.connection_mode === "workspace") slot.workspace = ti;
    else slot.personal = ti;
  }
  return map;
}

function isEntryAdded(
  e: AppCatalogEntry,
  tiMap: Map<string, TISlots>,
): boolean {
  const ti = tiMap.get(e.catalog_id);
  return (
    ti?.workspace?.availability_status === "published" ||
    ti?.personal?.availability_status === "published" ||
    false
  );
}

function getSourceLabel(e: AppCatalogEntry): string {
  return isEntryBuiltByVon(e) ? "Built by Von" : "MCP";
}

export function ConnectorLibraryModal({ onClose }: ConnectorLibraryModalProps) {
  const { user } = useUser();
  const isAdmin =
    user?.roles?.some((r) => r.toLowerCase() === "admin") ?? false;

  const { data: catalog = [], isLoading } = useAppCatalog({
    statusFilter: "all",
    includeBuiltins: true,
  });

  const { data: tenantIntegrations = [] } = useTenantIntegrations();
  const tiMap = useMemo(
    () => buildTiMap(tenantIntegrations),
    [tenantIntegrations],
  );

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [detailEntry, setDetailEntry] = useState<AppCatalogEntry | null>(null);

  const categories = useMemo(() => {
    const map = new Map<string, { name: string; count: number }>();
    catalog.forEach((e) => {
      const code = entryCategoryCode(e);
      const name = entryCategoryName(e);
      const existing = map.get(code);
      map.set(code, { name, count: (existing?.count ?? 0) + 1 });
    });
    return Array.from(map.entries()).map(([code, { name, count }]) => ({
      code,
      name,
      count,
    }));
  }, [catalog]);

  const totalCount = catalog.length;

  const filtered = useMemo(() => {
    return catalog.filter((e) => {
      if (selectedCategory && entryCategoryCode(e) !== selectedCategory)
        return false;
      if (sourceFilter === "von" && !isEntryBuiltByVon(e)) return false;
      if (sourceFilter === "mcp" && isEntryBuiltByVon(e)) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          e.name.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          entryCategoryName(e).toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [catalog, selectedCategory, sourceFilter, search]);

  if (detailEntry) {
    if (detailEntry.catalog_type === "mcp") {
      return (
        <MCPDetailView
          entry={detailEntry}
          isAdmin={isAdmin}
          onBack={() => setDetailEntry(null)}
          onClose={onClose}
        />
      );
    }
    return (
      <NativeDetailView
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
                <XIcon size={20} />
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
                  <MagnifyingGlassIcon
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
                    tiMap={tiMap}
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

/* ─── App Library Grid ─── */
function AppLibraryGrid({
  entries,
  tiMap,
  onSelect,
}: {
  entries: AppCatalogEntry[];
  tiMap: Map<string, TISlots>;
  selectedCategory: string | null;
  categories: { code: string; name: string }[];
  onSelect: (entry: AppCatalogEntry) => void;
}) {
  const added = entries.filter((e) => isEntryAdded(e, tiMap));
  const rest = entries.filter((e) => !isEntryAdded(e, tiMap));

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
                key={`${entry.catalog_type}-${entry.catalog_id}`}
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
                key={`${entry.catalog_type}-${entry.catalog_id}`}
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
  entry: AppCatalogEntry;
  isAdded?: boolean;
  onClick: () => void;
}) {
  const sourceLabel = getSourceLabel(entry);
  const logoUrl =
    entry.logo_url ??
    (entry.catalog_type === "native_integration" && entry.integration_type
      ? getIntegrationLogoPath(entry.integration_type)
      : null);

  return (
    <div
      onClick={onClick}
      className="border border-gray-200 rounded-xl p-4 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer flex gap-3"
    >
      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
        {logoUrl ? (
          <img src={logoUrl} alt="" className="w-10 h-10 object-contain" />
        ) : (
          <PlugsIcon size={18} className="text-gray-400" />
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

/* ─── Native Integration Detail View ─── */
function NativeDetailView({
  entry,
  isAdmin,
  onBack,
  onClose,
}: {
  entry: AppCatalogEntry;
  isAdmin: boolean;
  onBack: () => void;
  onClose: () => void;
}) {
  const { data: tenantIntegrations = [] } = useTenantIntegrations();
  const tiEntry = useMemo(() => {
    const slots: TISlots = { workspace: null, personal: null };
    for (const ti of tenantIntegrations) {
      if (ti.catalog_id !== entry.catalog_id) continue;
      if (ti.connection_mode === "workspace") slots.workspace = ti;
      else slots.personal = ti;
    }
    return slots;
  }, [tenantIntegrations, entry.catalog_id]);

  const publishMutation = usePublishApp();
  const deleteConnectionsMutation = useDeleteConnections();
  const deleteMutation = useDeleteTenantIntegration();
  const { showToast } = useToast();

  const [error, setError] = useState<string | null>(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState<
    "workspace" | "personal" | null
  >(null);
  const [showPublishConfirm, setShowPublishConfirm] = useState<
    "workspace" | "personal" | null
  >(null);
  const [splitOpen, setSplitOpen] = useState(false);
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

  const isWorkspacePublished =
    tiEntry.workspace?.availability_status === "published";
  const isPersonalPublished =
    tiEntry.personal?.availability_status === "published";
  const isWorkspaceConnected = isWorkspacePublished;
  const isPersonalConnected = isPersonalPublished;
  const isAdded = isWorkspacePublished || isPersonalPublished;
  const isBusy =
    publishMutation.isPending ||
    deleteConnectionsMutation.isPending ||
    deleteMutation.isPending;
  const logoUrl =
    entry.logo_url ??
    (entry.integration_type
      ? getIntegrationLogoPath(entry.integration_type)
      : null);

  const authTypeLabel =
    entry.auth_type === "oauth2"
      ? "OAuth"
      : entry.auth_type === "api_key"
        ? "API Key"
        : entry.auth_type === "token"
          ? "Token"
          : "None";

  const hasWorkspaceLevel = entry.allowed_access_levels.includes("workspace");
  const hasPersonalLevel = entry.allowed_access_levels.includes("personal");

  const handlePublish = async (mode: "workspace" | "personal") => {
    setError(null);
    const oppositeMode = mode === "workspace" ? "personal" : "workspace";
    const isOppositePublished =
      mode === "workspace" ? isPersonalPublished : isWorkspacePublished;
    try {
      // Switching access level: cascade-delete existing credentials + archive the opposite TI first
      if (isOppositePublished) {
        await deleteConnectionsMutation.mutateAsync(entry.catalog_id);
        await deleteMutation.mutateAsync({
          catalogId: entry.catalog_id,
          catalogType: "native_integration",
          connectionMode: oppositeMode,
        });
      }
      await publishMutation.mutateAsync({
        catalogId: entry.catalog_id,
        payload: {
          catalog_type: "native_integration",
          connection_mode: mode,
          availability_status: "published",
        },
      });
      showToast({
        message: `${entry.name} added to ${mode}`,
        variant: "success",
      });
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : "Failed to publish";
      setError(msg);
    }
  };

  const handleRemove = async (mode: "workspace" | "personal") => {
    setError(null);
    try {
      await deleteConnectionsMutation.mutateAsync(entry.catalog_id);
      await deleteMutation.mutateAsync({
        catalogId: entry.catalog_id,
        catalogType: "native_integration",
        connectionMode: mode,
      });
      showToast({
        message: `${entry.name} ${mode} removed`,
        variant: "success",
      });
      // Go back only if the other mode is also gone; otherwise stay to show the remaining entry
      if (mode === "workspace" ? !isPersonalPublished : !isWorkspacePublished)
        onBack();
    } catch {
      setError("Failed to remove. Please try again.");
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
              <CaretLeftIcon size={14} weight="bold" />
              Back
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 cursor-pointer p-1"
            >
              <XIcon size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {/* Header */}
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt=""
                      className="w-16 h-16 object-contain"
                    />
                  ) : (
                    <PlugsIcon size={28} className="text-gray-400" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {entry.name}
                  </h2>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span className="text-sm text-gray-500">
                      {entry.category_name}
                    </span>
                    {isWorkspaceConnected && (
                      <>
                        <span className="text-sm text-gray-400">·</span>
                        <span className="text-sm font-semibold text-purple-600">
                          Workspace
                        </span>
                      </>
                    )}
                    {isPersonalConnected && (
                      <>
                        <span className="text-sm text-gray-400">·</span>
                        <span className="text-sm font-semibold text-blue-600">
                          Personal
                        </span>
                      </>
                    )}
                    {isWorkspacePublished && !isWorkspaceConnected && (
                      <>
                        <span className="text-sm text-gray-400">·</span>
                        <span className="text-sm font-semibold text-green-600">
                          Workspace
                        </span>
                      </>
                    )}
                    {isPersonalPublished && !isPersonalConnected && (
                      <>
                        <span className="text-sm text-gray-400">·</span>
                        <span className="text-sm font-semibold text-green-600">
                          Personal
                        </span>
                      </>
                    )}
                  </div>
                  <span className="inline-block mt-1.5 px-2 py-0.5 text-[11px] font-medium text-gray-600 border border-gray-300 rounded-full">
                    Built by Von
                  </span>
                </div>
              </div>

              {isAdmin &&
                (isWorkspacePublished && isPersonalPublished ? (
                  /* Both published — split remove */
                  <div ref={splitRef} className="relative flex shrink-0">
                    <button
                      onClick={() => setShowRemoveConfirm("workspace")}
                      disabled={isBusy}
                      className="px-4 py-2 text-sm font-medium text-gray-800 border border-gray-300 rounded-l-lg hover:bg-gray-50 cursor-pointer disabled:opacity-50 transition-colors"
                    >
                      Remove workspace
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSplitOpen((o) => !o);
                      }}
                      disabled={isBusy}
                      className="px-2 py-2 text-gray-800 border border-gray-300 border-l-gray-200 rounded-r-lg hover:bg-gray-50 cursor-pointer disabled:opacity-50 transition-colors"
                    >
                      <CaretDownIcon size={13} weight="bold" />
                    </button>
                    {splitOpen && (
                      <div className="absolute top-full right-0 mt-1.5 bg-white rounded-xl border border-gray-200 shadow-lg z-10 min-w-44 py-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSplitOpen(false);
                            setShowRemoveConfirm("personal");
                          }}
                          disabled={isBusy}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors disabled:opacity-50"
                        >
                          Remove personal
                        </button>
                      </div>
                    )}
                  </div>
                ) : isWorkspacePublished ? (
                  /* Only workspace published */
                  hasPersonalLevel ? (
                    <div ref={splitRef} className="relative flex shrink-0">
                      <button
                        onClick={() => setShowRemoveConfirm("workspace")}
                        disabled={isBusy}
                        className="px-4 py-2 text-sm font-medium text-gray-800 border border-gray-300 rounded-l-lg hover:bg-gray-50 cursor-pointer disabled:opacity-50 transition-colors"
                      >
                        Remove
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSplitOpen((o) => !o);
                        }}
                        disabled={isBusy}
                        className="px-2 py-2 text-gray-800 border border-gray-300 border-l-gray-200 rounded-r-lg hover:bg-gray-50 cursor-pointer disabled:opacity-50 transition-colors"
                      >
                        <CaretDownIcon size={13} weight="bold" />
                      </button>
                      {splitOpen && (
                        <div className="absolute top-full right-0 mt-1.5 bg-white rounded-xl border border-gray-200 shadow-lg z-10 min-w-44 py-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSplitOpen(false);
                              setShowPublishConfirm("personal");
                            }}
                            disabled={isBusy}
                            className="w-full flex items-center gap-1.5 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors disabled:opacity-50"
                          >
                            <UserIcon size={12} className="text-gray-500" />
                            Add as personal
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowRemoveConfirm("workspace")}
                      disabled={isBusy}
                      className="px-4 py-2 text-sm font-medium text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer disabled:opacity-50 shrink-0 transition-colors"
                    >
                      Remove
                    </button>
                  )
                ) : isPersonalPublished ? (
                  /* Only personal published */
                  hasWorkspaceLevel ? (
                    <div ref={splitRef} className="relative flex shrink-0">
                      <button
                        onClick={() => setShowRemoveConfirm("personal")}
                        disabled={isBusy}
                        className="px-4 py-2 text-sm font-medium text-gray-800 border border-gray-300 rounded-l-lg hover:bg-gray-50 cursor-pointer disabled:opacity-50 transition-colors"
                      >
                        Remove
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSplitOpen((o) => !o);
                        }}
                        disabled={isBusy}
                        className="px-2 py-2 text-gray-800 border border-gray-300 border-l-gray-200 rounded-r-lg hover:bg-gray-50 cursor-pointer disabled:opacity-50 transition-colors"
                      >
                        <CaretDownIcon size={13} weight="bold" />
                      </button>
                      {splitOpen && (
                        <div className="absolute top-full right-0 mt-1.5 bg-white rounded-xl border border-gray-200 shadow-lg z-10 min-w-44 py-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSplitOpen(false);
                              setShowPublishConfirm("workspace");
                            }}
                            disabled={isBusy}
                            className="w-full flex items-center gap-1.5 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors disabled:opacity-50"
                          >
                            Add as workspace
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowRemoveConfirm("personal")}
                      disabled={isBusy}
                      className="px-4 py-2 text-sm font-medium text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer disabled:opacity-50 shrink-0 transition-colors"
                    >
                      Remove
                    </button>
                  )
                ) : isAdded ? (
                  /* Connected but not yet published */
                  <span className="px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg shrink-0">
                    Connected
                  </span>
                ) : hasWorkspaceLevel && hasPersonalLevel ? (
                  /* Both levels — split button */
                  <div ref={splitRef} className="relative flex shrink-0">
                    <button
                      onClick={() => setShowPublishConfirm("workspace")}
                      disabled={isBusy}
                      className="px-5 py-2 text-sm font-medium text-white bg-gray-900 rounded-l-lg hover:bg-gray-800 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isBusy ? "Adding…" : "Add as workspace"}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSplitOpen((o) => !o);
                      }}
                      disabled={isBusy}
                      className="px-2 py-2 text-white bg-gray-900 rounded-r-lg hover:bg-gray-800 cursor-pointer disabled:opacity-50 border-l border-white/20 transition-colors"
                    >
                      <CaretDownIcon size={13} weight="bold" />
                    </button>
                    {splitOpen && (
                      <div className="absolute top-full right-0 mt-1.5 bg-white rounded-xl border border-gray-200 shadow-lg z-10 min-w-40 py-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSplitOpen(false);
                            setShowPublishConfirm("personal");
                          }}
                          disabled={isBusy}
                          className="w-full flex items-center gap-1.5 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors disabled:opacity-50"
                        >
                          <UserIcon size={12} className="text-gray-500" />
                          Add as personal
                        </button>
                      </div>
                    )}
                  </div>
                ) : hasWorkspaceLevel ? (
                  <button
                    onClick={() => setShowPublishConfirm("workspace")}
                    disabled={isBusy}
                    className="px-5 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 cursor-pointer disabled:opacity-50 transition-colors shrink-0"
                  >
                    {isBusy ? "Adding…" : "Add as workspace"}
                  </button>
                ) : (
                  <button
                    onClick={() => setShowPublishConfirm("personal")}
                    disabled={isBusy}
                    className="px-5 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 cursor-pointer disabled:opacity-50 transition-colors shrink-0"
                  >
                    {isBusy ? "Adding…" : "Add as personal"}
                  </button>
                ))}
            </div>

            {/* Description */}
            <p className="text-sm text-gray-700 mb-3">{entry.description}</p>

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
            <div className="grid grid-cols-3 gap-y-4 gap-x-6 text-sm mb-4">
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Integration Type
                </p>
                <p className="text-gray-900">{entry.category_name}</p>
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
                    <ArrowSquareOutIcon size={12} className="text-gray-400" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Publish confirmation */}
      {showPublishConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-8">
          <div
            className="fixed inset-0 bg-black/20"
            onClick={() => setShowPublishConfirm(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-sm p-6 pointer-events-auto">
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              Add as{" "}
              {showPublishConfirm === "workspace" ? "Workspace" : "Personal"}
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              You are adding <strong>{entry.name}</strong> as a{" "}
              {showPublishConfirm === "workspace" ? "workspace" : "personal"}{" "}
              integration.{" "}
              {showPublishConfirm === "workspace"
                ? "All workspace members will be able to use it."
                : "Members will be able to connect their personal accounts."}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPublishConfirm(null)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const mode = showPublishConfirm;
                  setShowPublishConfirm(null);
                  handlePublish(mode);
                }}
                disabled={isBusy}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 cursor-pointer disabled:opacity-50 transition-colors"
              >
                {isBusy ? "Adding…" : "Proceed"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove confirmation */}
      {showRemoveConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-8">
          <div
            className="fixed inset-0 bg-black/20"
            onClick={() => setShowRemoveConfirm(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-sm p-6 pointer-events-auto">
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              Remove{" "}
              {showRemoveConfirm === "workspace" ? "Workspace" : "Personal"}{" "}
              Integration
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to remove <strong>{entry.name}</strong>{" "}
              {showRemoveConfirm === "workspace"
                ? "from the workspace? Members will no longer have access."
                : "as a personal integration? Members will no longer be able to connect their personal accounts."}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowRemoveConfirm(null)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const mode = showRemoveConfirm;
                  setShowRemoveConfirm(null);
                  handleRemove(mode);
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

/* ─── MCP Detail View ─── */
function MCPDetailView({
  entry,
  isAdmin,
  onBack,
  onClose,
}: {
  entry: AppCatalogEntry;
  isAdmin: boolean;
  onBack: () => void;
  onClose: () => void;
}) {
  const { data: tenantIntegrations = [] } = useTenantIntegrations();
  const tiEntry = useMemo(() => {
    const slots: TISlots = { workspace: null, personal: null };
    for (const ti of tenantIntegrations) {
      if (ti.catalog_id !== entry.catalog_id) continue;
      if (ti.connection_mode === "workspace") slots.workspace = ti;
      else slots.personal = ti;
    }
    return slots;
  }, [tenantIntegrations, entry.catalog_id]);

  const publishMutation = usePublishApp();
  const deleteConnectionsMutation = useDeleteConnections();
  const deleteMutation = useDeleteTenantIntegration();
  const { data: tools = [] } = useAppTools(entry.catalog_id, "catalog");
  const { showToast } = useToast();

  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState<
    "workspace" | "personal" | null
  >(null);
  const [showWorkspaceConfirm, setShowWorkspaceConfirm] = useState(false);
  const [toolsExpanded, setToolsExpanded] = useState(false);
  const [splitOpen, setSplitOpen] = useState(false);
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

  const isBusy =
    publishMutation.isPending ||
    deleteConnectionsMutation.isPending ||
    deleteMutation.isPending;

  const hasWorkspaceLevel = entry.allowed_access_levels.includes("workspace");
  const hasPersonalLevel = entry.allowed_access_levels.includes("personal");

  const sourceLabel = isEntryBuiltByVon(entry) ? "Built by Von" : "MCP";

  const isWorkspacePublished =
    tiEntry.workspace?.availability_status === "published";
  const isPersonalPublished =
    tiEntry.personal?.availability_status === "published";
  const isWorkspaceConnected = isWorkspacePublished;
  const isPersonalConnected = isPersonalPublished;
  const isAdded = isWorkspacePublished || isPersonalPublished;

  const authTypeLabel =
    entry.auth_type === "oauth2"
      ? "OAuth"
      : entry.auth_type === "api_key"
        ? "API Key"
        : "None";

  const writeOpsCount = tools.filter((t) => t.is_write).length;
  const totalTools = tools.length;
  const isReadWrite = writeOpsCount > 0;

  const handlePublish = async (mode: "workspace" | "personal") => {
    setError(null);
    const oppositeMode = mode === "workspace" ? "personal" : "workspace";
    const isOppositePublished =
      mode === "workspace" ? isPersonalPublished : isWorkspacePublished;
    try {
      // Switching access level: cascade-delete existing credentials + archive the opposite TI first
      if (isOppositePublished) {
        await deleteConnectionsMutation.mutateAsync(entry.catalog_id);
        await deleteMutation.mutateAsync({
          catalogId: entry.catalog_id,
          catalogType: "mcp",
          connectionMode: oppositeMode,
        });
      }
      await publishMutation.mutateAsync({
        catalogId: entry.catalog_id,
        payload: {
          catalog_type: "mcp",
          connection_mode: mode,
          availability_status: "published",
        },
      });
      showToast({
        message:
          mode === "workspace"
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

  const handleRemove = async (mode: "workspace" | "personal") => {
    setError(null);
    try {
      await deleteConnectionsMutation.mutateAsync(entry.catalog_id);
      await deleteMutation.mutateAsync({
        catalogId: entry.catalog_id,
        catalogType: "mcp",
        connectionMode: mode,
      });
      showToast({ message: `${entry.name} removed`, variant: "success" });
      if (mode === "workspace" ? !isPersonalPublished : !isWorkspacePublished)
        onBack();
    } catch {
      setError("Failed to remove. Please try again.");
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
              <CaretLeftIcon size={14} weight="bold" />
              Back
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 cursor-pointer p-1"
            >
              <XIcon size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {/* Header */}
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                  {entry.logo_url ? (
                    <img
                      src={entry.logo_url}
                      alt=""
                      className="w-16 h-16 object-contain"
                    />
                  ) : (
                    <PlugsIcon size={28} className="text-gray-400" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {entry.name}
                  </h2>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-sm text-gray-500">
                      {entry.category_name}
                    </span>
                    {isPersonalConnected && (
                      <>
                        <span className="text-sm text-gray-400">·</span>
                        <span className="text-sm font-semibold text-blue-600">
                          Personal
                        </span>
                      </>
                    )}
                    {isWorkspaceConnected && (
                      <>
                        <span className="text-sm text-gray-400">·</span>
                        <span className="text-sm font-semibold text-purple-600">
                          Workspace
                        </span>
                      </>
                    )}
                  </div>
                  <span className="inline-block mt-1.5 px-2 py-0.5 text-[11px] font-medium text-gray-600 border border-gray-300 rounded-full">
                    {sourceLabel}
                  </span>
                </div>
              </div>

              {isAdmin &&
                (isWorkspacePublished && isPersonalPublished ? (
                  /* Both published — split remove */
                  <div ref={splitRef} className="relative flex shrink-0">
                    <button
                      onClick={() => setShowRemoveConfirm("workspace")}
                      disabled={isBusy}
                      className="px-4 py-2 text-sm font-medium text-gray-800 border border-gray-300 rounded-l-lg hover:bg-gray-50 cursor-pointer disabled:opacity-50 transition-colors"
                    >
                      Remove workspace
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSplitOpen((o) => !o);
                      }}
                      disabled={isBusy}
                      className="px-2 py-2 text-gray-800 border border-gray-300 border-l-gray-200 rounded-r-lg hover:bg-gray-50 cursor-pointer disabled:opacity-50 transition-colors"
                    >
                      <CaretDownIcon size={13} weight="bold" />
                    </button>
                    {splitOpen && (
                      <div className="absolute top-full right-0 mt-1.5 bg-white rounded-xl border border-gray-200 shadow-lg z-10 min-w-44 py-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSplitOpen(false);
                            setShowRemoveConfirm("personal");
                          }}
                          disabled={isBusy}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors disabled:opacity-50"
                        >
                          Remove personal
                        </button>
                      </div>
                    )}
                  </div>
                ) : isWorkspacePublished ? (
                  /* Only workspace published */
                  hasPersonalLevel ? (
                    <div ref={splitRef} className="relative flex shrink-0">
                      <button
                        onClick={() => setShowRemoveConfirm("workspace")}
                        disabled={isBusy}
                        className="px-4 py-2 text-sm font-medium text-gray-800 border border-gray-300 rounded-l-lg hover:bg-gray-50 cursor-pointer disabled:opacity-50 transition-colors"
                      >
                        Remove
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSplitOpen((o) => !o);
                        }}
                        disabled={isBusy}
                        className="px-2 py-2 text-gray-800 border border-gray-300 border-l-gray-200 rounded-r-lg hover:bg-gray-50 cursor-pointer disabled:opacity-50 transition-colors"
                      >
                        <CaretDownIcon size={13} weight="bold" />
                      </button>
                      {splitOpen && (
                        <div className="absolute top-full right-0 mt-1.5 bg-white rounded-xl border border-gray-200 shadow-lg z-10 min-w-44 py-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSplitOpen(false);
                              handlePublish("personal");
                            }}
                            disabled={isBusy}
                            className="w-full flex items-center gap-1.5 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors disabled:opacity-50"
                          >
                            <UserIcon size={12} className="text-gray-500" />
                            Add as personal
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowRemoveConfirm("workspace")}
                      disabled={isBusy}
                      className="px-4 py-2 text-sm font-medium text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer disabled:opacity-50 shrink-0 transition-colors"
                    >
                      Remove
                    </button>
                  )
                ) : isPersonalPublished ? (
                  /* Only personal published */
                  hasWorkspaceLevel ? (
                    <div ref={splitRef} className="relative flex shrink-0">
                      <button
                        onClick={() => setShowRemoveConfirm("personal")}
                        disabled={isBusy}
                        className="px-4 py-2 text-sm font-medium text-gray-800 border border-gray-300 rounded-l-lg hover:bg-gray-50 cursor-pointer disabled:opacity-50 transition-colors"
                      >
                        Remove
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSplitOpen((o) => !o);
                        }}
                        disabled={isBusy}
                        className="px-2 py-2 text-gray-800 border border-gray-300 border-l-gray-200 rounded-r-lg hover:bg-gray-50 cursor-pointer disabled:opacity-50 transition-colors"
                      >
                        <CaretDownIcon size={13} weight="bold" />
                      </button>
                      {splitOpen && (
                        <div className="absolute top-full right-0 mt-1.5 bg-white rounded-xl border border-gray-200 shadow-lg z-10 min-w-44 py-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSplitOpen(false);
                              setShowWorkspaceConfirm(true);
                            }}
                            disabled={isBusy}
                            className="w-full flex items-center gap-1.5 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors disabled:opacity-50"
                          >
                            Add as workspace
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowRemoveConfirm("personal")}
                      disabled={isBusy}
                      className="px-4 py-2 text-sm font-medium text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer disabled:opacity-50 shrink-0 transition-colors"
                    >
                      Remove
                    </button>
                  )
                ) : isAdded ? (
                  /* Connected but not published */
                  <span className="px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg shrink-0">
                    Connected
                  </span>
                ) : hasWorkspaceLevel && hasPersonalLevel ? (
                  /* Both levels — split button */
                  <div ref={splitRef} className="relative flex shrink-0">
                    <button
                      onClick={() => setShowWorkspaceConfirm(true)}
                      disabled={isBusy}
                      className="px-5 py-2 text-sm font-medium text-white bg-gray-900 rounded-l-lg hover:bg-gray-800 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isBusy ? "Adding…" : "Add as workspace"}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSplitOpen((o) => !o);
                      }}
                      disabled={isBusy}
                      className="px-2 py-2 text-white bg-gray-900 rounded-r-lg hover:bg-gray-800 cursor-pointer disabled:opacity-50 border-l border-white/20 transition-colors"
                    >
                      <CaretDownIcon size={13} weight="bold" />
                    </button>
                    {splitOpen && (
                      <div className="absolute top-full right-0 mt-1.5 bg-white rounded-xl border border-gray-200 shadow-lg z-10 min-w-40 py-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSplitOpen(false);
                            handlePublish("personal");
                          }}
                          disabled={isBusy}
                          className="w-full flex items-center gap-1.5 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors disabled:opacity-50"
                        >
                          <UserIcon size={12} className="text-gray-500" />
                          Add as personal
                        </button>
                      </div>
                    )}
                  </div>
                ) : hasWorkspaceLevel ? (
                  <button
                    onClick={() => setShowWorkspaceConfirm(true)}
                    disabled={isBusy}
                    className="px-5 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 cursor-pointer disabled:opacity-50 transition-colors shrink-0"
                  >
                    {isBusy ? "Adding…" : "Add as workspace"}
                  </button>
                ) : (
                  <button
                    onClick={() => handlePublish("personal")}
                    disabled={isBusy}
                    className="px-5 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 cursor-pointer disabled:opacity-50 transition-colors shrink-0"
                  >
                    {isBusy ? "Adding…" : "Add as personal"}
                  </button>
                ))}
            </div>

            {/* Description */}
            <p className="text-sm text-gray-700 mb-3">{entry.description}</p>

            {/* MCP trust disclaimer */}
            {!isEntryBuiltByVon(entry) && (
              <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                Only use connectors from developers you trust. Von does not
                control which tools developers make available and cannot verify
                that they will work as intended or that they won't change.
              </p>
            )}

            {/* API key input (shown when not yet added and auth requires a key) */}
            {!isAdded && entry.auth_type === "api_key" && (
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
                <Banner
                  variant="error"
                  message={error}
                  onClose={() => setError(null)}
                  dismissible
                />
              </div>
            )}

            {/* Tools (collapsible) */}
            {totalTools > 0 && (
              <div className="mb-5">
                <button
                  onClick={() => setToolsExpanded((v) => !v)}
                  className="w-full flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">
                      Tools
                    </span>
                    <span className="text-sm text-gray-500">{totalTools}</span>
                    {writeOpsCount > 0 && (
                      <span className="text-[11px] font-semibold text-orange-600 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded-full">
                        {writeOpsCount} write
                      </span>
                    )}
                  </div>
                  <CaretDownIcon
                    size={15}
                    weight="bold"
                    className={`text-gray-400 transition-transform ${toolsExpanded ? "rotate-180" : ""}`}
                  />
                </button>
                {toolsExpanded && (
                  <div className="mt-3 space-y-2">
                    {tools.map((tool) => (
                      <div
                        key={tool.name}
                        className="flex items-start gap-2 px-3 py-2 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium text-gray-800">
                              {tool.name}
                            </span>
                            {tool.is_write && (
                              <span className="text-[10px] font-semibold text-orange-600 bg-orange-50 px-1 py-0.5 rounded">
                                write
                              </span>
                            )}
                          </div>
                          {tool.description && (
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                              {tool.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Details */}
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Details
            </h3>
            <div className="grid grid-cols-3 gap-y-4 gap-x-6 text-sm mb-4">
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Integration Type
                </p>
                <p className="text-gray-900">
                  {isReadWrite ? "Read & Write" : "Read"}
                </p>
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
                    <ArrowSquareOutIcon size={12} className="text-gray-400" />
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
          <div
            className="fixed inset-0 bg-black/20"
            onClick={() => setShowWorkspaceConfirm(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-sm p-6 pointer-events-auto">
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              Add as Workspace
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              You are enabling <strong>{entry.name}</strong> as a workspace
              integration.
            </p>
            {writeOpsCount > 0 && (
              <div className="flex gap-2.5 px-3 py-3 bg-orange-50 border border-orange-200 rounded-lg mb-5">
                <span className="text-orange-500 shrink-0 mt-0.5">⚠</span>
                <p className="text-sm text-orange-700 leading-snug">
                  This integration includes{" "}
                  <strong>
                    {writeOpsCount} write operation
                    {writeOpsCount > 1 ? "s" : ""}
                  </strong>
                  . All writes made by any team member will be executed under
                  the connecting admin's account.
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
                  handlePublish("workspace");
                }}
                disabled={isBusy}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 cursor-pointer disabled:opacity-50 transition-colors"
              >
                {isBusy ? "Adding…" : "Proceed"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove confirmation */}
      {showRemoveConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-8">
          <div
            className="fixed inset-0 bg-black/20"
            onClick={() => setShowRemoveConfirm(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-sm p-6 pointer-events-auto">
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              {showRemoveConfirm === "personal"
                ? "Remove Personal Integration"
                : "Remove from Workspace"}
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to remove <strong>{entry.name}</strong>{" "}
              {showRemoveConfirm === "personal"
                ? "? Users who have connected their personal accounts will be disconnected."
                : "from workspace? This will remove the workspace connection."}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowRemoveConfirm(null)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const mode = showRemoveConfirm;
                  setShowRemoveConfirm(null);
                  handleRemove(mode);
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
