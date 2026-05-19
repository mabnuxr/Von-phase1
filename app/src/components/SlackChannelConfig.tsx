import { useEffect, useRef, useState } from "react";
import type {
  ChannelCondition,
  ChannelGroup,
  ChannelCategory,
  SlackChannelConfigData,
} from "./slackChannelConfig.types";

// --- Constants ---

const MAX_TOTAL_GROUPS = 5;
const MAX_CONDITIONS_PER_GROUP = 5;

const FIELD_LABELS: Record<ChannelCondition["field"], string> = {
  channel_name: "Channel Name",
};

const OPERATOR_LABELS: Record<ChannelCondition["operator"], string> = {
  is: "Is",
  starts_with: "Starts with",
  contains: "Contains",
  ends_with: "Ends with",
};

const CATEGORY_META: Record<
  "external",
  { title: string; description: string; color: string }
> = {
  external: {
    title: "External channels",
    description:
      "Von reads these to capture what your prospects, customers, and partners are saying.",
    color: "text-slack-yellow font-medium",
  },
};

// --- Helpers ---

function newKey(): string {
  // crypto.randomUUID is available in all evergreen browsers we ship to.
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createCondition(): ChannelCondition {
  return {
    _key: newKey(),
    field: "channel_name",
    operator: "starts_with",
    value: "",
  };
}

function createGroup(name: string): ChannelGroup {
  return {
    _key: newKey(),
    name,
    conditions: [createCondition()],
    condition_logic: "or",
  };
}

function defaultCategories(): ChannelCategory[] {
  return [{ type: "external", groups: [createGroup("New Category")] }];
}

function getTotalGroupCount(categories: ChannelCategory[]): number {
  return categories.reduce((sum, cat) => sum + cat.groups.length, 0);
}

// --- Sub-components ---

interface SelectOption {
  value: string;
  label: string;
}

function Select({
  value,
  options,
  onChange,
  widthClass = "w-36",
}: {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  widthClass?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState<number>(() =>
    Math.max(
      0,
      options.findIndex((o) => o.value === value),
    ),
  );
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!isOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [isOpen]);

  const commit = (idx: number) => {
    const opt = options[idx];
    if (!opt) return;
    onChange(opt.value);
    setIsOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      return;
    }
    if (
      !isOpen &&
      (e.key === "Enter" || e.key === " " || e.key === "ArrowDown")
    ) {
      e.preventDefault();
      setIsOpen(true);
      return;
    }
    if (!isOpen) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(options.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      commit(activeIdx);
    }
  };

  return (
    <div ref={rootRef} className={`relative ${widthClass} shrink-0`}>
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        onKeyDown={onKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between gap-1.5 px-2.5 py-1.5 text-[13px] border rounded-md bg-white text-gray-700 cursor-pointer text-left transition-colors ${
          isOpen
            ? "border-gray-300 ring-2 ring-gray-100"
            : "border-gray-200 hover:border-gray-300"
        }`}
      >
        <span className="truncate">{selected?.label ?? ""}</span>
        <svg
          className={`size-3.5 shrink-0 text-gray-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {isOpen && (
        <ul
          role="listbox"
          className="absolute z-50 top-full left-0 mt-1 w-full max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-md shadow-lg py-1 settings-scrollbar"
        >
          {options.map((opt, idx) => {
            const isSelected = opt.value === value;
            const isActive = idx === activeIdx;
            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActiveIdx(idx)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  commit(idx);
                }}
                className={`px-2.5 py-1.5 text-[13px] cursor-pointer ${
                  isActive ? "bg-gray-100" : ""
                } ${isSelected ? "text-gray-900 font-medium" : "text-gray-700"}`}
              >
                {opt.label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function ConditionRow({
  condition,
  onChange,
  onRemove,
  canRemove,
}: {
  condition: ChannelCondition;
  onChange: (c: ChannelCondition) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const fieldOptions: SelectOption[] = Object.entries(FIELD_LABELS).map(
    ([value, label]) => ({ value, label }),
  );
  const operatorOptions: SelectOption[] = Object.entries(OPERATOR_LABELS).map(
    ([value, label]) => ({ value, label }),
  );

  return (
    <div className="flex items-center gap-2">
      <Select
        value={condition.field}
        options={fieldOptions}
        onChange={(v) =>
          onChange({ ...condition, field: v as ChannelCondition["field"] })
        }
        widthClass="w-36"
      />

      <Select
        value={condition.operator}
        options={operatorOptions}
        onChange={(v) =>
          onChange({
            ...condition,
            operator: v as ChannelCondition["operator"],
          })
        }
        widthClass="w-36"
      />

      <input
        type="text"
        value={condition.value}
        onChange={(e) => onChange({ ...condition, value: e.target.value })}
        placeholder="e.g., ext-"
        className="flex-1 min-w-0 px-2.5 py-1.5 text-[13px] border border-gray-200 rounded-md text-gray-700 placeholder:text-gray-400"
      />

      {canRemove ? (
        <button
          onClick={onRemove}
          className="text-gray-300 hover:text-gray-500 cursor-pointer p-0 border-none bg-transparent shrink-0"
        >
          <svg
            className="size-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              d="M6 18L18 6M6 6l12 12"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      ) : (
        <div className="w-4 shrink-0" />
      )}
    </div>
  );
}

function GroupCard({
  group,
  onChange,
  onRemove,
}: {
  group: ChannelGroup;
  onChange: (g: ChannelGroup) => void;
  onRemove: () => void;
}) {
  const [isEditingName, setIsEditingName] = useState(false);

  const updateCondition = (idx: number, condition: ChannelCondition) => {
    const conditions = [...group.conditions];
    conditions[idx] = condition;
    onChange({ ...group, conditions });
  };

  const removeCondition = (idx: number) => {
    const conditions = group.conditions.filter((_, i) => i !== idx);
    onChange({ ...group, conditions });
  };

  const addCondition = () => {
    if (group.conditions.length >= MAX_CONDITIONS_PER_GROUP) return;
    onChange({
      ...group,
      conditions: [...group.conditions, createCondition()],
    });
  };

  return (
    <div className="border border-gray-200 rounded-lg bg-white">
      {/* Group header */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-3">
        <div className="flex items-center gap-2 min-w-0">
          {isEditingName ? (
            <input
              type="text"
              value={group.name}
              onChange={(e) => onChange({ ...group, name: e.target.value })}
              onBlur={() => setIsEditingName(false)}
              onKeyDown={(e) => e.key === "Enter" && setIsEditingName(false)}
              autoFocus
              className="text-[13px] font-semibold px-1.5 py-0.5 border border-gray-300 rounded-md -ml-1.5"
            />
          ) : (
            <span
              onClick={() => setIsEditingName(true)}
              className="text-[13px] font-semibold text-gray-800 cursor-pointer border-b border-dashed border-gray-300 hover:border-gray-500"
              title="Click to rename"
            >
              {group.name}
            </span>
          )}
          <span className="relative group/info inline-flex items-center">
            <svg
              className="size-3.5 text-gray-400 hover:text-gray-600 cursor-help"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" strokeLinecap="round" />
              <circle cx="12" cy="8" r="0.5" fill="currentColor" />
            </svg>
            <span
              role="tooltip"
              className="invisible opacity-0 group-hover/info:visible group-hover/info:opacity-100 transition-opacity absolute top-full left-0 mt-1.5 z-20 w-64 px-3 py-2 rounded-md bg-gray-900 text-white text-[12px] leading-snug shadow-lg pointer-events-none"
            >
              Von uses this name to decide which channels to pull from when
              answering a question. Name it the way you'd describe it to a new
              teammate.
            </span>
          </span>
        </div>
        <button
          onClick={onRemove}
          className="text-gray-300 hover:text-gray-500 cursor-pointer p-0 border-none bg-transparent"
          aria-label="Remove category"
        >
          <svg
            className="size-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              d="M6 18L18 6M6 6l12 12"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Conditions */}
      <div className="px-4 pb-3 space-y-2">
        {group.conditions.map((condition, idx) => (
          <div key={condition._key ?? idx}>
            {idx > 0 && (
              <div className="py-1 text-xs text-gray-500 capitalize">
                {group.condition_logic === "and" ? "And" : "Or"}
              </div>
            )}
            <ConditionRow
              condition={condition}
              onChange={(c) => updateCondition(idx, c)}
              onRemove={() => removeCondition(idx)}
              canRemove={group.conditions.length > 1}
            />
          </div>
        ))}
      </div>

      {/* Footer actions — row 1: And/Or + Add Condition + Remove Group */}
      <div className="flex items-center px-4 pb-3">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onChange({ ...group, condition_logic: "and" })}
            className={`px-2.5 py-0.5 text-[11px] font-medium rounded border cursor-pointer ${
              group.condition_logic === "and"
                ? "bg-gray-800 text-white border-gray-800"
                : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
            }`}
          >
            And
          </button>
          <button
            onClick={() => onChange({ ...group, condition_logic: "or" })}
            className={`px-2.5 py-0.5 text-[11px] font-medium rounded border cursor-pointer ${
              group.condition_logic === "or"
                ? "bg-gray-800 text-white border-gray-800"
                : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
            }`}
          >
            Or
          </button>
        </div>

        <div className="flex items-center gap-4 ml-auto">
          {group.conditions.length < MAX_CONDITIONS_PER_GROUP && (
            <button
              onClick={addCondition}
              className="text-[12px] text-von-purple font-normal hover:text-von-purple-700 cursor-pointer p-0 border-none bg-transparent"
            >
              + Add New Condition
            </button>
          )}
          <button
            onClick={onRemove}
            className="text-[12px] text-gray-400 hover:text-red-500 cursor-pointer p-0 border-none bg-transparent"
          >
            Remove Category
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Main Component ---

interface SlackChannelConfigProps {
  value: SlackChannelConfigData;
  onChange: (data: SlackChannelConfigData) => void;
}

export function SlackChannelConfig({
  value,
  onChange,
}: SlackChannelConfigProps) {
  const categories = value.channel_categories.length
    ? value.channel_categories
    : defaultCategories();

  const totalGroups = getTotalGroupCount(categories);

  const updateCategory = (
    type: "external",
    updater: (cat: ChannelCategory) => ChannelCategory,
  ) => {
    const updated = categories.map((cat) =>
      cat.type === type ? updater(cat) : cat,
    );
    onChange({ ...value, channel_categories: updated });
  };

  const addGroup = (type: "external") => {
    if (totalGroups >= MAX_TOTAL_GROUPS) return;
    updateCategory(type, (cat) => ({
      ...cat,
      groups: [...cat.groups, createGroup("New Category")],
    }));
  };

  const updateGroup = (type: "external", idx: number, group: ChannelGroup) => {
    updateCategory(type, (cat) => {
      const groups = [...cat.groups];
      groups[idx] = group;
      return { ...cat, groups };
    });
  };

  const removeGroup = (type: "external", idx: number) => {
    updateCategory(type, (cat) => ({
      ...cat,
      groups: cat.groups.filter((_, i) => i !== idx),
    }));
  };

  const type = "external" as const;
  // Fall back to a fresh default if the backend payload is malformed or
  // missing the "external" entry — a non-null assertion here would crash
  // the whole panel on the first stale config it encounters.
  const cat = categories.find((c) => c.type === type) ?? defaultCategories()[0];
  const meta = CATEGORY_META[type];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-1">
          <h4 className={`text-[13px] font-semibold m-0 ${meta.color}`}>
            {meta.title}
          </h4>
          {totalGroups < MAX_TOTAL_GROUPS && (
            <button
              onClick={() => addGroup(type)}
              title="Adds another category OR-ed with the existing ones"
              className="text-[12px] text-slack-yellow hover:text-slack-yellow-dark cursor-pointer p-0 border-none bg-transparent font-medium"
            >
              + Add Category
            </button>
          )}
        </div>
        <p className="text-[12px] text-gray-500 mb-4 leading-relaxed">
          {meta.description}
        </p>

        <div className="space-y-3">
          {cat.groups.map((group, idx) => (
            <GroupCard
              key={group._key ?? idx}
              group={group}
              onChange={(g) => updateGroup(type, idx, g)}
              onRemove={() => removeGroup(type, idx)}
            />
          ))}
        </div>
      </div>

      {totalGroups >= MAX_TOTAL_GROUPS && (
        <p className="text-[12px] text-slack-yellow-dark m-0">
          Maximum of {MAX_TOTAL_GROUPS} categories reached.
        </p>
      )}
    </div>
  );
}
