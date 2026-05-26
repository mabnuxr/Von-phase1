import { apiClient } from "./apiClient";
import type { BulkImportTenantMemberRowResult } from "../types/userChannelEvents";

/**
 * Tenant member from backend API
 */
export interface TenantMemberUsage {
  total: number;
  last_week: number;
  last_month: number;
}

export interface TenantMemberPermissions {
  sfdc_write: boolean;
  hubspot_write?: boolean;
}

export interface TenantMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  timezone?: string;
  joinedDate: string | null;
  isActive: boolean;
  usage: TenantMemberUsage;
  permissions?: TenantMemberPermissions;
}

/**
 * Role information
 */
export interface Role {
  name: string;
  displayName: string;
  description: string;
}

/**
 * Request to add a tenant member
 */
export interface AddTenantMemberRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

/**
 * Response from a bulk tenant-member import.
 *
 * `results` echoes every input row classified by status. The summary is the
 * source of truth for how many rows landed in each state — Pusher progress
 * events feed the live progress bar, but this response is what the UI
 * renders the final results table from.
 */
export interface BulkImportSummary {
  created: number;
  skipped: number;
  errors: number;
}

export interface BulkImportTenantMemberResponse {
  jobId: string;
  summary: BulkImportSummary;
  results: BulkImportTenantMemberRowResult[];
}

/**
 * Response when listing tenant members
 */
interface TenantMembersListResponse {
  members: TenantMember[];
  total: number;
}

/**
 * Response when listing roles
 */
interface RolesListResponse {
  roles: Role[];
}

/**
 * Response when removing a tenant member
 */
interface RemoveTenantMemberResponse {
  success: boolean;
  message: string;
}

/**
 * Tenant Members Service - Handles tenant-member administration API calls
 */
export class TenantMembersService {
  /**
   * Get all tenant members for the current tenant
   */
  async getTenantMembers(): Promise<TenantMember[]> {
    const response = await apiClient.get<TenantMembersListResponse>(
      "/api/v1/tenant-members/members",
    );
    return response.members;
  }

  /**
   * Add a new tenant member
   */
  async addTenantMember(data: AddTenantMemberRequest): Promise<TenantMember> {
    const response = await apiClient.post<TenantMember>(
      "/api/v1/tenant-members/members",
      data,
    );
    return response;
  }

  /**
   * Bulk-import tenant members from a CSV file.
   *
   * The caller generates `jobId` (uuid) and subscribes to user-channel
   * `bulk_import_progress` events keyed by it before the call resolves,
   * so live per-row progress flows in via Pusher while the request is in
   * flight. The HTTP response is the canonical source of truth.
   */
  async bulkImportTenantMembers(
    file: File,
    jobId: string,
  ): Promise<BulkImportTenantMemberResponse> {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("jobId", jobId);
    return apiClient.postMultipart<BulkImportTenantMemberResponse>(
      "/api/v1/tenant-members/members/bulk-import",
      fd,
    );
  }

  /**
   * Remove a tenant member
   */
  async removeTenantMember(
    userId: string,
  ): Promise<RemoveTenantMemberResponse> {
    const response = await apiClient.delete<RemoveTenantMemberResponse>(
      `/api/v1/tenant-members/members/${userId}`,
    );
    return response;
  }

  /**
   * Get available roles for the current tenant
   */
  async getRoles(): Promise<Role[]> {
    const response = await apiClient.get<RolesListResponse>(
      "/api/v1/tenant-members/roles",
    );
    return response.roles;
  }

  /**
   * Update a tenant member's details (name, role)
   */
  async updateTenantMember(
    userId: string,
    data: UpdateTenantMemberRequest,
  ): Promise<UpdateTenantMemberResponse> {
    return apiClient.patch<UpdateTenantMemberResponse>(
      `/api/v1/tenant-members/members/${userId}`,
      data,
    );
  }

  /**
   * Update per-user permissions (admin only)
   */
  async updateTenantMemberPermissions(
    userId: string,
    permissions: UpdateMemberPermissionsRequest,
  ): Promise<UpdateMemberPermissionsResponse> {
    return apiClient.patch<UpdateMemberPermissionsResponse>(
      `/api/v1/tenant-members/members/${userId}/permissions`,
      permissions,
    );
  }

  /**
   * Get a single tenant member by user id.
   *
   * The new endpoint lives at /tenant-members/members/{user_id} (aligned
   * with PATCH/DELETE on the same resource) — this is the one path in the
   * migration that does not follow a verbatim s/team/tenant-members/ rename.
   */
  async getTenantMember(userId: string): Promise<TenantMember> {
    return apiClient.get<TenantMember>(
      `/api/v1/tenant-members/members/${userId}`,
    );
  }
}

export interface UpdateTenantMemberRequest {
  firstName?: string;
  lastName?: string;
  role?: string;
  timezone?: string;
}

export interface UpdateTenantMemberResponse {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  timezone?: string;
  message: string;
}

export interface UpdateMemberPermissionsRequest {
  sfdc_write?: boolean | null;
  hubspot_write?: boolean | null;
}

export interface UpdateMemberPermissionsResponse {
  user_id: string;
  permissions: {
    sfdc_write?: boolean;
    hubspot_write?: boolean;
  };
  message: string;
}

export const tenantMembersService = new TenantMembersService();
