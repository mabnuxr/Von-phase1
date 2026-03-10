import { useState, useEffect, useCallback } from 'react';
import type { Command, CommandSchedule, ScheduleRecipient } from './types';
import { generateCommandId, DEFAULT_SCHEDULE } from './types';
import { toSlug } from './utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FormValues {
  name: string;
  prompt: string;
  prefillText: string;
  sharingScope: 'private' | 'org';
  schedule: CommandSchedule;
}

const emptyForm: FormValues = {
  name: '',
  prompt: '',
  prefillText: '',
  sharingScope: 'private',
  schedule: { ...DEFAULT_SCHEDULE },
};

function commandToForm(cmd: Command): FormValues {
  return {
    name: cmd.name,
    prompt: cmd.prompt,
    prefillText: cmd.prefillText ?? '',
    sharingScope: cmd.sharingScope ?? 'private',
    schedule: cmd.schedule ? { ...cmd.schedule } : { ...DEFAULT_SCHEDULE },
  };
}

export interface UseCommandFormOptions {
  isOpen: boolean;
  editingCommand?: Command | null;
  currentUser?: ScheduleRecipient;
}

export interface UseCommandFormReturn {
  form: FormValues;
  setForm: React.Dispatch<React.SetStateAction<FormValues>>;
  /** Returns a stable onChange handler for a given form field key. */
  setField: <K extends keyof FormValues>(
    key: K
  ) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  commandId: string;
  isEditing: boolean;
  sharingLabel: string;
  setSchedule: (schedule: CommandSchedule) => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useCommandForm({
  isOpen,
  editingCommand,
  currentUser,
}: UseCommandFormOptions): UseCommandFormReturn {
  const [form, setForm] = useState<FormValues>(emptyForm);
  const [commandId, setCommandId] = useState(() => generateCommandId());

  // Reset form whenever the drawer opens (new or edit)
  useEffect(() => {
    if (isOpen) {
      setForm(editingCommand ? commandToForm(editingCommand) : emptyForm);
      setCommandId(editingCommand ? editingCommand.id : generateCommandId());
    }
  }, [isOpen, editingCommand]);

  // Stable curried onChange factory — only recreated when setForm identity changes.
  // The 'name' field is slug-transformed on every keystroke.
  const setField = useCallback(
    <K extends keyof FormValues>(key: K) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const raw = e.target.value;
        setForm((v) => ({ ...v, [key]: key === 'name' ? toSlug(raw) : raw }));
      },
    []
  );

  const setSchedule = useCallback(
    (schedule: CommandSchedule) => {
      setForm((v) => {
        // Auto-add current user as recipient when schedule is first enabled
        if (schedule.enabled && !v.schedule.enabled && currentUser) {
          const alreadyIncluded = schedule.recipients.some((r) => r.id === currentUser.id);
          if (!alreadyIncluded) {
            return { ...v, schedule: { ...schedule, recipients: [currentUser, ...schedule.recipients] } };
          }
        }
        return { ...v, schedule };
      });
    },
    [currentUser]
  );

  const isEditing = Boolean(editingCommand);
  const sharingLabel = form.sharingScope === 'org' ? 'Org-wide' : 'Private';

  return { form, setForm, setField, commandId, isEditing, sharingLabel, setSchedule };
}
