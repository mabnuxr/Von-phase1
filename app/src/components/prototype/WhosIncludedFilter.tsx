/**
 * WhosIncludedFilter — modern, read-only display of the membership criteria
 * that determine who belongs to a team. Shared across the prototype
 * (TeamDetailPanel, Create a team v2.1, …) so the look stays consistent.
 *
 * Renders each condition as a soft "Field · Value" chip. The lock icon next to
 * the label signals the filter is read-only (authoring happens in chat).
 */

import { LockSimpleIcon } from "@phosphor-icons/react";

export interface WhosIncludedCondition {
  field: string;
  value: string;
}

export function WhosIncludedFilter({ conditions }: { conditions: WhosIncludedCondition[] }) {
  return (
    <div>
      {/* Label + read-only lock */}
      <div className="flex items-center gap-1.5 mb-3">
        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
          Who's included
        </span>
        <LockSimpleIcon size={12} className="text-gray-300" />
      </div>

      {/* Condition chips */}
      <div className="flex flex-wrap items-center gap-2">
        {conditions.map((c, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-gray-50 border border-gray-200/70"
          >
            <span className="font-medium text-gray-500">{c.field}</span>
            <span className="text-gray-300">·</span>
            <span className="font-semibold text-gray-700">{c.value}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
