import { WarningIcon } from "@phosphor-icons/react";
import { DashboardStatus } from "../../../../types/dashboard";

interface VersionPreviewChipProps {
  status: DashboardStatus;
  dashboardVersion: number;
  latestPublishedVersion: number | null;
}

// Suffix tells the user what KIND of snapshot they're on: a draft, a
// non-latest published archive, or the live latest published version.
function suffixFor(
  status: DashboardStatus,
  dashboardVersion: number,
  latestPublishedVersion: number | null,
): string {
  const isPublished = status === DashboardStatus.Published;
  if (!isPublished) return "(draft)";
  const isLatestLive =
    latestPublishedVersion !== null &&
    dashboardVersion === latestPublishedVersion;
  return isLatestLive ? "(published - latest)" : "(published)";
}

export function VersionPreviewChip({
  status,
  dashboardVersion,
  latestPublishedVersion,
}: VersionPreviewChipProps) {
  return (
    <span className="flex items-center gap-1 text-xs rounded-full px-2.5 py-1.5 leading-none border bg-amber-50 border-amber-200 text-amber-800 whitespace-nowrap">
      <WarningIcon
        size={12}
        weight="fill"
        className="shrink-0 text-amber-600"
      />
      You are previewing{" "}
      <span className="font-semibold">v{dashboardVersion}</span>{" "}
      {suffixFor(status, dashboardVersion, latestPublishedVersion)}
    </span>
  );
}
