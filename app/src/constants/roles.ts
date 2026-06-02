// Canonical tenant role names — must match the labels seeded by the
// backend in `services/tenant_service.py::initialize_default_roles`. Any
// drift between these and the backend silently disables role-gated UI.
export const ROLES = {
  ADMIN: "Admin",
  MEMBER: "Member",
  VIEW_ONLY: "View Only",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
