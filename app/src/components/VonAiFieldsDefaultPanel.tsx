import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Clock as ClockIcon,
  DotsThreeIcon,
  CaretRightIcon,
} from "@phosphor-icons/react";
import {
  useAiFields,
  useDisableField,
  useEnableDefaultAiField,
} from "../hooks/useVonAiFields";
import { DEFAULT_AI_FIELDS } from "../constants/defaultAiFields";
import { formatTimeAgo } from "../utils/formatTimeAgo";
import type { AiField, DefaultAiFieldDefinition } from "../types/vonAiFields";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "live", label: "Live" },
  { value: "disabled", label: "Disabled" },
];

interface DefaultRow {
  definition: DefaultAiFieldDefinition;
  materialized: AiField | null;
}

interface VonAiFieldsDefaultPanelProps {
  onRowClick: (fieldId: string) => void;
}

export function VonAiFieldsDefaultPanel({
  onRowClick,
}: VonAiFieldsDefaultPanelProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [openingName, setOpeningName] = useState<string | null>(null);

  // Fetch materialized default fields. Backend should respect isDefault=true;
  // we also filter client-side as a defensive measure until that's wired up.
  const { data: fieldsData, isLoading } = useAiFields(
    undefined,
    1,
    100,
    true,
    true,
  );
  const materializedByName = useMemo(() => {
    const map = new Map<string, AiField>();
    for (const f of fieldsData?.data ?? []) {
      if (f.isDefault) map.set(f.name, f);
    }
    return map;
  }, [fieldsData]);

  const rows: DefaultRow[] = useMemo(
    () =>
      DEFAULT_AI_FIELDS.map((def) => ({
        definition: def,
        materialized: materializedByName.get(def.name) ?? null,
      })),
    [materializedByName],
  );

  const enableMutation = useEnableDefaultAiField();

  // Clicking a row opens the same detail experience as the Custom panel. For
  // already-materialized defaults that's a direct hop; for non-materialized
  // ones we materialize first (the user can disable it from the detail view
  // if they didn't intend to enable it).
  const handleRowClick = useCallback(
    async (row: DefaultRow) => {
      if (row.materialized) {
        onRowClick(row.materialized.fieldId);
        return;
      }
      setOpeningName(row.definition.name);
      try {
        const created = await enableMutation.mutateAsync(row.definition);
        onRowClick(created.fieldId);
      } finally {
        setOpeningName(null);
      }
    },
    [enableMutation, onRowClick],
  );

  const filteredRows = rows.filter(({ definition, materialized }) => {
    if (statusFilter !== "all") {
      const isLive = materialized?.status === "live";
      if (statusFilter === "live" && !isLive) return false;
      if (statusFilter === "disabled" && isLive) return false;
    }
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      definition.displayName.toLowerCase().includes(q) ||
      definition.name.toLowerCase().includes(q) ||
      definition.description.toLowerCase().includes(q)
    );
  });

  return (
    <div className="w-full flex flex-col">
      {/* Backdrop for filter dropdown */}
      {filterOpen && (
        <div
          className="fixed inset-0 z-[60]"
          onClick={() => setFilterOpen(false)}
        />
      )}

      {/* Search bar with filter icon */}
      <div className="relative mb-2">
        <svg
          className="absolute left-3 top-1/2 transform -translate-y-1/2 size-3.5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search AI Fields by name, filter, or creator..."
          className="w-full py-2 pl-9 pr-10 text-sm text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-4 focus:ring-gray-100 focus:border-2 focus:border-gray-300 transition-all duration-200 bg-white hover:border-gray-300 shadow-xs"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 z-[70]">
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className={`w-7 h-7 inline-flex items-center justify-center rounded-md transition-colors cursor-pointer ${
              statusFilter !== "all"
                ? "text-gray-900 bg-gray-100"
                : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            }`}
            title="Filter by status"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M1.5 2.5h11M3.5 5.5h7M5.5 8.5h3M6.5 11.5h1" />
            </svg>
          </button>
          {filterOpen && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-1 w-[120px]">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setStatusFilter(opt.value);
                    setFilterOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-sm rounded-md cursor-pointer transition-colors ${
                    statusFilter === opt.value
                      ? "bg-gray-100 text-gray-900 font-medium"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="mb-4">
        <span className="text-xs text-gray-400">
          <ClockIcon size={11} className="inline -mt-px" weight="bold" /> Runs
          every 24 hours
        </span>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-sm text-gray-500 text-center py-12">
          Loading...
        </div>
      ) : filteredRows.length > 0 ? (
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
          <table className="w-full border-collapse text-sm table-fixed">
            <colgroup>
              <col />
              <col className="w-[160px]" />
              <col className="w-[160px]" />
              <col className="w-[100px]" />
              <col className="w-[100px]" />
              <col className="w-[48px]" />
            </colgroup>
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-[0.05em] px-4 py-2.5">
                  AI Field
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-[0.05em] px-4 py-2.5">
                  Created by
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-[0.05em] px-4 py-2.5">
                  Last Run
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-[0.05em] px-4 py-2.5">
                  Status
                </th>
                <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-[0.05em] px-4 py-2.5">
                  Action
                </th>
                <th className="w-[48px]" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRows.map((row) => (
                <DefaultFieldRow
                  key={row.definition.name}
                  row={row}
                  isOpening={openingName === row.definition.name}
                  onClick={() => handleRowClick(row)}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-sm text-gray-500 text-center py-8 border border-dashed border-gray-300 rounded-xl">
          No default fields found
          {searchTerm ? ` matching "${searchTerm}"` : ""}
        </div>
      )}

      {/* Footer note */}
      <p className="text-xs text-gray-400 mt-4 m-0">
        Default AI Fields are provided by Von and can&apos;t be edited or
        deleted. Enable the ones you want and they&apos;ll run on the same
        schedule as your custom fields.
      </p>
    </div>
  );
}

interface DefaultFieldRowProps {
  row: DefaultRow;
  isOpening: boolean;
  onClick: () => void;
}

function DefaultFieldRow({ row, isOpening, onClick }: DefaultFieldRowProps) {
  const { definition, materialized } = row;
  const enableMutation = useEnableDefaultAiField();
  const disableMutation = useDisableField();
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(
    null,
  );
  const menuRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const isLive = materialized?.status === "live";
  const isMutating = enableMutation.isPending || disableMutation.isPending;
  const lastRun = materialized?.lastRunAt
    ? formatTimeAgo(materialized.lastRunAt)
    : "—";

  const handleToggle = () => {
    if (isMutating) return;
    if (isLive && materialized) {
      disableMutation.mutate(materialized.fieldId);
    } else {
      enableMutation.mutate(definition);
    }
  };

  const openMenu = useCallback(() => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const menuHeight = 100;
      const top =
        spaceBelow < menuHeight ? rect.top - menuHeight : rect.bottom + 4;
      const menuWidth = 180;
      const left = Math.max(
        8,
        Math.min(window.innerWidth - menuWidth - 8, rect.right - menuWidth),
      );
      setMenuPos({ top, left });
    }
    setMenuOpen(true);
  }, []);

  // Close menu on outside click or scroll
  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(false);
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener("mousedown", handleClick);
    window.addEventListener("scroll", close, true);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      window.removeEventListener("scroll", close, true);
    };
  }, [menuOpen]);

  return (
    <tr
      className={`hover:bg-gray-50/80 transition-colors border-b border-gray-100 last:border-b-0 ${
        isOpening ? "cursor-wait opacity-70" : "cursor-pointer"
      }`}
      onClick={onClick}
    >
      {/* AI Field */}
      <td className="px-4 py-4">
        <p className="text-sm font-medium text-gray-900 m-0 leading-snug max-w-[200px]">
          {definition.displayName}
        </p>
      </td>

      {/* Created by */}
      <td className="px-4 py-4">
        <span className="text-sm text-gray-900">Von</span>
      </td>

      {/* Last Run */}
      <td className="px-4 py-4">
        <span className="text-xs text-gray-500 whitespace-nowrap">
          {lastRun}
        </span>
      </td>

      {/* Status */}
      <td className="px-4 py-4">
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-medium ${
            isLive ? "text-gray-900" : "text-gray-400"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isLive ? "bg-green-500" : "bg-gray-300"
            }`}
          />
          {isLive ? "Live" : "Disabled"}
        </span>
      </td>

      {/* Action: toggle centered */}
      <td
        className="px-4 py-4 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleToggle}
          disabled={isMutating}
          className={`relative inline-block w-[34px] h-[19px] rounded-full transition-colors shrink-0 cursor-pointer disabled:opacity-50 ${
            isLive ? "bg-green-600" : "bg-gray-300"
          }`}
          title={isLive ? "Disable" : "Enable"}
        >
          <span
            className={`absolute top-[2px] left-[2px] w-[15px] h-[15px] rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,.18),0_1px_1px_rgba(0,0,0,.06)] transition-transform ${
              isLive ? "translate-x-[15px]" : "translate-x-0"
            }`}
          />
        </button>
      </td>

      {/* Kebab menu — same shape as Custom, but all actions disabled */}
      <td className="px-2 py-4" onClick={(e) => e.stopPropagation()}>
        <div ref={menuRef}>
          <button
            ref={btnRef}
            onClick={() => (menuOpen ? setMenuOpen(false) : openMenu())}
            className="w-7 h-7 inline-flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 cursor-pointer transition-colors"
          >
            <DotsThreeIcon size={20} weight="bold" />
          </button>

          {menuOpen && menuPos && (
            <div
              className="fixed w-[180px] bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-1"
              style={{ top: menuPos.top, left: menuPos.left }}
            >
              <div className="group relative">
                <button
                  aria-disabled="true"
                  onClick={(e) => e.preventDefault()}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-400 rounded-md cursor-not-allowed"
                >
                  Edit in chat
                  <CaretRightIcon size={12} className="text-gray-300" />
                </button>
                <span
                  role="tooltip"
                  className="pointer-events-none absolute right-full top-1/2 -translate-y-1/2 mr-2 hidden group-hover:block whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs text-white shadow-lg z-[60]"
                >
                  This is a default AI field and can&apos;t be edited.
                </span>
              </div>

              <div className="h-px bg-gray-100 my-1" />

              <div className="group relative">
                <button
                  aria-disabled="true"
                  onClick={(e) => e.preventDefault()}
                  className="w-full text-left px-3 py-2 text-sm text-gray-400 rounded-md cursor-not-allowed"
                >
                  Delete
                </button>
                <span
                  role="tooltip"
                  className="pointer-events-none absolute right-full top-1/2 -translate-y-1/2 mr-2 hidden group-hover:block whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs text-white shadow-lg z-[60]"
                >
                  Default AI fields can&apos;t be deleted.
                </span>
              </div>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}
