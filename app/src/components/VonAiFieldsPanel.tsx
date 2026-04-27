import { useState, useEffect } from "react";
import useVonAiFieldsStore from "../store/vonAiFieldsStore";
import {
  useIqColumns,
  useDeleteIqColumn,
  useExecutionStatus,
  useIqSchedule,
} from "../hooks/useVonAiFields";
import { VonAiFieldRow } from "./VonAiFieldRow";
import { SingleSelect } from "@vonlabs/design-components";
import { ClockIcon } from "@phosphor-icons/react";
import type {
  IqColumnScope,
  IqScheduleConfigRequest,
  ScheduleFrequency,
} from "../types/vonAiFields";

const FREQUENCY_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

const DAY_OPTIONS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "archived", label: "Paused" },
];

function formatScheduleShort(
  schedule: ReturnType<typeof useIqSchedule>["schedule"],
): string | null {
  if (!schedule?.schedule_config) return null;
  const cfg = schedule.schedule_config;
  switch (cfg.frequency) {
    case "minutely":
      return `Polling every ${cfg.interval ?? 1} min`;
    case "hourly":
      return `Polling every ${cfg.interval ?? 1} hour`;
    case "daily":
      return `Polling daily at ${cfg.time ?? "00:00"}`;
    case "weekly":
      return `Polling weekly`;
    case "monthly":
      return `Polling monthly`;
    default:
      return null;
  }
}

export function VonAiFieldsPanel() {
  const {
    setPaneMode,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    deletingColumnId,
    setDeletingColumnId,
    pollingExecutionId,
    setPollingExecutionId,
    setResultsExecutionId,
    isEditingSchedule,
    setIsEditingSchedule,
  } = useVonAiFieldsStore();

  const [activeScope, setActiveScope] = useState<IqColumnScope>("opportunity");

  const { data: columnsData, isLoading } = useIqColumns();
  const deleteMutation = useDeleteIqColumn();
  const { data: pollingExecution } = useExecutionStatus(pollingExecutionId);
  const {
    schedule,
    isScheduled,
    isPaused,
    isMutating: isScheduleMutating,
    handleCreateSchedule,
    handleUpdateSchedule,
    handlePauseSchedule,
    handleResumeSchedule,
    handleDeleteSchedule,
  } = useIqSchedule();

  // Schedule form state
  const [schedFrequency, setSchedFrequency] =
    useState<ScheduleFrequency>("daily");
  const [schedTime, setSchedTime] = useState("09:00");
  const [schedDays, setSchedDays] = useState<string[]>(["Mon", "Wed", "Fri"]);
  const [schedDayOfMonth, setSchedDayOfMonth] = useState(1);

  // Polling: react to execution status changes
  useEffect(() => {
    if (pollingExecution?.status === "completed" && pollingExecutionId) {
      setResultsExecutionId(pollingExecutionId);
      setPollingExecutionId(null);
      setPaneMode("results");
    }
    if (pollingExecution?.status === "failed" && pollingExecutionId) {
      setPollingExecutionId(null);
    }
  }, [
    pollingExecution?.status,
    pollingExecutionId,
    setPaneMode,
    setPollingExecutionId,
    setResultsExecutionId,
  ]);

  const allColumns = columnsData?.columns ?? [];
  const scopedColumns = allColumns.filter((col) => col.scope === activeScope);
  const filteredColumns = scopedColumns.filter((col) => {
    const matchesSearch =
      !searchTerm ||
      col.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      col.prompt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || col.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  const activeCount = scopedColumns.filter((c) => c.status === "active").length;
  const draftCount = scopedColumns.filter((c) => c.status === "draft").length;
  const totalCount = scopedColumns.length;

  const handleConfirmDelete = async () => {
    if (!deletingColumnId) return;
    try {
      await deleteMutation.mutateAsync(deletingColumnId);
      setDeletingColumnId(null);
    } catch {
      // handled by mutation — keep confirmation visible so user can retry
    }
  };

  const handleScheduleSubmit = async () => {
    if (schedFrequency === "weekly" && schedDays.length === 0) return;
    if (
      schedFrequency === "monthly" &&
      (!Number.isFinite(schedDayOfMonth) ||
        schedDayOfMonth < 1 ||
        schedDayOfMonth > 31)
    )
      return;
    const config: IqScheduleConfigRequest = { frequency: schedFrequency };
    config.time = schedTime;
    if (schedFrequency === "weekly") config.days = schedDays;
    if (schedFrequency === "monthly")
      config.dayOfMonth = Math.round(schedDayOfMonth);

    try {
      if (isScheduled) {
        await handleUpdateSchedule(config);
      } else {
        await handleCreateSchedule(config);
      }
      setIsEditingSchedule(false);
    } catch {
      // handled by mutation
    }
  };

  const handleEditSchedule = () => {
    if (schedule?.schedule_config) {
      const cfg = schedule.schedule_config;
      setSchedFrequency(cfg.frequency);
      setSchedTime(cfg.time ?? "09:00");
      setSchedDays(cfg.days ?? []);
      setSchedDayOfMonth(cfg.dayOfMonth ?? 1);
    }
    setIsEditingSchedule(true);
  };

  const scheduleLabel = formatScheduleShort(schedule);

  return (
    <div className="w-full flex flex-col">
      {/* ─── Scope Sub-tabs ──────────────────────────────── */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveScope("opportunity")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer -mb-px ${
            activeScope === "opportunity"
              ? "text-gray-900 border-b-2 border-gray-900"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Opportunity
        </button>
        <button
          disabled
          className="px-4 py-2.5 text-sm font-medium text-gray-300 cursor-not-allowed -mb-px"
          title="Coming soon"
        >
          Account
        </button>
      </div>

      {/* ─── Search & Filter ───────────────────────────── */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-36">
          <SingleSelect
            value={statusFilter}
            onChange={(value: string) => setStatusFilter(value)}
            options={STATUS_OPTIONS}
            fullWidth
          />
        </div>
        <div className="relative flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search questions..."
            className="w-full px-4 py-2 pl-9 text-sm text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-4 focus:ring-gray-100 focus:border-2 focus:border-gray-300 transition-all duration-200 bg-white hover:border-gray-300 shadow-xs"
          />
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
        </div>
      </div>

      {/* ─── Summary Stats Bar ───────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span>
            {activeCount} active · {totalCount} total
            {draftCount > 0 ? ` · ${draftCount} draft` : ""}
          </span>
          {scheduleLabel && (
            <>
              <span className="text-gray-300">·</span>
              <span className="inline-flex items-center gap-1.5">
                <ClockIcon size={14} />
                {scheduleLabel}
              </span>
            </>
          )}
        </div>
      </div>

      {/* ─── Delete Confirmation ───────────────────────── */}
      {deletingColumnId && (
        <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-800 mb-3">
            Are you sure you want to delete this question? This cannot be
            undone.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setDeletingColumnId(null)}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
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
      )}

      {/* ─── Table ───────────────────────────────────────── */}
      {isLoading ? (
        <div className="text-sm text-gray-500 text-center py-12">
          Loading...
        </div>
      ) : filteredColumns.length > 0 ? (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                  Question
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                  Status
                </th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                  Matched
                </th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                  Completed
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                  Last Run
                </th>
                <th className="w-10 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredColumns.map((col) => (
                <VonAiFieldRow key={col.column_id} column={col} />
              ))}
            </tbody>
          </table>
        </div>
      ) : scopedColumns.length > 0 ? (
        <div className="text-sm text-gray-500 text-center py-8 border border-dashed border-gray-300 rounded-xl">
          No questions found{searchTerm ? ` matching "${searchTerm}"` : ""}
          {statusFilter !== "all" ? ` with status "${statusFilter}"` : ""}
        </div>
      ) : (
        <div className="text-center py-16 border border-dashed border-gray-300 rounded-xl">
          <p className="text-sm text-gray-500 mb-3">
            No {activeScope} questions defined yet
          </p>
          <button
            onClick={() => setPaneMode("create")}
            className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
          >
            Create your first question
          </button>
        </div>
      )}

      {/* ─── Execution status ────────────────────────────── */}
      {pollingExecutionId && pollingExecution?.status === "running" && (
        <div className="mt-4 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          Execution in progress...
        </div>
      )}

      {/* ─── Schedule ──────────────────────────────────── */}
      <div className="border-t border-gray-200 pt-6 mt-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Schedule</h3>

        {!isScheduled && !isEditingSchedule && (
          <button
            onClick={() => setIsEditingSchedule(true)}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Set up schedule
          </button>
        )}

        {isScheduled && !isEditingSchedule && schedule?.schedule_config && (
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-gray-700">
              {formatScheduleShort(schedule) || "Custom schedule"}
            </span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                isPaused
                  ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                  : "bg-green-50 text-green-700 border-green-200"
              }`}
            >
              {isPaused ? "Paused" : "Active"}
            </span>
            <div className="flex gap-1">
              {isPaused ? (
                <button
                  onClick={() => void handleResumeSchedule()}
                  disabled={isScheduleMutating}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer disabled:opacity-50"
                >
                  Resume
                </button>
              ) : (
                <button
                  onClick={() => void handlePauseSchedule()}
                  disabled={isScheduleMutating}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer disabled:opacity-50"
                >
                  Pause
                </button>
              )}
              <button
                onClick={handleEditSchedule}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                Edit
              </button>
              <button
                onClick={() => void handleDeleteSchedule()}
                disabled={isScheduleMutating}
                className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 cursor-pointer disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        )}

        {isEditingSchedule && (
          <div className="space-y-3 p-4 border border-gray-200 rounded-xl bg-gray-50">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Frequency
              </label>
              <SingleSelect
                value={schedFrequency}
                onChange={(v: string) =>
                  setSchedFrequency(v as ScheduleFrequency)
                }
                options={FREQUENCY_OPTIONS}
                fullWidth
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Time (UTC)
              </label>
              <input
                type="time"
                value={schedTime}
                onChange={(e) => setSchedTime(e.target.value)}
                className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-von-purple focus:border-transparent bg-white"
              />
            </div>

            {schedFrequency === "weekly" && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Days
                </label>
                <div className="flex flex-wrap gap-2">
                  {DAY_OPTIONS.map((day) => (
                    <button
                      key={day}
                      onClick={() =>
                        setSchedDays((prev) =>
                          prev.includes(day)
                            ? prev.filter((d) => d !== day)
                            : [...prev, day],
                        )
                      }
                      className={`px-3 py-1 text-xs font-medium rounded-lg border cursor-pointer transition-colors ${
                        schedDays.includes(day)
                          ? "bg-gray-900 text-white border-gray-900"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {schedFrequency === "monthly" && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Day of month
                </label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={schedDayOfMonth}
                  onChange={(e) => setSchedDayOfMonth(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-von-purple focus:border-transparent bg-white"
                />
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsEditingSchedule(false)}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleScheduleSubmit}
                disabled={
                  isScheduleMutating ||
                  (schedFrequency === "weekly" && schedDays.length === 0) ||
                  (schedFrequency === "monthly" &&
                    (!Number.isFinite(schedDayOfMonth) ||
                      schedDayOfMonth < 1 ||
                      schedDayOfMonth > 31))
                }
                className="px-3 py-1.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 cursor-pointer disabled:opacity-50"
              >
                {isScheduleMutating
                  ? "Saving..."
                  : isScheduled
                    ? "Update Schedule"
                    : "Create Schedule"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Footer note ─────────────────────────────────── */}
      <p className="mt-6 text-xs text-gray-400">
        Von AI Fields aren't shown as fields on records. Von uses them across
        chat and dashboards, and you can export by record with filters and time
        period.
      </p>
    </div>
  );
}
