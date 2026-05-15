import { useState, useMemo, useEffect } from "react";
import {
  MagnifyingGlassIcon,
  XIcon,
  CaretLeftIcon,
  PlugsIcon,
  ArrowSquareOutIcon,
  CaretDownIcon,
} from "@phosphor-icons/react";
import { Banner } from "@vonlabs/design-components";
import {
  useAppCatalogInfinite,
  useAppTools,
  usePublishApp,
  useDeleteConnections,
  useDeleteTenantIntegration,
  useTenantIntegrations,
} from "../../hooks/useAppCatalog";
import { useInfiniteScroll } from "../../hooks/useInfiniteScroll";

import type {
  AppCatalogEntry,
  TenantIntegrationEnriched,
} from "../../types/appCatalog";
import { useToast } from "../../hooks/useToast";
import { useUser } from "../../hooks/useUser";
import { useFeatureFlag } from "../../hooks/useFeatureFlag";
import { getIntegrationLogoPath } from "../../constants/integrationMetadata";

interface ConnectorLibraryModalProps {
  onClose: () => void;
}

function entryCategoryCode(e: AppCatalogEntry): string {
  return e.category_code || "other";
}

function entryCategoryName(e: AppCatalogEntry): string {
  return e.category_name || "Other";
}

function isEntryBuiltByVon(e: AppCatalogEntry): boolean {
  return e.catalog_type === "native_integration" && e.is_builtin;
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
  const { isSlackMcpEnabled } = useFeatureFlag();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [detailEntry, setDetailEntry] = useState<AppCatalogEntry | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const {
    data: catalogData,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useAppCatalogInfinite({
    statusFilter: "all",
    includeBuiltins: true,
    pageSize: 100,
    search: debouncedSearch || undefined,
  });
  const catalog = useMemo(() => {
    const items = catalogData?.items;
    const safe = Array.isArray(items) ? items : [];
    if (isSlackMcpEnabled) return safe;
    return safe.filter((e) => e.name.toLowerCase() !== "slack");
  }, [catalogData, isSlackMcpEnabled]);

  const loadMoreRef = useInfiniteScroll({
    onLoadMore: fetchNextPage,
    hasMore: !!hasNextPage,
    isLoading: isFetchingNextPage,
  });

  const { data: tenantIntegrationsRaw } = useTenantIntegrations();
  const tenantIntegrations = useMemo(
    () => (Array.isArray(tenantIntegrationsRaw) ? tenantIntegrationsRaw : []),
    [tenantIntegrationsRaw],
  );
  const tiMap = useMemo(
    () => buildTiMap(tenantIntegrations),
    [tenantIntegrations],
  );

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

  const filtered = useMemo(() => {
    if (!selectedCategory) return catalog;
    return catalog.filter((e) => entryCategoryCode(e) === selectedCategory);
  }, [catalog, selectedCategory]);

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
                  Manage Integrations
                </h2>
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
                <span>All</span>
                <span className="text-xs text-gray-400">{catalog.length}</span>
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
                  <>
                    <AppLibraryGrid
                      entries={filtered}
                      tiMap={tiMap}
                      selectedCategory={selectedCategory}
                      categories={categories}
                      onSelect={(entry) => setDetailEntry(entry)}
                    />
                    <div ref={loadMoreRef} className="h-1" />
                    {isFetchingNextPage && (
                      <div className="flex justify-center py-4 text-sm text-gray-400">
                        Loading more...
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── Proceed Confirm Modal ─── */
function ProceedConfirmModal({
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [input, setInput] = useState("");
  const canProceed = input.trim().toUpperCase() === "PROCEED";
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div
        className="relative bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-md p-6 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="shrink-0 mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
            <svg
              className="size-4 text-gray-700"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            Type{" "}
            <span className="font-mono font-semibold text-gray-900">
              PROCEED
            </span>{" "}
            to confirm
          </label>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoFocus
            placeholder="PROCEED"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent font-mono"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!canProceed}
            className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
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
  const sorted = [...entries].sort((a, b) => {
    const aAdded = isEntryAdded(a, tiMap) ? 0 : 1;
    const bAdded = isEntryAdded(b, tiMap) ? 0 : 1;
    return aAdded - bAdded;
  });

  return (
    <div className="grid grid-cols-2 gap-3">
      {sorted.map((entry) => (
        <AppCard
          key={`${entry.catalog_type}-${entry.catalog_id}`}
          entry={entry}
          isAdded={isEntryAdded(entry, tiMap)}
          onClick={() => onSelect(entry)}
        />
      ))}
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
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden ${!logoUrl ? "bg-gray-100" : ""}`}
      >
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
              Enabled
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400">{sourceLabel}</p>
        <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">
          {entry.short_description ?? entry.description}
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
  const [switchConfirmMode, setSwitchConfirmMode] = useState<
    "workspace" | "personal" | null
  >(null);

  const isWorkspacePublished =
    tiEntry.workspace?.availability_status === "published";
  const isPersonalPublished =
    tiEntry.personal?.availability_status === "published";

  const [selectedMode, setSelectedMode] = useState<
    "workspace" | "personal" | null
  >(
    isWorkspacePublished
      ? "workspace"
      : isPersonalPublished
        ? "personal"
        : null,
  );
  useEffect(() => {
    setSelectedMode(
      isWorkspacePublished
        ? "workspace"
        : isPersonalPublished
          ? "personal"
          : null,
    );
  }, [isWorkspacePublished, isPersonalPublished]);
  const isWorkspaceConnected = isWorkspacePublished;
  const isPersonalConnected = isPersonalPublished;
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

  const executePublish = async (mode: "workspace" | "personal") => {
    setError(null);
    const oppositeMode = mode === "workspace" ? "personal" : "workspace";
    const isOppositePublished =
      mode === "workspace" ? isPersonalPublished : isWorkspacePublished;
    try {
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

  const handlePublish = (mode: "workspace" | "personal") => {
    const isOppositePublished =
      mode === "workspace" ? isPersonalPublished : isWorkspacePublished;
    if (isOppositePublished) {
      setSwitchConfirmMode(mode);
      return;
    }
    executePublish(mode);
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
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden shrink-0 ${!logoUrl ? "bg-gray-100" : ""}`}
                >
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

              {isAdmin && (hasWorkspaceLevel || hasPersonalLevel) && (
                <div className="flex items-center gap-2 shrink-0">
                  {hasWorkspaceLevel && hasPersonalLevel && (
                    <span className="text-sm text-gray-400">Set as</span>
                  )}
                  {hasWorkspaceLevel && (
                    <button
                      onClick={() => setSelectedMode("workspace")}
                      disabled={isBusy}
                      className={`px-3 py-1.5 text-sm rounded-lg border transition-colors cursor-pointer disabled:opacity-50 ${
                        isWorkspacePublished || selectedMode === "workspace"
                          ? "border-purple-400 text-purple-600 font-semibold bg-purple-50"
                          : "border-gray-300 text-gray-500 hover:border-gray-400"
                      }`}
                    >
                      Workspace
                    </button>
                  )}
                  {hasPersonalLevel && (
                    <button
                      onClick={() => setSelectedMode("personal")}
                      disabled={isBusy}
                      className={`px-3 py-1.5 text-sm rounded-lg border transition-colors cursor-pointer disabled:opacity-50 ${
                        isPersonalPublished || selectedMode === "personal"
                          ? "border-blue-400 text-blue-600 font-semibold bg-blue-50"
                          : "border-gray-300 text-gray-500 hover:border-gray-400"
                      }`}
                    >
                      Personal
                    </button>
                  )}
                  {selectedMode ? (
                    (
                      selectedMode === "workspace"
                        ? isWorkspacePublished
                        : isPersonalPublished
                    ) ? (
                      <button
                        onClick={() => setShowRemoveConfirm(selectedMode)}
                        disabled={isBusy}
                        className="px-3 py-1.5 text-sm font-medium text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        Remove
                      </button>
                    ) : (
                      <button
                        onClick={() => handlePublish(selectedMode)}
                        disabled={isBusy}
                        className="px-4 py-1.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {isBusy ? "Adding…" : "Add"}
                      </button>
                    )
                  ) : (
                    <button
                      disabled
                      className="px-4 py-1.5 text-sm font-medium text-gray-300 bg-gray-100 rounded-lg cursor-not-allowed"
                    >
                      Add
                    </button>
                  )}
                </div>
              )}
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
                <p className="text-gray-900">
                  {entry.integration_type ?? "Read & Write"}
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
        </div>
      </div>

      {showRemoveConfirm && (
        <ProceedConfirmModal
          title={`Remove ${showRemoveConfirm === "workspace" ? "Workspace" : "Personal"} Integration`}
          description={
            <>
              Are you sure you want to remove <strong>{entry.name}</strong>{" "}
              {showRemoveConfirm === "workspace"
                ? "from the workspace? Members will no longer have access."
                : "as a personal integration? Members will no longer be able to connect their personal accounts."}
            </>
          }
          confirmLabel="Remove"
          onConfirm={() => {
            const mode = showRemoveConfirm;
            setShowRemoveConfirm(null);
            handleRemove(mode);
          }}
          onCancel={() => setShowRemoveConfirm(null)}
        />
      )}
      {switchConfirmMode && (
        <ProceedConfirmModal
          title={`Switch to ${switchConfirmMode === "workspace" ? "Workspace" : "Personal"}?`}
          description={
            <>
              Switching from{" "}
              <strong>
                {switchConfirmMode === "workspace" ? "personal" : "workspace"}
              </strong>{" "}
              to <strong>{switchConfirmMode}</strong> will delete all existing
              connections. This cannot be undone.
            </>
          }
          confirmLabel={`Switch to ${switchConfirmMode === "workspace" ? "Workspace" : "Personal"}`}
          onConfirm={() => {
            const mode = switchConfirmMode;
            setSwitchConfirmMode(null);
            executePublish(mode);
          }}
          onCancel={() => setSwitchConfirmMode(null)}
        />
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

  const [error, setError] = useState<string | null>(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState<
    "workspace" | "personal" | null
  >(null);
  const [switchConfirmMode, setSwitchConfirmMode] = useState<
    "workspace" | "personal" | null
  >(null);
  const [toolsExpanded, setToolsExpanded] = useState(false);

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

  const [selectedMode, setSelectedMode] = useState<
    "workspace" | "personal" | null
  >(
    isWorkspacePublished
      ? "workspace"
      : isPersonalPublished
        ? "personal"
        : null,
  );
  useEffect(() => {
    setSelectedMode(
      isWorkspacePublished
        ? "workspace"
        : isPersonalPublished
          ? "personal"
          : null,
    );
  }, [isWorkspacePublished, isPersonalPublished]);

  const authTypeLabel =
    entry.auth_type === "oauth2"
      ? "OAuth"
      : entry.auth_type === "api_key"
        ? "API Key"
        : "None";

  const writeOpsCount = tools.filter((t) => t.is_write).length;
  const totalTools = tools.length;

  const executePublish = async (mode: "workspace" | "personal") => {
    setError(null);
    const oppositeMode = mode === "workspace" ? "personal" : "workspace";
    const isOppositePublished =
      mode === "workspace" ? isPersonalPublished : isWorkspacePublished;
    try {
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

  const handlePublish = (mode: "workspace" | "personal") => {
    const isOppositePublished =
      mode === "workspace" ? isPersonalPublished : isWorkspacePublished;
    if (isOppositePublished) {
      setSwitchConfirmMode(mode);
      return;
    }
    executePublish(mode);
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
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden shrink-0 ${!entry.logo_url ? "bg-gray-100" : ""}`}
                >
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

              {isAdmin && (hasWorkspaceLevel || hasPersonalLevel) && (
                <div className="flex items-center gap-2 shrink-0">
                  {hasWorkspaceLevel && hasPersonalLevel && (
                    <span className="text-sm text-gray-400">Set as</span>
                  )}
                  {hasWorkspaceLevel && (
                    <button
                      onClick={() => setSelectedMode("workspace")}
                      disabled={isBusy}
                      className={`px-3 py-1.5 text-sm rounded-lg border transition-colors cursor-pointer disabled:opacity-50 ${
                        isWorkspacePublished || selectedMode === "workspace"
                          ? "border-purple-400 text-purple-600 font-semibold bg-purple-50"
                          : "border-gray-300 text-gray-500 hover:border-gray-400"
                      }`}
                    >
                      Workspace
                    </button>
                  )}
                  {hasPersonalLevel && (
                    <button
                      onClick={() => setSelectedMode("personal")}
                      disabled={isBusy}
                      className={`px-3 py-1.5 text-sm rounded-lg border transition-colors cursor-pointer disabled:opacity-50 ${
                        isPersonalPublished || selectedMode === "personal"
                          ? "border-blue-400 text-blue-600 font-semibold bg-blue-50"
                          : "border-gray-300 text-gray-500 hover:border-gray-400"
                      }`}
                    >
                      Personal
                    </button>
                  )}
                  {selectedMode ? (
                    (
                      selectedMode === "workspace"
                        ? isWorkspacePublished
                        : isPersonalPublished
                    ) ? (
                      <button
                        onClick={() => setShowRemoveConfirm(selectedMode)}
                        disabled={isBusy}
                        className="px-3 py-1.5 text-sm font-medium text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        Remove
                      </button>
                    ) : (
                      <button
                        onClick={() => handlePublish(selectedMode)}
                        disabled={isBusy}
                        className="px-4 py-1.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {isBusy ? "Adding…" : "Add"}
                      </button>
                    )
                  ) : (
                    <button
                      disabled
                      className="px-4 py-1.5 text-sm font-medium text-gray-300 bg-gray-100 rounded-lg cursor-not-allowed"
                    >
                      Add
                    </button>
                  )}
                </div>
              )}
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
                  {entry.integration_type ?? "Read & Write"}
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

      {showRemoveConfirm && (
        <ProceedConfirmModal
          title={
            showRemoveConfirm === "personal"
              ? "Remove Personal Integration"
              : "Remove from Workspace"
          }
          description={
            <>
              Are you sure you want to remove <strong>{entry.name}</strong>{" "}
              {showRemoveConfirm === "personal"
                ? "? Users who have connected their personal accounts will be disconnected."
                : "from workspace? This will remove the workspace connection."}
            </>
          }
          confirmLabel="Remove"
          onConfirm={() => {
            const mode = showRemoveConfirm;
            setShowRemoveConfirm(null);
            handleRemove(mode);
          }}
          onCancel={() => setShowRemoveConfirm(null)}
        />
      )}
      {switchConfirmMode && (
        <ProceedConfirmModal
          title={`Switch to ${switchConfirmMode === "workspace" ? "Workspace" : "Personal"}?`}
          description={
            <>
              Switching from{" "}
              <strong>
                {switchConfirmMode === "workspace" ? "personal" : "workspace"}
              </strong>{" "}
              to <strong>{switchConfirmMode}</strong> will delete all existing
              connections. This cannot be undone.
            </>
          }
          confirmLabel={`Switch to ${switchConfirmMode === "workspace" ? "Workspace" : "Personal"}`}
          onConfirm={() => {
            const mode = switchConfirmMode;
            setSwitchConfirmMode(null);
            executePublish(mode);
          }}
          onCancel={() => setSwitchConfirmMode(null)}
        />
      )}
    </>
  );
}
