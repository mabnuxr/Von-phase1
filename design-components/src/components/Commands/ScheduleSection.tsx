/**
 * ScheduleSection — schedule + recipients configuration for CommandDrawer.
 *
 * Composes the general-purpose SchedulePicker and RecipientPicker components.
 */

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { CommandSchedule, ScheduleRecipient } from './types';
import { formatScheduleBadge } from './types';
import { SchedulePicker } from '../SchedulePicker';
import { RecipientPicker } from '../RecipientPicker';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ScheduleSectionProps {
  schedule: CommandSchedule;
  onScheduleChange: (schedule: CommandSchedule) => void;
  teamMembers?: ScheduleRecipient[];
  readOnly?: boolean;
  /** Called when the user clicks "Send test" in the recipient picker */
  onSendTest?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ScheduleSection: React.FC<ScheduleSectionProps> = ({
  schedule,
  onScheduleChange,
  teamMembers = [],
  readOnly = false,
  onSendTest,
}) => {
  return (
    <div className="space-y-3">
      <SchedulePicker
        schedule={schedule}
        onScheduleChange={(s) => onScheduleChange({ ...schedule, ...s })}
        readOnly={readOnly}
        summary={schedule.enabled ? formatScheduleBadge(schedule) : undefined}
      />

      <AnimatePresence>
        {schedule.enabled && (
          <motion.div
            initial={{ height: 0, opacity: 0, overflow: 'hidden' }}
            animate={{ height: 'auto', opacity: 1, overflow: 'visible' }}
            exit={{ height: 0, opacity: 0, overflow: 'hidden' }}
            transition={{ duration: 0.15 }}
          >
            <div className="border border-gray-100 rounded-xl px-3 py-2.5 space-y-2">
              <RecipientPicker
                recipients={schedule.recipients}
                onChange={(recipients) => onScheduleChange({ ...schedule, recipients })}
                availableRecipients={teamMembers}
                showSendTest
                onSendTest={onSendTest}
                readOnly={readOnly}
              />

              {schedule.recipients.length > 0 && (
                <p className="text-xs text-gray-500">
                  Results will be emailed to {schedule.recipients.length} recipient
                  {schedule.recipients.length !== 1 ? 's' : ''} at the scheduled time.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ScheduleSection;
