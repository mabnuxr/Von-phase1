import type {
  DashboardUserGrantRequest,
  ShareDashboardV2Request,
} from "../../../../services/dashboardService";
import type { DashboardUserGrant } from "../../../../types/dashboard";

export function grantsToRequest(
  grants: DashboardUserGrant[],
): DashboardUserGrantRequest[] {
  return grants.map((g) => ({ user_id: g.user_id, role: g.role }));
}

export interface BuildSharePayloadArgs {
  currentScope: "restricted" | "tenant";
  currentUserGrants: DashboardUserGrant[];
  currentSharedDataScope: string | null;
  overrides: Partial<ShareDashboardV2Request>;
}

export function buildSharePayload({
  currentScope,
  currentUserGrants,
  currentSharedDataScope,
  overrides,
}: BuildSharePayloadArgs): ShareDashboardV2Request {
  return {
    is_shared_with_tenant: currentScope === "tenant",
    user_grants: grantsToRequest(currentUserGrants),
    shared_data_scope: currentSharedDataScope,
    ...overrides,
  };
}
