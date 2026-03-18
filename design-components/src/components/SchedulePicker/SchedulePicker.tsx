/**
 * SchedulePicker — configures recurring schedule (frequency, time, day).
 *
 * General-purpose component that can be embedded in any form.
 * Does NOT include recipient selection — compose with RecipientPicker when needed.
 */

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Dropdown } from '../forms/dropdown/Dropdown';
import { MultiSelectDropdown } from '../forms/dropdown/MultiSelectDropdown';
import {
  SCHEDULE_FREQUENCIES,
  SCHEDULE_DAYS,
  SCHEDULE_TIMES,
  SCHEDULE_DAYS_OF_MONTH,
  SCHEDULE_TIMEZONES,
  LOCAL_TIMEZONE,
  formatScheduleBadge,
} from './constants';
import type { Schedule, ScheduleDay, ScheduleFrequency, SchedulePickerProps } from './constants';

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

  // Ensure the user's current timezone (and any previously saved timezone) is always available
  const timezoneOptions = React.useMemo(() => {
    const base = [...SCHEDULE_TIMEZONES];
    const values = new Set(base.map((t) => t.value));
    for (const tz of [LOCAL_TIMEZONE, schedule.timezone]) {
      if (tz && !values.has(tz)) {
        base.push({ value: tz, label: tz });
        values.add(tz);
      }
    }
    return base;
  }, [schedule.timezone]);

  const showDayOfWeek = schedule.frequency === 'weekly' || schedule.frequency === 'biweekly';
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

              {/* Time & Date — same row */}
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

              {/* Day-of-week multi-select dropdown */}
              {showDayOfWeek && (
                <MultiSelectDropdown
                  label="Days"
                  labelClassName="text-xs font-medium text-gray-800/80"
                  options={SCHEDULE_DAYS.map((d) => ({ value: d, label: d }))}
                  value={schedule.days}
                  onChange={(days) => update({ days: days as ScheduleDay[] })}
                  disabled={readOnly}
                  min={1}
                  usePortal
                />
              )}

              {/* Timezone */}
              <Dropdown
                label="Timezone"
                labelClassName="text-xs font-medium text-gray-800/80"
                options={timezoneOptions}
                value={schedule.timezone}
                onChange={(v) => update({ timezone: v })}
                disabled={readOnly}
                usePortal
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SchedulePicker;
