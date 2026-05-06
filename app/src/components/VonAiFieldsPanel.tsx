import { useState } from "react";
import useAiFieldsStore from "../store/vonAiFieldsStore";
import { useAiFields, useDeleteAiField } from "../hooks/useVonAiFields";
import { VonAiFieldRow } from "./VonAiFieldRow";
import type { AiFieldObjectType, AiFieldStatus } from "../types/vonAiFields";
import {
  CaretLeft as CaretLeftIcon,
  CaretRight as CaretRightIcon,
  Clock as ClockIcon,
} from "@phosphor-icons/react";

const PAGE_SIZE = 10;

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "live", label: "Live" },
  { value: "disabled", label: "Disabled" },
];

interface VonAiFieldsPanelProps {
  onRowClick: (fieldId: string) => void;
}

export function VonAiFieldsPanel({ onRowClick }: VonAiFieldsPanelProps) {
  const {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    deletingFieldId,
    setDeletingFieldId,
  } = useAiFieldsStore();

  const [activeScope] = useState<AiFieldObjectType>("opportunity");
  const [page, setPage] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);

  // Reset page when filters change
  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setPage(1);
  };

  const apiStatus =
    statusFilter === "all" ? undefined : (statusFilter as AiFieldStatus);
  const { data: fieldsData, isLoading } = useAiFields(
    apiStatus,
    page,
    PAGE_SIZE,
  );
  const deleteMutation = useDeleteAiField();

  const fields = fieldsData?.data ?? [];
  const pagination = fieldsData?.pagination;
  const total = pagination?.total ?? 0;
  const totalPages = pagination?.totalPages ?? 1;
  const hasNextPage = pagination?.hasNextPage ?? false;
  const hasPrevPage = pagination?.hasPrevPage ?? false;

  // Client-side search filter (API doesn't support search)
  const filteredFields = fields.filter((f) => {
    if (f.objectType !== activeScope) return false;
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      f.name.toLowerCase().includes(q) ||
      (f.description ?? "").toLowerCase().includes(q)
    );
  });

  const liveCount = fields.filter((f) => f.status === "live").length;

  const handleConfirmDelete = async () => {
    if (!deletingFieldId) return;
    try {
      await deleteMutation.mutateAsync(deletingFieldId);
      setDeletingFieldId(null);
    } catch {
      // handled by mutation
    }
  };

  return (
    <div className="w-full flex flex-col">
      {/* Backdrop for filter dropdown (outside search bar to cover everything) */}
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
          onChange={(e) => handleSearchChange(e.target.value)}
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
                    handleStatusChange(opt.value);
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
          {liveCount} live &middot; {total} total &middot;{" "}
          <ClockIcon size={11} className="inline -mt-px" weight="bold" />{" "}
          Polling every 1 day
        </span>
      </div>

      {/* Delete Confirmation Modal */}
      {deletingFieldId && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-50"
            onClick={() => setDeletingFieldId(null)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[400px] bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-gray-900 m-0 mb-2">
              Delete AI Field
            </h3>
            <p className="text-sm text-gray-600 m-0 mb-5">
              Are you sure you want to delete this field? This action cannot be
              undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeletingFieldId(null)}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleteMutation.isPending}
                className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 cursor-pointer disabled:opacity-50"
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="text-sm text-gray-500 text-center py-12">
          Loading...
        </div>
      ) : filteredFields.length > 0 ? (
        <>
          <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
            <table className="w-full border-collapse text-sm table-fixed">
              <colgroup>
                <col />
                <col className="w-[160px]" />
                <col className="w-[120px]" />
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
                {filteredFields.map((field) => (
                  <VonAiFieldRow
                    key={field.fieldId}
                    field={field}
                    onRowClick={onRowClick}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
              <span className="text-xs">
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!hasPrevPage}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <CaretLeftIcon size={12} />
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={!hasNextPage}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                  <CaretRightIcon size={12} />
                </button>
              </div>
            </div>
          )}
        </>
      ) : fields.length > 0 ? (
        <div className="text-sm text-gray-500 text-center py-8 border border-dashed border-gray-300 rounded-xl">
          No fields found{searchTerm ? ` matching "${searchTerm}"` : ""}
        </div>
      ) : (
        <div className="text-center py-16 border border-dashed border-gray-300 rounded-xl">
          <p className="text-sm text-gray-500 mb-3">No AI fields defined yet</p>
          <p className="text-xs text-gray-400">
            Create AI fields via chat to get started.
          </p>
        </div>
      )}

      {/* Footer note */}
      <p className="text-xs text-gray-400 mt-4 m-0">
        Von AI Fields aren&apos;t shown as fields on records. Von uses them
        across chat and dashboards, and you can export by record with filters
        and time period.
      </p>
    </div>
  );
}
