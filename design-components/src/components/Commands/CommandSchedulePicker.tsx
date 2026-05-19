/**
 * CommandSchedulePicker — Commands-specific wrapper around ScheduleFields.
 *
 * Mirrors the chrome of the generic SchedulePicker (bordered card + enable
 * toggle + animated expand) but adds the "Auto-approve actions" checkbox
 * right under the timezone field. Keeping this wrapper here lets the
 * reusable SchedulePicker / ScheduleFields stay free of command-specific
 * concerns.
 */

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ScheduleFields } from '../SchedulePicker/ScheduleFields';
import { formatScheduleBadge } from '../SchedulePicker/constants';
import type { Schedule, SchedulePickerProps } from '../SchedulePicker/constants';

export interface CommandSchedulePickerProps extends SchedulePickerProps {
  /** Current value of the auto-approve flag. */
  autoApprove?: boolean;
  /** Called when the user toggles the auto-approve checkbox. */
  onAutoApproveChange?: (next: boolean) => void;
}

export const CommandSchedulePicker: React.FC<CommandSchedulePickerProps> = ({
  schedule,
  onScheduleChange,
  readOnly = false,
  label = 'Schedule',
  summary,
  frequencies,
  className,
  autoApprove = false,
  onAutoApproveChange,
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
            <div className={className ?? 'px-3 pb-3 space-y-3'}>
              <ScheduleFields
                schedule={schedule}
                onScheduleChange={onScheduleChange}
                readOnly={readOnly}
                frequencies={frequencies}
                className="space-y-2.5"
              />

              {/* Auto-approve toggle — sits directly under the timezone field */}
              {onAutoApproveChange && (
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoApprove}
                    onChange={(e) => onAutoApproveChange(e.target.checked)}
                    disabled={readOnly}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-1 focus:ring-gray-300 disabled:cursor-default"
                  />
                  <span className="flex flex-col">
                    <span className="text-xs font-medium text-gray-800/80">
                      Auto-approve actions for schedule commands
                    </span>
                    <span className="mt-0.5 text-xs text-gray-500">
                      Actions that normally need approval run automatically when this command fires
                      on a schedule.
                    </span>
                  </span>
                </label>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CommandSchedulePicker;
