import { useState, useEffect } from "react";
import {
  X as XIcon,
  CaretLeft as CaretLeftIcon,
  CaretRight as CaretRightIcon,
} from "@phosphor-icons/react";
import { useAiFieldRuns } from "../../hooks/useVonAiFields";
import useAiFieldsStore from "../../store/vonAiFieldsStore";
import { formatTimeAgo } from "../../utils/formatTimeAgo";

// ─── Component ──────────────────────────────────────────────

export function AIFieldRunHistory() {
  const { runHistoryFieldId, closeRunHistory } = useAiFieldsStore();
  const [page, setPage] = useState(1);

  // Reset page when switching fields
  useEffect(() => {
    setPage(1);
  }, [runHistoryFieldId]);

  const { data, isLoading } = useAiFieldRuns(runHistoryFieldId, page, 20);

  if (!runHistoryFieldId) return null;

  const runs = data?.data ?? [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages ?? 1;
  const hasNextPage = pagination?.hasNextPage ?? false;
  const hasPrevPage = pagination?.hasPrevPage ?? false;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/15 z-40 transition-opacity"
        onClick={closeRunHistory}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 w-[600px] z-50 bg-white shadow-[-24px_0_60px_-16px_rgba(0,0,0,0.16),-6px_0_18px_-6px_rgba(0,0,0,0.06)] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-2.5 px-[18px] py-3.5 border-b border-gray-200 shrink-0">
          <h2 className="text-sm font-semibold text-gray-900 m-0 tracking-[-0.005em]">
            Run history
          </h2>
          <span className="text-xs text-gray-400 ml-1">last 7 days</span>
          <span className="flex-1" />
          <button
            onClick={closeRunHistory}
            className="w-7 h-7 inline-flex items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-600 cursor-pointer transition-colors"
          >
            <XIcon size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-[18px] py-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-sm text-gray-500">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400 mb-3" />
              Loading...
            </div>
          ) : runs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <span className="text-sm text-gray-500">No runs yet</span>
              <span className="text-xs text-gray-400 mt-1">
                Runs will appear here after the field is activated.
              </span>
            </div>
          ) : (
            <>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr>
                      <th className="text-left text-[10.5px] uppercase tracking-[0.05em] font-medium text-gray-500 px-3.5 py-2.5 bg-gray-50 border-b border-gray-100" />
                      <th className="text-left text-[10.5px] uppercase tracking-[0.05em] font-medium text-gray-500 px-3.5 py-2.5 bg-gray-50 border-b border-gray-100">
                        When
                      </th>
                      <th className="text-left text-[10.5px] uppercase tracking-[0.05em] font-medium text-gray-500 px-3.5 py-2.5 bg-gray-50 border-b border-gray-100">
                        Records evaluated
                      </th>
                      <th className="text-left text-[10.5px] uppercase tracking-[0.05em] font-medium text-gray-500 px-3.5 py-2.5 bg-gray-50 border-b border-gray-100">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {runs.map((run, i) => (
                      <tr key={run.executionId}>
                        <td
                          className={`px-3.5 py-2.5 ${i < runs.length - 1 ? "border-b border-dashed border-gray-100" : ""}`}
                        >
                          <span
                            className={`inline-block w-[7px] h-[7px] rounded-full ${
                              run.status === "completed"
                                ? "bg-green-500"
                                : run.status === "failed"
                                  ? "bg-red-500"
                                  : run.status === "partial_failure"
                                    ? "bg-amber-500"
                                    : run.status === "running"
                                      ? "bg-blue-500"
                                      : "bg-gray-300"
                            }`}
                          />
                        </td>
                        <td
                          className={`px-3.5 py-2.5 text-gray-900 font-medium ${i < runs.length - 1 ? "border-b border-dashed border-gray-100" : ""}`}
                        >
                          {formatTimeAgo(run.createdAt)}
                        </td>
                        <td
                          className={`px-3.5 py-2.5 text-gray-500 ${i < runs.length - 1 ? "border-b border-dashed border-gray-100" : ""}`}
                        >
                          {run.totalRowsProcessed.toLocaleString()}
                        </td>
                        <td
                          className={`px-3.5 py-2.5 text-gray-500 ${i < runs.length - 1 ? "border-b border-dashed border-gray-100" : ""}`}
                        >
                          <span
                            className={`capitalize ${
                              run.status === "completed"
                                ? "text-green-600"
                                : run.status === "failed"
                                  ? "text-red-600"
                                  : run.status === "partial_failure"
                                    ? "text-amber-600"
                                    : run.status === "running"
                                      ? "text-blue-600"
                                      : "text-gray-500"
                            }`}
                          >
                            {run.status === "partial_failure"
                              ? "partial failure"
                              : run.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
                  <span>
                    Page {page} of {totalPages}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={!hasPrevPage}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <CaretLeftIcon size={12} />
                      Previous
                    </button>
                    <button
                      onClick={() => setPage((p) => p + 1)}
                      disabled={!hasNextPage}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                      <CaretRightIcon size={12} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
