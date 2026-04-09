/**
 * ScheduleFields — the raw form fields for schedule configuration.
 *
 * Renders frequency, time, day-of-week, day-of-month, and timezone
 * controls with no wrapper chrome. Use directly when you need to embed schedule
 * controls inside your own layout (e.g. a popover). For a self-contained widget
 * with toggle header, use SchedulePicker instead.
 */

import React from 'react';
import { Dropdown } from '../forms/dropdown/Dropdown';
import { MultiSelectDropdown } from '../forms/dropdown/MultiSelectDropdown';
import {
  SCHEDULE_FREQUENCIES,
  SCHEDULE_DAYS,
  SCHEDULE_TIMES,
  SCHEDULE_DAYS_OF_MONTH,
  SCHEDULE_TIMEZONES,
  LOCAL_TIMEZONE,
} from './constants';
import type { Schedule, ScheduleDay, ScheduleFrequency, ScheduleFieldsProps } from './constants';

export const ScheduleFields: React.FC<ScheduleFieldsProps> = ({
  schedule,
  onScheduleChange,
  readOnly = false,
  frequencies,
  className,
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

  const frequencyOptions = frequencies ?? SCHEDULE_FREQUENCIES;
  const showDayOfWeek = schedule.frequency === 'weekly' || schedule.frequency === 'biweekly';
  const showDayOfMonth = schedule.frequency === 'monthly';

  return (
    <div className={className ?? 'space-y-2.5'}>
      {/* Frequency */}
      <Dropdown
        label="Frequency"
        labelClassName="text-xs font-medium text-gray-800/80"
        options={frequencyOptions}
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
  );
};

export default ScheduleFields;
