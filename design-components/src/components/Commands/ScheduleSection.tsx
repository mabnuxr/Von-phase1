/**
 * ScheduleSection — schedule + recipients configuration for CommandDrawer.
 *
 * Composes the Commands-specific CommandSchedulePicker with RecipientPicker.
 */

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PaperPlaneTilt } from '@phosphor-icons/react';
import type { CommandSchedule, ScheduleRecipient } from './types';
import { formatScheduleBadge } from './types';
import { CommandSchedulePicker } from './CommandSchedulePicker';
import { RecipientPicker } from '../RecipientPicker';
import { SendTestModal } from './SendTestModal';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ScheduleSectionProps {
  schedule: CommandSchedule;
  onScheduleChange: (schedule: CommandSchedule) => void;
  teamMembers?: ScheduleRecipient[];
  readOnly?: boolean;
  /** Called when the user sends a test from the modal. Should return a promise. */
  onSendTest?: (recipients: ScheduleRecipient[]) => Promise<void>;
  /** Auto-approve toggle — headless runs skip the approval card when true. */
  autoApprove?: boolean;
  onAutoApproveChange?: (next: boolean) => void;
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
  autoApprove = false,
  onAutoApproveChange,
}) => {
  const [showTestModal, setShowTestModal] = useState(false);

  return (
    <div className="space-y-3">
      <CommandSchedulePicker
        schedule={schedule}
        onScheduleChange={(s) => onScheduleChange({ ...schedule, ...s })}
        readOnly={readOnly}
        summary={schedule.enabled ? formatScheduleBadge(schedule) : undefined}
        autoApprove={autoApprove}
        onAutoApproveChange={onAutoApproveChange}
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
                readOnly={readOnly}
              />

              {onSendTest && !readOnly && schedule.recipients.length > 0 && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowTestModal(true)}
                    className="inline-flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                  >
                    <PaperPlaneTilt size={11} />
                    Send test
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {onSendTest && (
        <SendTestModal
          isOpen={showTestModal}
          onClose={() => setShowTestModal(false)}
          initialRecipients={schedule.recipients}
          availableRecipients={teamMembers}
          onSend={onSendTest}
        />
      )}
    </div>
  );
};

export default ScheduleSection;
