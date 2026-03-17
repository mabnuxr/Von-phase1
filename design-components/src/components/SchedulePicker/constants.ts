// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ScheduleFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly';
export type ScheduleDay = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export interface Schedule {
  enabled: boolean;
  frequency: ScheduleFrequency;
  time: string; // "HH:mm"
  days: ScheduleDay[]; // relevant for weekly / biweekly
  dayOfMonth: number; // 1-31, relevant for monthly
  timezone: string; // IANA timezone, e.g. "America/New_York"
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
  { value: 'biweekly', label: 'Bi-weekly' },
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

export const SCHEDULE_TIMEZONES: { value: string; label: string }[] = [
  { value: 'Pacific/Honolulu', label: '(GMT-10:00) Hawaii' },
  { value: 'America/Anchorage', label: '(GMT-09:00) Alaska' },
  { value: 'America/Los_Angeles', label: '(GMT-08:00) Pacific Time' },
  { value: 'America/Denver', label: '(GMT-07:00) Mountain Time' },
  { value: 'America/Chicago', label: '(GMT-06:00) Central Time' },
  { value: 'America/New_York', label: '(GMT-05:00) Eastern Time' },
  { value: 'America/Sao_Paulo', label: '(GMT-03:00) São Paulo' },
  { value: 'Atlantic/Reykjavik', label: '(GMT+00:00) Reykjavik' },
  { value: 'Europe/London', label: '(GMT+00:00) London' },
  { value: 'Europe/Paris', label: '(GMT+01:00) Paris' },
  { value: 'Europe/Berlin', label: '(GMT+01:00) Berlin' },
  { value: 'Europe/Helsinki', label: '(GMT+02:00) Helsinki' },
  { value: 'Asia/Dubai', label: '(GMT+04:00) Dubai' },
  { value: 'Asia/Kolkata', label: '(GMT+05:30) India (IST)' },
  { value: 'Asia/Singapore', label: '(GMT+08:00) Singapore' },
  { value: 'Asia/Tokyo', label: '(GMT+09:00) Tokyo' },
  { value: 'Australia/Sydney', label: '(GMT+11:00) Sydney' },
  { value: 'Pacific/Auckland', label: '(GMT+12:00) Auckland' },
];

export const LOCAL_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;

export const DEFAULT_SCHEDULE: Schedule = {
  enabled: false,
  frequency: 'weekly',
  time: '09:00',
  days: ['Mon'],
  dayOfMonth: 1,
  timezone: LOCAL_TIMEZONE,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Normalise a frequency string from the API so legacy values (e.g. "bi-weekly")
 * are mapped to the canonical ScheduleFrequency literals the UI expects.
 */
export function normalizeFrequency(raw: string): ScheduleFrequency {
  if (raw === 'bi-weekly') return 'biweekly';
  return raw as ScheduleFrequency;
}

export function formatScheduleBadge(schedule: Schedule): string {
  const freq =
    SCHEDULE_FREQUENCIES.find((f) => f.value === schedule.frequency)?.label ?? schedule.frequency;
  const timeLabel = SCHEDULE_TIMES.find((t) => t.value === schedule.time)?.label ?? schedule.time;
  const parts = [freq];
  if (schedule.frequency === 'weekly' || schedule.frequency === 'biweekly') {
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
