import { useState, useEffect, useCallback } from 'react';
import type {
  Command,
  CommandReference,
  CommandSchedule,
  ScheduleRecipient,
  SharingScope,
} from './types';
import { generateCommandId, DEFAULT_SCHEDULE, SHARING_SCOPE_LABELS } from './types';
import type { Recipient } from '../RecipientPicker';
import { toSlug } from './utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FormValues {
  name: string;
  prompt: string;
  prefillText: string;
  sharingScope: SharingScope;
  sharedUsers: Recipient[];
  schedule: CommandSchedule;
  references: CommandReference[];
}

const emptyForm: FormValues = {
  name: '',
  prompt: '',
  prefillText: '',
  sharingScope: 'private',
  sharedUsers: [],
  schedule: { ...DEFAULT_SCHEDULE },
  references: [],
};

function commandToForm(cmd: Command, teamMembers?: Recipient[]): FormValues {
  const ids = cmd.sharedUserIds ?? [];
  const lookup = new Map((teamMembers ?? []).map((m) => [m.id, m]));
  const sharedUsers = ids
    .map((id) => lookup.get(id))
    .filter((r): r is Recipient => r !== undefined);
  return {
    name: cmd.name,
    prompt: cmd.prompt,
    prefillText: cmd.prefillText ?? '',
    sharingScope: cmd.sharingScope ?? 'private',
    sharedUsers,
    schedule: cmd.schedule ? { ...cmd.schedule } : { ...DEFAULT_SCHEDULE },
    references: cmd.references ? [...cmd.references] : [],
  };
}

export interface UseCommandFormOptions {
  isOpen: boolean;
  editingCommand?: Command | null;
  currentUser?: ScheduleRecipient;
  /** Used to hydrate sharedUserIds into Recipient chips when editing */
  teamMembers?: Recipient[];
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
  teamMembers,
}: UseCommandFormOptions): UseCommandFormReturn {
  const [form, setForm] = useState<FormValues>(emptyForm);
  const [commandId, setCommandId] = useState(() => generateCommandId());

  // Reset form on open or when switching to a different command.
  // Key on editingCommand.id (not the object identity) and omit teamMembers —
  // the parent re-renders constantly during agent streaming and hands down a
  // fresh teamMembers array each time, which would otherwise wipe in-progress
  // edits. If teamMembers hasn't loaded by the time the drawer opens, the
  // sharedUsers chips will appear blank — closing and reopening fixes it.
  useEffect(() => {
    if (isOpen) {
      setForm(editingCommand ? commandToForm(editingCommand, teamMembers) : emptyForm);
      setCommandId(editingCommand ? editingCommand.id : generateCommandId());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editingCommand?.id]);

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
            return {
              ...v,
              schedule: { ...schedule, recipients: [currentUser, ...schedule.recipients] },
            };
          }
        }
        return { ...v, schedule };
      });
    },
    [currentUser]
  );

  const isEditing = Boolean(editingCommand);
  const sharingLabel =
    form.sharingScope === 'specific'
      ? form.sharedUsers.length > 0
        ? `${form.sharedUsers.length} ${form.sharedUsers.length === 1 ? 'person' : 'people'}`
        : SHARING_SCOPE_LABELS.specific
      : SHARING_SCOPE_LABELS[form.sharingScope];

  return { form, setForm, setField, commandId, isEditing, sharingLabel, setSchedule };
}
