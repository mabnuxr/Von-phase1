/**
 * SchedulePicker — configures recurring schedule (frequency, time, day).
 *
 * General-purpose component that can be embedded in any form.
 * Does NOT include recipient selection — compose with RecipientPicker when needed.
 */

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Dropdown } from '../forms/dropdown/Dropdown';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ScheduleFrequency = 'daily' | 'weekly' | 'bi-weekly' | 'monthly';
export type ScheduleDay = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export interface Schedule {
  enabled: boolean;
  frequency: ScheduleFrequency;
  time: string; // "HH:mm"
  days: ScheduleDay[]; // relevant for weekly / bi-weekly
  dayOfMonth: number; // 1-31, relevant for monthly
}

export interface SchedulePickerProps {
  schedule: Schedule;
  onScheduleChange: (schedule: Schedule) => void;
  readOnly?: boolean;
  /** Label shown in the header */
  label?: string;
  /** Optional summary text shown next to the label when enabled */
  summary?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const SCHEDULE_FREQUENCIES: { value: ScheduleFrequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'bi-weekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
];

export const SCHEDULE_DAYS: ScheduleDay[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const SCHEDULE_TIMES: { value: string; label: string }[] = Array.from(
  { length: 24 },
  (_, i) => {
    const value = `${i.toString().padStart(2, '0')}:00`;
    const ampm = i < 12 ? 'AM' : 'PM';
    const display = i === 0 ? 12 : i > 12 ? i - 12 : i;
    return { value, label: `${display}:00 ${ampm}` };
  }
);

export const SCHEDULE_DAYS_OF_MONTH: { value: string; label: string }[] = Array.from(
  { length: 31 },
  (_, i) => {
    const day = i + 1;
    const suffix =
      day === 1 || day === 21 || day === 31
        ? 'st'
        : day === 2 || day === 22
          ? 'nd'
          : day === 3 || day === 23
            ? 'rd'
            : 'th';
    return { value: String(day), label: `${day}${suffix}` };
  }
);

export const DEFAULT_SCHEDULE: Schedule = {
  enabled: false,
  frequency: 'weekly',
  time: '09:00',
  days: ['Mon'],
  dayOfMonth: 1,
};

export function formatScheduleBadge(schedule: Schedule): string {
  const freq =
    SCHEDULE_FREQUENCIES.find((f) => f.value === schedule.frequency)?.label ?? schedule.frequency;
  const timeLabel = SCHEDULE_TIMES.find((t) => t.value === schedule.time)?.label ?? schedule.time;
  const parts = [freq];
  if (schedule.frequency === 'weekly' || schedule.frequency === 'bi-weekly') {
    parts.push(schedule.days.join(', '));
  } else if (schedule.frequency === 'monthly') {
    const dayLabel =
      SCHEDULE_DAYS_OF_MONTH.find((d) => d.value === String(schedule.dayOfMonth))?.label ??
      `${schedule.dayOfMonth}`;
    parts.push(dayLabel);
  }
  parts.push(timeLabel);
  return parts.join(' · ');
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const SchedulePicker: React.FC<SchedulePickerProps> = ({
  schedule,
  onScheduleChange,
  readOnly = false,
  label = 'Schedule',
  summary,
}) => {
  const update = (patch: Partial<Schedule>) => {
    onScheduleChange({ ...schedule, ...patch });
  };

  const showDayOfWeek = schedule.frequency === 'weekly' || schedule.frequency === 'bi-weekly';
  const showDayOfMonth = schedule.frequency === 'monthly';
  const summaryText = summary ?? (schedule.enabled ? formatScheduleBadge(schedule) : undefined);

  return (
    <div className="border border-gray-100 rounded-xl">
      {/* Header with title + toggle */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-800/80">{label}</span>
          {summaryText && <span className="text-xs text-gray-400">{summaryText}</span>}
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={schedule.enabled}
          onClick={() => !readOnly && update({ enabled: !schedule.enabled })}
          className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ${
            readOnly ? 'cursor-default opacity-60' : 'cursor-pointer'
          } ${schedule.enabled ? 'bg-gray-900' : 'bg-gray-200'}`}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${
              schedule.enabled ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Schedule options — animated expand */}
      <AnimatePresence>
        {schedule.enabled && (
          <motion.div
            initial={{ height: 0, opacity: 0, overflow: 'hidden' }}
            animate={{ height: 'auto', opacity: 1, overflow: 'visible' }}
            exit={{ height: 0, opacity: 0, overflow: 'hidden' }}
            transition={{ duration: 0.15 }}
          >
            <div className="px-3 pb-3 space-y-3">
              {/* Frequency */}
              <Dropdown
                label="Frequency"
                labelClassName="text-xs font-medium text-gray-800/80"
                options={SCHEDULE_FREQUENCIES}
                value={schedule.frequency}
                onChange={(v) => update({ frequency: v as ScheduleFrequency })}
                disabled={readOnly}
                usePortal
              />

              {/* Time & Day — same row */}
              <div className="flex items-start gap-2">
                <Dropdown
                  label="Time"
                  labelClassName="text-xs font-medium text-gray-800/80"
                  options={SCHEDULE_TIMES}
                  value={schedule.time}
                  onChange={(v) => update({ time: v })}
                  disabled={readOnly}
                  className="flex-1"
                  usePortal
                />
                {showDayOfWeek && (
                  <Dropdown
                    label="Day"
                    labelClassName="text-xs font-medium text-gray-800/80"
                    options={SCHEDULE_DAYS.map((d) => ({ value: d, label: d }))}
                    value={schedule.days[0]}
                    onChange={(v) => update({ days: [v as ScheduleDay] })}
                    disabled={readOnly}
                    className="flex-1"
                    usePortal
                  />
                )}
                {showDayOfMonth && (
                  <Dropdown
                    label="Date"
                    labelClassName="text-xs font-medium text-gray-800/80"
                    options={SCHEDULE_DAYS_OF_MONTH}
                    value={String(schedule.dayOfMonth)}
                    onChange={(v) => update({ dayOfMonth: parseInt(v, 10) })}
                    disabled={readOnly}
                    className="flex-1"
                    usePortal
                  />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SchedulePicker;
