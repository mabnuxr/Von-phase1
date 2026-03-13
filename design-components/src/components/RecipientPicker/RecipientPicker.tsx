/**
 * RecipientPicker — searchable multi-select for choosing people (email recipients, assignees, etc.).
 *
 * General-purpose component that can be embedded in any form.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { MagnifyingGlass, X, PaperPlaneTilt, CheckCircle } from '@phosphor-icons/react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Recipient {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface RecipientPickerProps {
  /** Currently selected recipients */
  recipients: Recipient[];
  /** Called when the selection changes */
  onChange: (recipients: Recipient[]) => void;
  /** Pool of available people to pick from */
  availableRecipients?: Recipient[];
  /** When true, show "Send test" button and fire onSendTest */
  showSendTest?: boolean;
  /** Called when the user clicks "Send test" */
  onSendTest?: () => void;
  /** Prevent any interaction */
  readOnly?: boolean;
  /** Label displayed above the picker */
  label?: string;
  /** Placeholder when no recipients are selected */
  placeholder?: string;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const InitialsCircle: React.FC<{ firstName: string; lastName: string }> = ({
  firstName,
  lastName,
}) => (
  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-[10px] font-medium text-gray-600 shrink-0">
    {firstName[0]}
    {lastName[0]}
  </span>
);

const RecipientChip: React.FC<{
  recipient: Recipient;
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

export const RecipientPicker: React.FC<RecipientPickerProps> = ({
  recipients,
  onChange,
  availableRecipients = [],
  showSendTest = false,
  onSendTest,
  readOnly = false,
  label = 'Recipients',
  placeholder = 'Search team members...',
}) => {
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [testSentMessage, setTestSentMessage] = useState<string | null>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRowRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSendTest = useCallback(() => {
    if (recipients.length === 0) return;
    onSendTest?.();
    const count = recipients.length;
    setTestSentMessage(`Sent to ${count} recipient${count !== 1 ? 's' : ''}`);
    setTimeout(() => setTestSentMessage(null), 3000);
  }, [recipients, onSendTest]);

  // Update portal position when dropdown opens or search changes
  // Flips above the input when there isn't enough room below
  const MAX_DROPDOWN_H = 112; // matches max-h-28
  useEffect(() => {
    if (showDropdown && inputRowRef.current) {
      const rect = inputRowRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const placeAbove = spaceBelow < MAX_DROPDOWN_H + 8 && rect.top > MAX_DROPDOWN_H;
      setDropdownPos({
        top: placeAbove ? rect.top - MAX_DROPDOWN_H - 4 : rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
  }, [showDropdown, search, recipients.length]);

  // Close dropdown on ancestor scroll so the portal doesn't float out of place
  useEffect(() => {
    if (!showDropdown) return;
    const handleScroll = (e: Event) => {
      // Ignore scroll events originating from inside the dropdown list itself
      if (dropdownRef.current?.contains(e.target as Node)) return;
      setShowDropdown(false);
    };
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [showDropdown]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!showDropdown) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideContainer = containerRef.current?.contains(target);
      const insideDropdown = dropdownRef.current?.contains(target);
      if (!insideContainer && !insideDropdown) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showDropdown]);

  const addRecipient = (member: Recipient) => {
    if (!recipients.some((r) => r.id === member.id)) {
      onChange([...recipients, member]);
    }
    setSearch('');
    setShowDropdown(false);
  };

  const removeRecipient = (id: string) => {
    onChange(recipients.filter((r) => r.id !== id));
  };

  const filteredMembers = availableRecipients.filter((m) => {
    if (recipients.some((r) => r.id === m.id)) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      m.firstName.toLowerCase().includes(q) ||
      m.lastName.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-medium text-gray-800/80">{label}</label>
        {showSendTest && !readOnly && recipients.length > 0 && (
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

      <div ref={containerRef} className="relative">
        {/* Search input with inline chips */}
        <div
          ref={inputRowRef}
          className={`flex flex-wrap items-center gap-1.5 border border-gray-100 rounded-xl px-2 py-1.5 transition-all focus-within:ring-1 focus-within:ring-gray-300 focus-within:border-gray-300 ${
            readOnly ? 'bg-gray-50' : ''
          }`}
        >
          <MagnifyingGlass size={13} className="text-gray-400 shrink-0" />
          {recipients.map((r) => (
            <RecipientChip
              key={r.id}
              recipient={r}
              onRemove={readOnly ? undefined : () => removeRecipient(r.id)}
            />
          ))}
          {!readOnly && (
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder={recipients.length === 0 ? placeholder : ''}
              className="flex-1 min-w-[80px] text-sm bg-transparent outline-none placeholder:text-gray-400"
            />
          )}
        </div>

        {/* Dropdown — portalled to escape overflow containers */}
        {!readOnly &&
          showDropdown &&
          filteredMembers.length > 0 &&
          createPortal(
            <div
              ref={dropdownRef}
              className="fixed z-[9999] bg-white border border-gray-100 rounded-lg shadow-lg max-h-28 overflow-y-auto py-1"
              style={{
                top: dropdownPos.top,
                left: dropdownPos.left,
                width: dropdownPos.width,
              }}
            >
              {filteredMembers.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => addRecipient(member)}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <InitialsCircle firstName={member.firstName} lastName={member.lastName} />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-gray-900 truncate">
                      {member.firstName} {member.lastName}
                    </div>
                    <div className="text-[11px] text-gray-400 truncate">{member.email}</div>
                  </div>
                </button>
              ))}
            </div>,
            document.body
          )}
      </div>
    </div>
  );
};

export default RecipientPicker;
