// Tenant role labels. Must match `services/tenant_service.py::initialize_default_roles`.
export const ROLES = {
  ADMIN: "Admin",
  MEMBER: "Member",
  VIEW_ONLY: "View Only",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
