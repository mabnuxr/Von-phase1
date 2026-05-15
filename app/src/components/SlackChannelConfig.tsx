import { useState } from "react";
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
  channel_id: "Channel ID",
  channel_topic: "Channel Topic",
};

const OPERATOR_LABELS: Record<ChannelCondition["operator"], string> = {
  starts_with: "Starts with",
  contains: "Contains",
  ends_with: "Ends with",
  sfdc_field_link: "SFDC field link",
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

function createCondition(): ChannelCondition {
  return { field: "channel_name", operator: "starts_with", value: "" };
}

function createGroup(name: string): ChannelGroup {
  return {
    name,
    conditions: [createCondition()],
    condition_logic: "or",
  };
}

function defaultCategories(): ChannelCategory[] {
  return [{ type: "external", groups: [createGroup("Customer channels")] }];
}

function getTotalGroupCount(categories: ChannelCategory[]): number {
  return categories.reduce((sum, cat) => sum + cat.groups.length, 0);
}

// --- Sub-components ---

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
  return (
    <div className="flex items-center gap-2">
      <select
        value={condition.field}
        onChange={(e) =>
          onChange({
            ...condition,
            field: e.target.value as ChannelCondition["field"],
          })
        }
        className="px-2.5 py-1.5 text-[13px] border border-gray-200 rounded-md bg-white text-gray-700 shrink-0"
      >
        {Object.entries(FIELD_LABELS).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>

      <select
        value={condition.operator}
        onChange={(e) =>
          onChange({
            ...condition,
            operator: e.target.value as ChannelCondition["operator"],
          })
        }
        className="px-2.5 py-1.5 text-[13px] border border-gray-200 rounded-md bg-white text-gray-700 shrink-0"
      >
        {Object.entries(OPERATOR_LABELS).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>

      <input
        type="text"
        value={condition.value}
        onChange={(e) => onChange({ ...condition, value: e.target.value })}
        placeholder={
          condition.operator === "sfdc_field_link"
            ? "Opportunity.Slack_Channel__c"
            : "e.g., ext-"
        }
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
            className="text-[13px] font-semibold text-gray-800 cursor-pointer border-b border-dashed border-transparent hover:border-gray-300"
            title="Click to rename"
          >
            {group.name}
          </span>
        )}
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
          <div key={idx}>
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
            Remove Group
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
    const defaultName =
      type === "external" ? "Customer channels" : "Team channels";
    updateCategory(type, (cat) => ({
      ...cat,
      groups: [...cat.groups, createGroup(defaultName)],
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
  const cat = categories.find((c) => c.type === type)!;
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
              title="Adds another group OR-ed with the existing ones"
              className="text-[12px] text-slack-yellow hover:text-slack-yellow-dark cursor-pointer p-0 border-none bg-transparent font-medium"
            >
              + Add group
            </button>
          )}
        </div>
        <p className="text-[12px] text-gray-500 mb-4 leading-relaxed">
          {meta.description}
        </p>

        <div className="space-y-3">
          {cat.groups.map((group, idx) => (
            <GroupCard
              key={idx}
              group={group}
              onChange={(g) => updateGroup(type, idx, g)}
              onRemove={() => removeGroup(type, idx)}
            />
          ))}
        </div>
      </div>

      {totalGroups >= MAX_TOTAL_GROUPS && (
        <p className="text-[12px] text-slack-yellow-dark m-0">
          Maximum of {MAX_TOTAL_GROUPS} groups reached.
        </p>
      )}
    </div>
  );
}
