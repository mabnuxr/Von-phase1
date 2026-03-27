/**
 * SchedulePicker — self-contained schedule widget with toggle header.
 *
 * Composes ScheduleFields (the raw form controls) with a bordered section,
 * enable/disable toggle, and animated expand/collapse.
 *
 * For embedding schedule fields inside your own layout without the toggle
 * chrome, use ScheduleFields directly.
 */

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ScheduleFields } from './ScheduleFields';
import { formatScheduleBadge } from './constants';
import type { Schedule, SchedulePickerProps } from './constants';

export const SchedulePicker: React.FC<SchedulePickerProps> = ({
  schedule,
  onScheduleChange,
  readOnly = false,
  label = 'Schedule',
  summary,
  frequencies,
  className,
}) => {
  const update = (patch: Partial<Schedule>) => {
    onScheduleChange({ ...schedule, ...patch });
  };

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
            <ScheduleFields
              schedule={schedule}
              onScheduleChange={onScheduleChange}
              readOnly={readOnly}
              frequencies={frequencies}
              className={className ?? 'px-3 pb-3 space-y-3'}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SchedulePicker;
