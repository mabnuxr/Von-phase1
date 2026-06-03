/**
 * RecipientPicker — searchable multi-select for choosing people (email recipients, assignees, etc.).
 *
 * General-purpose component that can be embedded in any form.
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MagnifyingGlass, X } from '@phosphor-icons/react';
import { Tooltip } from '../Tooltip';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Recipient {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  /** Tenant role name (compared against `disabledRole` on the picker). */
  role?: string;
}

export interface RecipientPickerProps {
  recipients: Recipient[];
  onChange: (recipients: Recipient[]) => void;
  availableRecipients?: Recipient[];
  readOnly?: boolean;
  label?: string;
  placeholder?: string;
  /** Suggestion rows whose `role` matches this value can't be selected. */
  disabledRole?: string;
  /** Tooltip shown when hovering a disabled suggestion row. */
  disabledTooltip?: string;
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
  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-900">
    {recipient.firstName} {recipient.lastName}
    {onRemove && (
      <button
        type="button"
        onClick={onRemove}
        className="cursor-pointer text-gray-400 hover:text-gray-600"
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
  readOnly = false,
  label = 'Recipients',
  placeholder = 'Search team members...',
  disabledRole,
  disabledTooltip,
}) => {
  const isDisabled = (r: Recipient) => disabledRole !== undefined && r.role === disabledRole;

  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRowRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Keep dropdown flush with the input row.
  // Uses a ResizeObserver so it repositions whenever the input row changes height
  // (e.g. chip wrapping). For the "above" case we use `bottom` CSS anchoring so
  // the dropdown sits directly above the input regardless of its own height.
  const MAX_DROPDOWN_H = 192; // matches max-h-48
  const [placeAbove, setPlaceAbove] = React.useState(false);

  const updatePosition = React.useCallback(() => {
    if (!showDropdown || !inputRowRef.current) return;
    const rect = inputRowRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const above = spaceBelow < MAX_DROPDOWN_H + 8 && rect.top > MAX_DROPDOWN_H;
    setPlaceAbove(above);
    setDropdownPos({
      top: above ? rect.top - 2 : rect.bottom + 2,
      left: rect.left,
      width: rect.width,
    });
  }, [showDropdown]);

  useEffect(() => {
    updatePosition();
  }, [updatePosition, search, recipients.length]);

  useEffect(() => {
    if (!showDropdown || !inputRowRef.current) return;
    const observer = new ResizeObserver(() => updatePosition());
    observer.observe(inputRowRef.current);
    return () => observer.disconnect();
  }, [showDropdown, updatePosition]);

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
    if (!recipients.some((r) => r.email === member.email)) {
      onChange([...recipients, member]);
    }
    setSearch('');
    setShowDropdown(false);
  };

  const removeRecipient = (id: string) => {
    onChange(recipients.filter((r) => r.id !== id));
  };

  const filteredMembers = availableRecipients.filter((m) => {
    if (recipients.some((r) => r.email === m.email)) return false;
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
      <div className="mb-1.5">
        <label className="text-xs font-medium text-gray-800/80">{label}</label>
      </div>

      <div ref={containerRef} className="relative">
        {/* Search input with inline chips */}
        <div
          ref={inputRowRef}
          className={`flex flex-wrap items-center gap-1.5 border border-gray-100 rounded-xl px-2 py-1.5 transition-all focus-within:ring-1 focus-within:ring-gray-300 focus-within:border-gray-300 ${
            readOnly ? 'bg-gray-50' : 'bg-white'
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
              className="fixed z-[9999] bg-white border border-gray-100 rounded-lg shadow-lg max-h-48 overflow-y-auto py-1"
              style={{
                ...(placeAbove
                  ? { bottom: window.innerHeight - dropdownPos.top }
                  : { top: dropdownPos.top }),
                left: dropdownPos.left,
                width: dropdownPos.width,
              }}
            >
              {filteredMembers.map((member) => {
                const disabled = isDisabled(member);
                const row = (
                  <button
                    type="button"
                    onClick={disabled ? undefined : () => addRecipient(member)}
                    disabled={disabled}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors ${
                      disabled ? 'cursor-not-allowed opacity-60' : 'hover:bg-gray-50 cursor-pointer'
                    }`}
                  >
                    <InitialsCircle firstName={member.firstName} lastName={member.lastName} />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-gray-900 truncate">
                        {member.firstName} {member.lastName}
                      </div>
                      <div className="text-[11px] text-gray-400 truncate">{member.email}</div>
                    </div>
                  </button>
                );
                return (
                  <Tooltip
                    key={member.id}
                    content={disabledTooltip}
                    enabled={disabled && !!disabledTooltip}
                    wrapperClassName="block"
                  >
                    {row}
                  </Tooltip>
                );
              })}
            </div>,
            document.body
          )}
      </div>
    </div>
  );
};

export default RecipientPicker;
