import { BuildingsIcon, LockSimpleIcon } from "@phosphor-icons/react";
import { Tooltip } from "@vonlabs/design-components";

interface CreatorChipProps {
  currentScope: "restricted" | "tenant";
  creatorName: string | null;
  isCreatorLoading: boolean;
}

export function CreatorChip({
  currentScope,
  creatorName,
  isCreatorLoading,
}: CreatorChipProps) {
  return (
    <span className="flex items-center gap-1 text-xs bg-gray-50 border border-gray-100 rounded-full px-2.5 py-1.5 leading-none whitespace-nowrap">
      <Tooltip
        content={
          currentScope === "tenant"
            ? "This dashboard is shared with your organization"
            : "This dashboard is private"
        }
      >
        <span className="inline-flex items-center justify-center text-gray-700 cursor-default">
          {currentScope === "tenant" ? (
            <BuildingsIcon size={14} />
          ) : (
            <LockSimpleIcon size={14} />
          )}
        </span>
      </Tooltip>
      <span className="text-gray-800">Created by</span>
      {isCreatorLoading ? (
        <span className="bg-gray-200 rounded animate-pulse w-16 h-3" />
      ) : (
        <span className="text-gray-800 font-medium">{creatorName}</span>
      )}
    </span>
  );
}
