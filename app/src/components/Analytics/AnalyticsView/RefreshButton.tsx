import { useState, useEffect, useCallback, useMemo } from "react";
import {
  ArrowClockwiseIcon,
  CalendarBlankIcon,
  CaretDownIcon,
  PauseIcon,
  PlayIcon,
  TrashIcon,
  SpinnerGapIcon,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Tooltip,
  useVisibilityToggle,
  ScheduleFields,
  formatScheduleBadge,
  LOCAL_TIMEZONE,
} from "@vonlabs/design-components";
import type { Schedule, ScheduleFrequency } from "@vonlabs/design-components";
import type {
  ScheduleConfigRequest,
  DashboardScheduleResponse,
} from "../../../types/dashboard";

// ─── Frequency options for dashboard scheduling ────────────────
// (excludes biweekly — not supported by the dashboard schedule API)
const DASHBOARD_FREQUENCIES: { value: ScheduleFrequency; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

// ─── Helpers: convert between ScheduleFields local state & API UTC ──

const SUPPORTED_DASHBOARD_FREQUENCIES = new Set(
  DASHBOARD_FREQUENCIES.map((f) => f.value),
);

/** Validate an IANA timezone string, falling back to LOCAL_TIMEZONE */
function safeTimezone(tz: string): string {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return tz;
  } catch {
    return LOCAL_TIMEZONE;
  }
}

/** Convert local HH:MM in a given IANA timezone to UTC HH:MM.
 *  Uses today's date so DST offsets are correct for the current period. */
function localTimeToUtc(localTime: string, timezone: string): string {
  const tz = safeTimezone(timezone);
  const [hours, minutes] = localTime.split(":").map(Number);
  const today = new Date();
  today.setHours(hours, minutes, 0, 0);

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  });

  const localParts = formatter.formatToParts(today);
  const localH = Number(localParts.find((p) => p.type === "hour")?.value ?? 0);
  const localM = Number(
    localParts.find((p) => p.type === "minute")?.value ?? 0,
  );

  const machineMinutes = today.getHours() * 60 + today.getMinutes();
  const targetMinutes = localH * 60 + localM;
  const offsetMinutes = machineMinutes - targetMinutes;

  const desiredMinutes = hours * 60 + minutes;
  const machineEquiv = desiredMinutes + offsetMinutes;
  const utcDate = new Date();
  utcDate.setHours(0, machineEquiv, 0, 0);

  return `${String(utcDate.getUTCHours()).padStart(2, "0")}:${String(utcDate.getUTCMinutes()).padStart(2, "0")}`;
}

/** Convert UTC HH:MM to local HH:MM in a given IANA timezone.
 *  Uses today's date so DST offsets are correct for the current period. */
function utcTimeToLocal(utcTime: string, timezone: string): string {
  const tz = safeTimezone(timezone);
  const [hours, minutes] = utcTime.split(":").map(Number);
  const today = new Date();
  const utcDate = new Date(
    Date.UTC(
      today.getUTCFullYear(),
      today.getUTCMonth(),
      today.getUTCDate(),
      hours,
      minutes,
      0,
    ),
  );

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(utcDate);
  const h = parts.find((p) => p.type === "hour")?.value ?? "00";
  const m = parts.find((p) => p.type === "minute")?.value ?? "00";

  return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
}

/** Build a ScheduleFields-compatible Schedule from API response */
function apiToPickerSchedule(
  cfg: DashboardScheduleResponse["schedule_config"],
  savedTimezone?: string,
): Schedule {
  const tz = savedTimezone || LOCAL_TIMEZONE;
  const defaults: Schedule = {
    enabled: true,
    frequency: "daily",
    time: "09:00",
    days: ["Mon", "Wed", "Fri"],
    dayOfMonth: 1,
    timezone: tz,
  };
  if (!cfg) return defaults;

  const frequency = SUPPORTED_DASHBOARD_FREQUENCIES.has(
    cfg.frequency as ScheduleFrequency,
  )
    ? (cfg.frequency as ScheduleFrequency)
    : defaults.frequency;

  return {
    enabled: true,
    frequency,
    time: cfg.time ? utcTimeToLocal(cfg.time, tz) : defaults.time,
    days: (cfg.days as Schedule["days"]) ?? defaults.days,
    dayOfMonth: cfg.dayOfMonth ?? defaults.dayOfMonth,
    timezone: tz,
  };
}

/** Build an API request body from SchedulePicker state */
function pickerScheduleToApi(s: Schedule): ScheduleConfigRequest {
  const config: ScheduleConfigRequest = {
    frequency: s.frequency as ScheduleConfigRequest["frequency"],
  };

  config.time = localTimeToUtc(s.time, s.timezone);

  if (s.frequency === "weekly") {
    config.days = s.days;
  }

  if (s.frequency === "monthly") {
    config.dayOfMonth = s.dayOfMonth;
  }

  return config;
}

// ─── Component ─────────────────────────────────────────────────

interface RefreshButtonProps {
  onRefresh: () => Promise<void>;
  canRefresh?: boolean;
  isOwner?: boolean;
  isRefreshing?: boolean;
  schedule: DashboardScheduleResponse | null;
  isScheduled: boolean;
  isPaused: boolean;
  isMutating: boolean;
  onCreateSchedule: (config: ScheduleConfigRequest) => Promise<unknown>;
  onUpdateSchedule: (
    config: Partial<ScheduleConfigRequest>,
  ) => Promise<unknown>;
  onPauseSchedule: () => Promise<unknown>;
  onResumeSchedule: () => Promise<unknown>;
  onDeleteSchedule: () => Promise<unknown>;
}

export const RefreshButton: React.FC<RefreshButtonProps> = ({
  onRefresh,
  canRefresh = true,
  isOwner = true,
  isRefreshing,
  schedule,
  isScheduled,
  isPaused,
  isMutating,
  onCreateSchedule,
  onUpdateSchedule,
  onPauseSchedule,
  onResumeSchedule,
  onDeleteSchedule,
}) => {
  const { isVisible: open, hide, toggleVisibility } = useVisibilityToggle();

  // ScheduleFields local form state
  const [pickerSchedule, setPickerSchedule] = useState<Schedule>(() =>
    apiToPickerSchedule(schedule?.schedule_config ?? null),
  );

  // Sync form state from server schedule when popover opens,
  // preserving the user's last-selected timezone for UTC↔local conversion
  useEffect(() => {
    if (!open) return;
    setPickerSchedule((prev) =>
      apiToPickerSchedule(schedule?.schedule_config ?? null, prev.timezone),
    );
  }, [open, schedule]);

  const handleRefreshClick = () => {
    if (canRefresh && !isRefreshing) {
      onRefresh();
    }
  };

  const handleDropdownToggle = () => {
    if (canRefresh) toggleVisibility();
  };

  const handleSubmitSchedule = useCallback(async () => {
    const config = pickerScheduleToApi(pickerSchedule);
    try {
      if (isScheduled) {
        await onUpdateSchedule(config);
      } else {
        await onCreateSchedule(config);
      }
      hide();
    } catch {
      // Error toast is shown by the mutation hook; keep popover open for retry
    }
  }, [pickerSchedule, isScheduled, onCreateSchedule, onUpdateSchedule, hide]);

  // Summary text for collapsed schedule header
  const scheduleSummary = useMemo(() => {
    if (!isScheduled || !schedule?.schedule_config) return null;
    return formatScheduleBadge(
      apiToPickerSchedule(schedule.schedule_config, pickerSchedule.timezone),
    );
  }, [isScheduled, schedule, pickerSchedule.timezone]);

  const isDisabled = !canRefresh || isRefreshing;

  const baseStyles = isDisabled
    ? "text-gray-400 bg-gray-100 border-gray-200/70 cursor-not-allowed"
    : "text-gray-800 bg-white border-gray-200/70 hover:bg-gray-50 cursor-pointer";

  const activeStyles =
    "text-gray-800 bg-gray-50 border-gray-300 cursor-pointer";

  // Non-owner or no schedule permission: simple icon button
  if (!isOwner) {
    return (
      <Tooltip
        content={
          canRefresh ? "Refresh now" : "Save the dashboard to refresh data"
        }
      >
        <button
          onClick={handleRefreshClick}
          disabled={isDisabled}
          className={`inline-flex items-center justify-center w-[34px] h-[34px] border rounded-xl transition-colors ${baseStyles}`}
        >
          {isRefreshing ? (
            <SpinnerGapIcon size={14} className="animate-spin" />
          ) : (
            <ArrowClockwiseIcon size={14} />
          )}
        </button>
      </Tooltip>
    );
  }

  // Owner: split button — primary refresh + dropdown for schedule
  return (
    <div className="relative">
      <div className="inline-flex items-stretch">
        {/* Primary action: Refresh now */}
        <Tooltip
          content={
            canRefresh ? "Refresh now" : "Save the dashboard to refresh data"
          }
        >
          <button
            onClick={handleRefreshClick}
            disabled={isDisabled}
            className={`inline-flex items-center justify-center w-[34px] h-[34px] border border-r-0 rounded-l-xl transition-colors ${baseStyles}`}
          >
            {isRefreshing ? (
              <SpinnerGapIcon size={14} className="animate-spin" />
            ) : (
              <ArrowClockwiseIcon size={14} />
            )}
          </button>
        </Tooltip>

        {/* Dropdown toggle: Schedule refresh */}
        <Tooltip content="Schedule refresh">
          <button
            onClick={handleDropdownToggle}
            disabled={isDisabled}
            className={`inline-flex items-center justify-center w-[22px] h-[34px] border rounded-r-xl transition-colors ${
              isDisabled ? baseStyles : open ? activeStyles : baseStyles
            }`}
          >
            <CaretDownIcon
              size={10}
              className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`}
            />
          </button>
        </Tooltip>
      </div>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-[9998]" onClick={hide} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.1 }}
              className="absolute right-0 top-full mt-1.5 z-[9999] bg-white rounded-2xl shadow-lg border border-gray-100 w-[272px]"
            >
              <div className="px-2.5 pb-2 pt-2 flex flex-col gap-2">
                {/* Schedule header with summary */}
                <div className="flex items-center gap-1.5 px-0.5">
                  <CalendarBlankIcon
                    size={14}
                    className="text-gray-800 flex-shrink-0"
                  />
                  <div className="flex flex-col items-start min-w-0">
                    <span className="text-sm font-medium text-gray-900">
                      Schedule refresh
                    </span>
                    {isScheduled && scheduleSummary && (
                      <span className="text-[11px] text-gray-500 truncate">
                        {isPaused ? (
                          <span className="text-amber-600">
                            Paused &middot;{" "}
                          </span>
                        ) : null}
                        {scheduleSummary}
                      </span>
                    )}
                  </div>
                </div>

                {/* Reusable SchedulePicker in inline (headerless) mode */}
                <ScheduleFields
                  schedule={pickerSchedule}
                  onScheduleChange={setPickerSchedule}
                  frequencies={DASHBOARD_FREQUENCIES}
                />

                {/* Submit / Update */}
                <button
                  onClick={handleSubmitSchedule}
                  disabled={isMutating}
                  className={`w-full h-[34px] rounded-xl text-sm font-medium transition-colors ${
                    isMutating
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-800 border border-gray-200/70 hover:bg-gray-50 cursor-pointer"
                  }`}
                >
                  {isMutating ? (
                    <span className="flex items-center justify-center gap-1.5">
                      <SpinnerGapIcon size={14} className="animate-spin" />
                      Saving...
                    </span>
                  ) : isScheduled ? (
                    "Update schedule"
                  ) : (
                    "Schedule"
                  )}
                </button>

                {/* Pause / Resume / Delete — only when a schedule exists */}
                {isScheduled && (
                  <div className="flex items-center gap-1.5 pt-0.5 border-t border-gray-100">
                    {isPaused ? (
                      <button
                        onClick={async () => {
                          try {
                            await onResumeSchedule();
                            hide();
                          } catch {
                            // Error toast shown by mutation hook
                          }
                        }}
                        disabled={isMutating}
                        className="flex-1 flex items-center justify-center gap-1.5 h-[30px] rounded-lg text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <PlayIcon size={12} weight="bold" />
                        Resume
                      </button>
                    ) : (
                      <button
                        onClick={async () => {
                          try {
                            await onPauseSchedule();
                            hide();
                          } catch {
                            // Error toast shown by mutation hook
                          }
                        }}
                        disabled={isMutating}
                        className="flex-1 flex items-center justify-center gap-1.5 h-[30px] rounded-lg text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <PauseIcon size={12} weight="bold" />
                        Pause
                      </button>
                    )}
                    <button
                      onClick={async () => {
                        try {
                          await onDeleteSchedule();
                          hide();
                        } catch {
                          // Error toast shown by mutation hook
                        }
                      }}
                      disabled={isMutating}
                      className="flex-1 flex items-center justify-center gap-1.5 h-[30px] rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <TrashIcon size={12} />
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
