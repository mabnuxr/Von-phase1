import { useNavigate, useParams } from "react-router-dom";
import { CheckIcon } from "@phosphor-icons/react";
import { useAuthCheck } from "../hooks/useAuthCheck";
import { SettingsLayout } from "../components/SettingsLayout";
import { SettingsPageLayout } from "../components/settings/SettingsPageLayout";

// ─── Permission data ──────────────────────────────────────────────────────────

interface Permission {
  key: string;
  description: string;
}

interface PermissionGroup {
  label: string;
  permissions: Permission[];
}

const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    label: "Workspace & App",
    permissions: [
      { key: "app.use", description: "Sign in and use the application" },
      { key: "workspace.settings.view", description: "View workspace settings" },
      { key: "workspace.settings.edit", description: "Edit workspace-level settings" },
      { key: "workspace.billing.manage", description: "Manage billing and subscriptions" },
    ],
  },
  {
    label: "Chats",
    permissions: [
      { key: "chat.create", description: "Start new conversations" },
      { key: "chat.read_own", description: "Read your own conversations" },
      { key: "chat.read_shared", description: "Read conversations shared with you" },
      { key: "chat.read_all", description: "Read all conversations in the workspace" },
      { key: "chat.continue_shared", description: "Continue a shared conversation" },
      { key: "chat.share", description: "Share a conversation with others" },
      { key: "chat.delete_own", description: "Delete your own conversations" },
      { key: "chat.delete_any", description: "Delete any conversation in the workspace" },
    ],
  },
  {
    label: "Dashboards",
    permissions: [
      { key: "dashboard.create", description: "Create new dashboards" },
      { key: "dashboard.read_own", description: "View your own dashboards" },
      { key: "dashboard.read_shared", description: "View dashboards shared with you" },
      { key: "dashboard.read_all", description: "View all dashboards in the workspace" },
      { key: "dashboard.edit_own", description: "Edit your own dashboards" },
      { key: "dashboard.edit_any", description: "Edit any dashboard in the workspace" },
      { key: "dashboard.share", description: "Share dashboards with others" },
      { key: "dashboard.delete_own", description: "Delete your own dashboards" },
      { key: "dashboard.delete_any", description: "Delete any dashboard" },
      { key: "dashboard.folder.create", description: "Create dashboard folders" },
      { key: "dashboard.folder.manage", description: "Manage and reorganise folders" },
    ],
  },
  {
    label: "Commands",
    permissions: [
      { key: "command.create", description: "Create new commands" },
      { key: "command.invoke", description: "Run commands" },
      { key: "command.edit_own", description: "Edit your own commands" },
      { key: "command.edit_any", description: "Edit any command in the workspace" },
      { key: "command.share", description: "Share commands with the workspace" },
      { key: "command.delete_own", description: "Delete your own commands" },
      { key: "command.delete_any", description: "Delete any command" },
    ],
  },
  {
    label: "Memory",
    permissions: [
      { key: "memory.user.read", description: "Read your personal memory" },
      { key: "memory.user.write", description: "Write to your personal memory" },
      { key: "memory.org.read", description: "Read org-level memory" },
      { key: "memory.org.write", description: "Write to org-level memory" },
      { key: "memory.group.read", description: "Read group memory" },
      { key: "memory.group.write", description: "Write to group memory" },
    ],
  },
  {
    label: "AI Fields",
    permissions: [
      { key: "aicolumn.create", description: "Create AI field definitions" },
      { key: "aicolumn.edit", description: "Edit AI field definitions" },
      { key: "aicolumn.use", description: "Run and use AI fields" },
      { key: "aicolumn.delete", description: "Delete AI field definitions" },
    ],
  },
  {
    label: "Integrations",
    permissions: [
      { key: "integration.use", description: "Use connected integrations" },
      { key: "integration.connect_personal", description: "Connect personal integrations" },
      { key: "integration.connect_org", description: "Connect org-wide integrations" },
      { key: "integration.manage", description: "Manage and remove integrations" },
    ],
  },
  {
    label: "Groups & Membership",
    permissions: [
      { key: "group.view", description: "View groups and team membership" },
      { key: "group.be_assigned", description: "Be assigned to a group" },
      { key: "group.create", description: "Create new groups" },
      { key: "group.manage", description: "Edit and delete groups" },
      { key: "member.invite", description: "Invite new workspace members" },
      { key: "member.remove", description: "Remove workspace members" },
      { key: "member.role.assign", description: "Assign roles to members" },
    ],
  },
  {
    label: "Sharing",
    permissions: [
      { key: "artifact.create", description: "Create shareable artifacts" },
      { key: "artifact.read", description: "Read artifacts" },
      { key: "artifact.edit", description: "Edit artifacts" },
      { key: "artifact.share", description: "Share artifacts externally" },
      { key: "share.manage_own", description: "Manage sharing on your own content" },
      { key: "share.manage_any", description: "Manage sharing on any content" },
      { key: "share.general_access.set", description: "Set general access level for shares" },
      { key: "usage.view_own", description: "View your own usage stats" },
      { key: "usage.view_all", description: "View all workspace usage stats" },
    ],
  },
];

const MEMBER_PERMISSIONS = new Set([
  "app.use", "workspace.settings.view",
  "chat.create", "chat.read_own", "chat.read_shared", "chat.continue_shared",
  "chat.share", "chat.delete_own",
  "dashboard.create", "dashboard.read_own", "dashboard.read_shared",
  "dashboard.edit_own", "dashboard.share", "dashboard.delete_own",
  "dashboard.folder.create", "dashboard.folder.manage",
  "aicolumn.create", "aicolumn.edit", "aicolumn.use",
  "command.create", "command.invoke", "command.edit_own",
  "command.share", "command.delete_own",
  "artifact.create", "artifact.read", "artifact.edit", "artifact.share",
  "memory.user.read", "memory.user.write", "memory.org.read", "memory.group.read",
  "integration.use", "integration.connect_personal",
  "group.view", "group.be_assigned",
  "share.manage_own", "share.general_access.set", "usage.view_own",
]);

const VIEW_ONLY_PERMISSIONS = new Set([
  "app.use",
  "chat.read_shared",
  "dashboard.read_shared",
  "artifact.read",
  "memory.user.read",
  "group.view",
  "group.be_assigned",
  "usage.view_own",
]);

const ALL_KEYS = new Set(
  PERMISSION_GROUPS.flatMap((g) => g.permissions.map((p) => p.key)),
);

// ─── Component ────────────────────────────────────────────────────────────────

export default function RoleDetail() {
  useAuthCheck();
  const navigate = useNavigate();
  const { role } = useParams<{ role: string }>();

  const isAdmin = role === "admin";
  const isViewOnly = role === "view-only";
  const roleName = isAdmin ? "Admin" : isViewOnly ? "View Only" : "Member";
  const grantedKeys = isAdmin ? ALL_KEYS : isViewOnly ? VIEW_ONLY_PERMISSIONS : MEMBER_PERMISSIONS;
  const totalCount = ALL_KEYS.size;
  const grantedCount = [...ALL_KEYS].filter((k) => grantedKeys.has(k)).length;
  const personCount = isAdmin ? 1 : isViewOnly ? 2 : 0;

  return (
    <SettingsLayout activeId="permissions">
      <SettingsPageLayout
        breadcrumb={{
          label: "Roles & Permissions",
          onClick: () => navigate("/settings/permissions"),
        }}
        title={roleName}
        badge={{ text: "System role" }}
        subtitle={`${personCount} ${personCount === 1 ? "person" : "people"} · ${grantedCount} of ${totalCount} permissions · Read-only`}
        headerRight={
          <button
            disabled
            className="border border-gray-200 text-gray-400 text-sm font-medium px-3.5 py-2 rounded-lg cursor-not-allowed opacity-50 flex items-center gap-2"
          >
            Edit with Von
          </button>
        }
      >
        {/* Permission table */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide w-64">
                  Permission
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Description
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide w-24">
                  Access
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {PERMISSION_GROUPS.map((group) => {
                const grantedPerms = group.permissions.filter((p) => grantedKeys.has(p.key));
                if (grantedPerms.length === 0) return null;
                return (
                  <>
                    <tr key={`divider-${group.label}`} className="bg-gray-50/80">
                      <td
                        colSpan={3}
                        className="px-6 py-2 text-xs font-semibold text-gray-400 uppercase tracking-widest"
                      >
                        {group.label}
                      </td>
                    </tr>
                    {grantedPerms.map((perm) => (
                      <tr key={perm.key} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-3 whitespace-nowrap">
                          <code className="text-xs font-mono text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">
                            {perm.key}
                          </code>
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-600">
                          {perm.description}
                        </td>
                        <td className="px-6 py-3">
                          <CheckIcon size={15} weight="bold" className="text-gray-900" />
                        </td>
                      </tr>
                    ))}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </SettingsPageLayout>
    </SettingsLayout>
  );
}
