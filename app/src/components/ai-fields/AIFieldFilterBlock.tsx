/**
 * AIFieldFilterBlock — Collapsible filter block.
 * Renders pre-parsed conditions from the backend's displayFilter.
 */

import React, { useState } from "react";
import { CaretDown as CaretDownIcon } from "@phosphor-icons/react";
import type { DisplayFilterCondition } from "../../types/vonAiFields";

interface AIFieldFilterBlockProps {
  conditions: DisplayFilterCondition[];
}

export function AIFieldFilterBlock({ conditions }: AIFieldFilterBlockProps) {
  const [collapsed, setCollapsed] = useState(false);

  if (conditions.length === 0) return null;

  return (
    <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center gap-2 px-3.5 py-2.5 bg-gray-50 border-b border-gray-100 cursor-pointer text-left"
      >
        <CaretDownIcon
          size={14}
          className={`text-gray-400 transition-transform ${collapsed ? "-rotate-90" : ""}`}
        />
        <span className="text-sm font-medium text-gray-900">Run Criteria</span>
        <span className="text-xs text-gray-400">
          {conditions.length} condition{conditions.length !== 1 ? "s" : ""}
        </span>
        <span className="flex-1" />
      </button>

      {/* Body */}
      {!collapsed && (
        <div className="px-3.5 py-3">
          <div
            className="grid gap-y-1.5 gap-x-2 items-center"
            style={{
              gridTemplateColumns:
                conditions.length > 1
                  ? "36px auto auto minmax(0, auto)"
                  : "auto auto minmax(0, auto)",
            }}
          >
            {conditions.map((cond, i) => (
              <React.Fragment key={i}>
                {/* Connector — hidden when single condition */}
                {conditions.length > 1 && (
                  <span className="text-center text-[10px] font-bold tracking-[0.1em] text-gray-400">
                    {cond.connector ?? <span className="invisible">AND</span>}
                  </span>
                )}

                {/* Field */}
                <span className="h-7 flex items-center pl-[10px] pr-[8px] bg-white border border-gray-200 rounded-md text-xs text-gray-900 hover:border-gray-300 hover:bg-gray-50 transition-colors cursor-default whitespace-nowrap">
                  <span className="flex-1">{cond.field}</span>
                  <CaretDownIcon
                    size={10}
                    className="text-gray-400 shrink-0 ml-[6px]"
                  />
                </span>

                {/* Operator */}
                <span className="h-7 flex items-center pl-[10px] pr-[8px] bg-white border border-gray-200 rounded-md text-xs text-gray-500 hover:border-gray-300 hover:bg-gray-50 transition-colors cursor-default whitespace-nowrap">
                  <span className="flex-1">{cond.operator || "\u00A0"}</span>
                  <CaretDownIcon
                    size={10}
                    className="text-gray-400 shrink-0 ml-[6px]"
                  />
                </span>

                {/* Value */}
                <span
                  className="h-7 flex items-center pl-[10px] pr-[8px] bg-white border border-gray-200 rounded-md text-xs text-gray-900 hover:border-gray-300 hover:bg-gray-50 transition-colors cursor-default min-w-0"
                  title={cond.value || undefined}
                >
                  <span className="flex-1 truncate">
                    {cond.value || "\u00A0"}
                  </span>
                  <CaretDownIcon
                    size={10}
                    className="text-gray-400 shrink-0 ml-[6px]"
                  />
                </span>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
