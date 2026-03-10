/**
 * ScheduleSection — schedule configuration UI for CommandDrawer.
 *
 * Rendered inside an Accordion below the Sharing section.
 * Allows users to configure recurring command execution and email delivery.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MagnifyingGlass, X, PaperPlaneTilt, CheckCircle } from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'framer-motion';
import type { CommandSchedule, ScheduleRecipient, ScheduleDay, ScheduleFrequency } from './types';
import {
  SCHEDULE_FREQUENCIES,
  SCHEDULE_DAYS,
  SCHEDULE_TIMES,
  formatScheduleBadge,
} from './types';
import { Dropdown } from '../forms/dropdown/Dropdown';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ScheduleSectionProps {
  schedule: CommandSchedule;
  onScheduleChange: (schedule: CommandSchedule) => void;
  teamMembers?: ScheduleRecipient[];
  readOnly?: boolean;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Initials circle for recipient avatar */
const InitialsCircle: React.FC<{ firstName: string; lastName: string }> = ({
  firstName,
  lastName,
}) => (
  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-[10px] font-medium text-gray-600 shrink-0">
    {firstName[0]}
    {lastName[0]}
  </span>
);

/** Removable chip for a selected recipient */
const RecipientChip: React.FC<{
  recipient: ScheduleRecipient;
  onRemove?: () => void;
}> = ({ recipient, onRemove }) => (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-gray-100 rounded-full">
    {recipient.firstName} {recipient.lastName}
    {onRemove && (
      <button
        type="button"
        onClick={onRemove}
        className="text-gray-400 hover:text-gray-600 cursor-pointer"
      >
        <X size={10} />
      </button>
    )}
  </span>
);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ScheduleSection: React.FC<ScheduleSectionProps> = ({
  schedule,
  onScheduleChange,
  teamMembers = [],
  readOnly = false,
}) => {
  const [recipientSearch, setRecipientSearch] = useState('');
  const [showRecipientDropdown, setShowRecipientDropdown] = useState(false);
  const [testSentMessage, setTestSentMessage] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const handleSendTest = useCallback(() => {
    if (schedule.recipients.length === 0) return;
    const count = schedule.recipients.length;
    setTestSentMessage(`Sent to ${count} recipient${count !== 1 ? 's' : ''}`);
    setTimeout(() => setTestSentMessage(null), 3000);
  }, [schedule.recipients]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!showRecipientDropdown) return;
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowRecipientDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showRecipientDropdown]);

  const update = (patch: Partial<CommandSchedule>) => {
    onScheduleChange({ ...schedule, ...patch });
  };

  const showDays = schedule.frequency === 'weekly' || schedule.frequency === 'bi-weekly';

  const selectDay = (day: ScheduleDay) => {
    update({ days: [day] });
  };

  const addRecipient = (member: ScheduleRecipient) => {
    if (!schedule.recipients.some((r) => r.id === member.id)) {
      update({ recipients: [...schedule.recipients, member] });
    }
    setRecipientSearch('');
    setShowRecipientDropdown(false);
  };

  const removeRecipient = (id: string) => {
    update({ recipients: schedule.recipients.filter((r) => r.id !== id) });
  };

  const filteredMembers = teamMembers.filter((m) => {
    if (schedule.recipients.some((r) => r.id === m.id)) return false;
    if (!recipientSearch.trim()) return true;
    const q = recipientSearch.toLowerCase();
    return (
      m.firstName.toLowerCase().includes(q) ||
      m.lastName.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q)
    );
  });

  const summaryText = schedule.enabled ? formatScheduleBadge(schedule) : undefined;

  return (
    <div className="border border-gray-100 rounded-xl">
      {/* Header with title + toggle */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-800/80">Schedule</span>
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
                />
                {showDays && (
                  <Dropdown
                    label="Day"
                    labelClassName="text-xs font-medium text-gray-800/80"
                    options={SCHEDULE_DAYS.map((d) => ({ value: d, label: d }))}
                    value={schedule.days[0]}
                    onChange={(v) => selectDay(v as ScheduleDay)}
                    disabled={readOnly}
                    className="flex-1"
                  />
                )}
              </div>

              {/* Recipients */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-gray-800/80">
                    Recipients
                  </label>
                  {!readOnly && schedule.recipients.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      {testSentMessage ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-green-600 animate-fade-in">
                          <CheckCircle size={12} weight="fill" />
                          {testSentMessage}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSendTest}
                          className="inline-flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                        >
                          <PaperPlaneTilt size={11} />
                          Send test
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div ref={searchRef} className="relative">
                  {/* Search input with inline chips */}
                  <div
                    className={`flex flex-wrap items-center gap-1.5 border border-gray-100 rounded-xl px-2 py-1.5 transition-all focus-within:ring-1 focus-within:ring-gray-300 focus-within:border-gray-300 ${
                      readOnly ? 'bg-gray-50' : ''
                    }`}
                  >
                    <MagnifyingGlass size={13} className="text-gray-400 shrink-0" />
                    {schedule.recipients.map((r) => (
                      <RecipientChip
                        key={r.id}
                        recipient={r}
                        onRemove={readOnly ? undefined : () => removeRecipient(r.id)}
                      />
                    ))}
                    {!readOnly && (
                      <input
                        type="text"
                        value={recipientSearch}
                        onChange={(e) => {
                          setRecipientSearch(e.target.value);
                          setShowRecipientDropdown(true);
                        }}
                        onFocus={() => setShowRecipientDropdown(true)}
                        placeholder={schedule.recipients.length === 0 ? 'Search team members...' : ''}
                        className="flex-1 min-w-[80px] text-sm bg-transparent outline-none placeholder:text-gray-400"
                      />
                    )}
                  </div>

                  {/* Dropdown */}
                  {!readOnly && showRecipientDropdown && filteredMembers.length > 0 && (
                    <div className="absolute z-[100] w-full mt-1 bg-white border border-gray-100 rounded-lg shadow-lg max-h-36 overflow-y-auto py-1">
                      {filteredMembers.map((member) => (
                        <button
                          key={member.id}
                          type="button"
                          onClick={() => addRecipient(member)}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          <InitialsCircle
                            firstName={member.firstName}
                            lastName={member.lastName}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-gray-900 truncate">
                              {member.firstName} {member.lastName}
                            </div>
                            <div className="text-[11px] text-gray-400 truncate">
                              {member.email}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Helper text */}
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
