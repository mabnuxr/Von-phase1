import { apiClient } from "./apiClient";

/**
 * Team member from backend API
 */
export interface TeamMemberUsage {
  total: number;
  last_week: number;
  last_month: number;
}

export interface TeamMemberPermissions {
  sfdc_write: boolean;
}

export interface TeamMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  joinedDate: string | null;
  isActive: boolean;
  usage: TeamMemberUsage;
  permissions?: TeamMemberPermissions;
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
 * Request to add a team member
 */
export interface AddTeamMemberRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

/**
 * Response when listing team members
 */
interface TeamMembersListResponse {
  members: TeamMember[];
  total: number;
}

/**
 * Response when listing roles
 */
interface RolesListResponse {
  roles: Role[];
}

/**
 * Response when removing a team member
 */
interface RemoveTeamMemberResponse {
  success: boolean;
  message: string;
}

/**
 * Team Service - Handles team management API calls
 */
export class TeamService {
  /**
   * Get all team members for the current tenant
   */
  async getTeamMembers(): Promise<TeamMember[]> {
    const response = await apiClient.get<TeamMembersListResponse>(
      "/api/v1/team/members",
    );
    return response.members;
  }

  /**
   * Add a new team member
   */
  async addTeamMember(data: AddTeamMemberRequest): Promise<TeamMember> {
    const response = await apiClient.post<TeamMember>(
      "/api/v1/team/members",
      data,
    );
    return response;
  }

  /**
   * Remove a team member
   */
  async removeTeamMember(userId: string): Promise<RemoveTeamMemberResponse> {
    const response = await apiClient.delete<RemoveTeamMemberResponse>(
      `/api/v1/team/members/${userId}`,
    );
    return response;
  }

  /**
   * Get available roles for the current tenant
   */
  async getRoles(): Promise<Role[]> {
    const response =
      await apiClient.get<RolesListResponse>("/api/v1/team/roles");
    return response.roles;
  }

  /**
   * Update a team member's details (name, role)
   */
  async updateMember(
    userId: string,
    data: UpdateMemberRequest,
  ): Promise<UpdateMemberResponse> {
    return apiClient.patch<UpdateMemberResponse>(
      `/api/v1/team/members/${userId}`,
      data,
    );
  }

  /**
   * Update per-user permissions (admin only)
   */
  async updateMemberPermissions(
    userId: string,
    permissions: UpdateMemberPermissionsRequest,
  ): Promise<UpdateMemberPermissionsResponse> {
    return apiClient.patch<UpdateMemberPermissionsResponse>(
      `/api/v1/team/members/${userId}/permissions`,
      permissions,
    );
  }
}

export interface UpdateMemberRequest {
  firstName?: string;
  lastName?: string;
  role?: string;
}

export interface UpdateMemberResponse {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  message: string;
}

export interface UpdateMemberPermissionsRequest {
  sfdc_write: boolean | null;
}

export interface UpdateMemberPermissionsResponse {
  user_id: string;
  permissions: {
    sfdc_write: boolean;
  };
  message: string;
}

export const teamService = new TeamService();
