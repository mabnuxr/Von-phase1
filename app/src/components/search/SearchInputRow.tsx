import { useEffect, useRef } from "react";
import { Command } from "cmdk";
import { MagnifyingGlass, X } from "./icons";

interface Props {
  value: string;
  onChange: (next: string) => void;
  onClose: () => void;
  autoFocus?: boolean;
}

export function SearchInputRow({ value, onChange, onClose, autoFocus }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) {
      const t = setTimeout(() => inputRef.current?.focus(), 10);
      return () => clearTimeout(t);
    }
  }, [autoFocus]);

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
      <MagnifyingGlass size={18} className="text-gray-500 shrink-0" />
      <Command.Input
        ref={inputRef}
        value={value}
        onValueChange={onChange}
        placeholder="Search chats, dashboards, widgets…"
        autoComplete="off"
        spellCheck={false}
        className="flex-1 bg-transparent text-[15px] text-gray-900 placeholder:text-gray-400 outline-none"
      />
      <button
        type="button"
        onClick={onClose}
        aria-label="Close search"
        className="p-1 rounded text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
}
