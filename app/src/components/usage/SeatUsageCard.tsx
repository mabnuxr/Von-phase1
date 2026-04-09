import { useNumericEntitlement } from "@stigg/react-sdk";
import { useUser } from "../../hooks/useUser";
import { useTeamMembers } from "../../hooks/useTeam";
import { UsersIcon } from "@phosphor-icons/react";

export function SeatUsageCard() {
  const { user } = useUser();
  const { data: members } = useTeamMembers(user?.tenantId);
  const entitlement = useNumericEntitlement({
    featureId: "feature-users",
  });

  const currentCount = members?.length ?? 0;
  const limit = entitlement?.value ?? null;
  const percentage = limit ? Math.round((currentCount / limit) * 100) : 0;

  const barColor =
    percentage >= 90
      ? "bg-red-500"
      : percentage >= 70
        ? "bg-amber-500"
        : "bg-von-purple-500";

  return (
    <div className="rounded-xl border border-gray-200 p-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center">
            <UsersIcon size={16} className="text-gray-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Users</p>
            <p className="text-xs text-gray-500">
              Team members in this workspace
            </p>
          </div>
        </div>
        <span className="text-sm text-gray-500">
          {limit ? `${currentCount} / ${limit}` : `${currentCount}`}
        </span>
      </div>

      {limit && (
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}
