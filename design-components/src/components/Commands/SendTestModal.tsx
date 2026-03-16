/**
 * SendTestModal — modal for selecting recipients and sending a test scheduled command.
 * Shows inline success/error feedback instead of global toasts.
 */

import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, WarningCircle } from '@phosphor-icons/react';
import { RecipientPicker } from '../RecipientPicker';
import type { ScheduleRecipient } from './types';

export interface SendTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Pre-selected recipients (from the schedule) */
  initialRecipients: ScheduleRecipient[];
  /** Pool of available people to pick from */
  availableRecipients?: ScheduleRecipient[];
  /** Called when user clicks Send. Should return a promise that resolves on success or rejects/throws on error. */
  onSend: (recipients: ScheduleRecipient[]) => Promise<void>;
}

export const SendTestModal: React.FC<SendTestModalProps> = ({
  isOpen,
  onClose,
  initialRecipients,
  availableRecipients = [],
  onSend,
}) => {
  const [recipients, setRecipients] = useState<ScheduleRecipient[]>(initialRecipients);
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  // Reset state when modal opens
  const prevOpenRef = React.useRef(isOpen);
  if (isOpen && !prevOpenRef.current) {
    // Transition from closed → open: reset
    setRecipients(initialRecipients);
    setStatus('idle');
    setMessage('');
  }
  prevOpenRef.current = isOpen;

  const handleSend = useCallback(async () => {
    if (recipients.length === 0 || status === 'sending') return;
    setStatus('sending');
    setMessage('');
    try {
      await onSend(recipients);
      setStatus('success');
      const count = recipients.length;
      setMessage(
        `Test triggered for ${count} recipient${count !== 1 ? 's' : ''}, it will arrive shortly`
      );
    } catch (err: unknown) {
      setStatus('error');
      const errMsg = err instanceof Error ? err.message : 'Failed to send test. Please try again.';
      setMessage(errMsg);
    }
  }, [recipients, status, onSend]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/20">
      <div className="bg-white rounded-2xl shadow-xl p-5 max-w-sm w-full mx-4">
        <h3 className="text-sm font-semibold text-gray-900">Send test</h3>
        <p className="mt-1 text-xs text-gray-500">Choose recipients for the test delivery.</p>

        <div className="mt-3">
          <RecipientPicker
            recipients={recipients}
            onChange={setRecipients}
            availableRecipients={availableRecipients}
            label="Recipients"
            placeholder="Search team members..."
          />
        </div>

        {/* Inline feedback */}
        {message && (
          <div
            className={`mt-3 flex items-center gap-1.5 text-xs ${
              status === 'success' ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {status === 'success' ? (
              <CheckCircle size={14} weight="fill" className="shrink-0" />
            ) : (
              <WarningCircle size={14} weight="fill" className="shrink-0" />
            )}
            <span>{message}</span>
          </div>
        )}

        <div className="mt-4 flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
          >
            {status === 'success' ? 'Done' : 'Cancel'}
          </button>
          {status !== 'success' && (
            <button
              onClick={handleSend}
              disabled={recipients.length === 0 || status === 'sending'}
              className="px-3 py-1.5 text-sm font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === 'sending' ? 'Sending...' : 'Send'}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SendTestModal;
