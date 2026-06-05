/**
 * Scripted scenario data for the prototype chat player.
 * All names, counts, and emails derive from prototypeData — no hardcoding.
 */

import {
  WORKSPACE_MEMBERS,
  SAM_DIRECT_REPORTS,
  SALESFORCE_ONLY_USERS,
  BULK_PROVISION,
  TEAMS,
  ARTIFACTS,
  INTEGRATION,
} from "../../mocks/prototypeData";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function member(id: string) {
  const m = WORKSPACE_MEMBERS.find((u) => u.id === id)!;
  return m;
}

function sfUser(id: string) {
  return SALESFORCE_ONLY_USERS.find((u) => u.id === id)!;
}

function teamMembers(ids: string[]) {
  return ids.map((id) => member(id));
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type MessageRole = "user" | "assistant";

export interface ChatCardSpec {
  variant: "approval" | "summary" | "diff" | "status" | "team";
  title?: string;
  approvalItems?: Array<{ name: string; email: string; role: "Admin" | "Member" }>;
  summaryLines?: Array<{ text: string; tone: "success" | "warning" | "neutral" }>;
  diffItems?: Array<{ name: string; email: string; changeType: "added" | "removed" | "changed" }>;
  statusMessage?: string;
  statusTone?: "success" | "error";
  // "team" variant
  teamName?: string;
  teamMemberCount?: number;
  teamStatus?: string;
}

export interface ScenarioMessage {
  role: MessageRole;
  text: string;
  card?: ChatCardSpec;
}

export interface Scenario {
  id: string;
  label: string;
  group: "groups" | "provisioning" | "sharing";
  messages: ScenarioMessage[];
}

// ─── Derived constants ────────────────────────────────────────────────────────

const es = TEAMS.enterpriseSales;
const esAdmin = member(es.teamAdmin!); // Elena Vasquez
const esMembers = teamMembers(es.members); // the 5 explicitly listed

// Reporting-line members (Sam's 5 direct reports)
const reportingLineMembers = teamMembers(SAM_DIRECT_REPORTS);
const reportingLineCount = SAM_DIRECT_REPORTS.length; // 5

// Individual provisioning target
const newUser = sfUser("sf1"); // Kevin Thornton

// Add-to-group targets (workspace members not in Enterprise Sales)
const addTarget1 = member("u6"); // Alicia Romero (SDR)
const addTarget2 = member("u7"); // James Okafor (CSM)
const addedCount = es.memberCount + 2; // 9

// Non-workspace add target
const sfTarget = sfUser("sf2"); // Marie Dalsgaard

// Promote-to-admin target
const promoteTarget = member("u3"); // Marcus Webb

// Share targets
const shareUser = member("u4"); // Priya Nair

// Scope: total Salesforce users minus Enterprise Sales memberCount
const scopeLostAccess = 179 - es.memberCount; // 172

// ─── Scenarios ────────────────────────────────────────────────────────────────

export const SCENARIOS: Scenario[] = [
  // ── Groups ──────────────────────────────────────────────────────────────────

  {
    id: "create-group",
    label: "Create a team",
    group: "groups",
    messages: [
      {
        role: "user",
        text: `Create a team called ${es.name}. It should include all AEs and AE Managers.`,
      },
      {
        role: "assistant",
        text: `I found ${es.memberCount} people matching that criteria. I've opened a draft on the right. Does the filter look right, or do you want to adjust it?`,
      },
      {
        role: "user",
        text: "Looks right. Create it.",
      },
      {
        role: "assistant",
        text: `Done. ${es.name} team created with ${es.memberCount} members.`,
        card: {
          variant: "status",
          statusMessage: `${es.name} created · ${es.memberCount} members`,
          statusTone: "success",
        },
      },
    ],
  },

  {
    id: "inspect-group",
    label: "Inspect a team",
    group: "groups",
    messages: [
      {
        role: "user",
        text: `Show me the ${es.name} team.`,
      },
      {
        role: "assistant",
        text: `Here's the ${es.name} team — ${es.members.length} members, synced from Salesforce. ${esAdmin.name} is the Team Admin.`,
        card: {
          variant: "team",
          teamName: es.name,
          teamMemberCount: es.members.length,
          teamStatus: "Active",
        },
      },
      {
        role: "user",
        text: "Who's in this team?",
      },
      {
        role: "assistant",
        text: `${esMembers.map((m) => `**${m.name}** (${m.sfRole})`).join(", ")}. ${esAdmin.name} is the Team Admin.`,
      },
    ],
  },

  {
    id: "add-users-to-group",
    label: "Add users to a team",
    group: "groups",
    messages: [
      {
        role: "user",
        text: `Add ${addTarget1.name} and ${addTarget2.name} to the ${es.name} team.`,
      },
      {
        role: "assistant",
        text: `I'll add both to **${es.name}**. They're already workspace members, so no invitation needed. Here's the change:`,
        card: {
          variant: "diff",
          diffItems: [
            { name: addTarget1.name, email: addTarget1.email, changeType: "added" },
            { name: addTarget2.name, email: addTarget2.email, changeType: "added" },
          ],
        },
      },
      {
        role: "user",
        text: "Apply it.",
      },
      {
        role: "assistant",
        text: `Done. ${addTarget1.name} and ${addTarget2.name} are now members of **${es.name}**. The team now has ${addedCount} members.`,
        card: {
          variant: "status",
          statusMessage: `2 members added · ${es.name} now has ${addedCount} members`,
          statusTone: "success",
        },
      },
    ],
  },

  {
    id: "add-non-workspace-users",
    label: "Add non-workspace users to a team",
    group: "groups",
    messages: [
      {
        role: "user",
        text: `Add ${sfTarget.email} to the ${es.name} team. She's not in Von yet.`,
      },
      {
        role: "assistant",
        text: `${sfTarget.name} isn't a workspace member yet. I'll send her an invitation and add her to **${es.name}** once she accepts. Here's what will happen:`,
        card: {
          variant: "summary",
          summaryLines: [
            { text: `Invitation sent to ${sfTarget.email}`, tone: "success" },
            { text: `Will be added to ${es.name} on first sign-in`, tone: "neutral" },
            { text: "Role will default to Member", tone: "neutral" },
          ],
        },
      },
      {
        role: "user",
        text: "Send it.",
      },
      {
        role: "assistant",
        text: `Invitation sent to **${sfTarget.email}**. ${sfTarget.name} will appear in ${es.name} as soon as she accepts and signs in.`,
        card: {
          variant: "status",
          statusMessage: `Invitation sent to ${sfTarget.name} · Pending acceptance`,
          statusTone: "success",
        },
      },
    ],
  },

  {
    id: "make-group-admin",
    label: "Make Team Admin",
    group: "groups",
    messages: [
      {
        role: "user",
        text: `Make ${promoteTarget.name} a Team Admin of the ${es.name} team.`,
      },
      {
        role: "assistant",
        text: `I'll promote ${promoteTarget.name} to Team Admin of **${es.name}**. As a Team Admin they'll be able to manage team membership and see team-scoped memory.`,
        card: {
          variant: "diff",
          diffItems: [
            { name: promoteTarget.name, email: promoteTarget.email, changeType: "changed" },
          ],
        },
      },
      {
        role: "user",
        text: "Yes, do it.",
      },
      {
        role: "assistant",
        text: `${promoteTarget.name} is now a Team Admin of **${es.name}**.`,
        card: {
          variant: "status",
          statusMessage: `${promoteTarget.name} promoted to Team Admin`,
          statusTone: "success",
        },
      },
    ],
  },

  {
    id: "remove-group-admin",
    label: "Remove Team Admin",
    group: "groups",
    messages: [
      {
        role: "user",
        text: `Remove ${esAdmin.name} as Team Admin of ${es.name}. Keep them as a regular member.`,
      },
      {
        role: "assistant",
        text: `I'll remove ${esAdmin.name}'s Team Admin role in **${es.name}**. They'll remain a member of the team.`,
        card: {
          variant: "diff",
          diffItems: [
            { name: esAdmin.name, email: esAdmin.email, changeType: "changed" },
          ],
        },
      },
      {
        role: "user",
        text: "Confirm.",
      },
      {
        role: "assistant",
        text: `Done. ${esAdmin.name} is now a regular member of **${es.name}**.`,
        card: {
          variant: "status",
          statusMessage: `${esAdmin.name}'s Team Admin role removed`,
          statusTone: "success",
        },
      },
    ],
  },

  // ── Provisioning ─────────────────────────────────────────────────────────────

  {
    id: "individual-provisioning",
    label: "Individual provisioning",
    group: "provisioning",
    messages: [
      {
        role: "user",
        text: `Invite ${newUser.email} as a Member.`,
      },
      {
        role: "assistant",
        text: `I'll invite **${newUser.email}** with the Member role. ${newUser.name} will receive an email to set up their account.`,
        card: {
          variant: "approval",
          approvalItems: [
            { name: newUser.name, email: newUser.email, role: "Member" },
          ],
        },
      },
      {
        role: "user",
        text: "Send it.",
      },
      {
        role: "assistant",
        text: `Invitation sent to **${newUser.email}**.`,
        card: {
          variant: "status",
          statusMessage: `Invitation sent to ${newUser.name} · Member role`,
          statusTone: "success",
        },
      },
    ],
  },

  {
    id: "bulk-provisioning",
    label: "Bulk provisioning",
    group: "provisioning",
    messages: [
      {
        role: "user",
        text: `Here's a CSV of ${BULK_PROVISION.totalParsed} users from Salesforce. Provision them all as Members.`,
      },
      {
        role: "assistant",
        text: "I've parsed the CSV. Here's a summary before I proceed:",
        card: {
          variant: "summary",
          summaryLines: [
            { text: `${BULK_PROVISION.totalParsed} users parsed from CSV`, tone: "success" },
            { text: `${BULK_PROVISION.flagged} rows flagged — review below`, tone: "warning" },
            { text: `${BULK_PROVISION.valid} users ready to provision as Member`, tone: "success" },
            { text: `${BULK_PROVISION.flaggedReasons[0].email}: ${BULK_PROVISION.flaggedReasons[0].issue}`, tone: "warning" },
            { text: `${BULK_PROVISION.flaggedReasons[1].email}: ${BULK_PROVISION.flaggedReasons[1].issue}`, tone: "warning" },
            { text: `${BULK_PROVISION.flaggedReasons[2].email}: ${BULK_PROVISION.flaggedReasons[2].issue}`, tone: "warning" },
          ],
        },
      },
      {
        role: "user",
        text: `Proceed with the ${BULK_PROVISION.valid}.`,
      },
      {
        role: "assistant",
        text: `Done. ${BULK_PROVISION.valid} invitations sent. The ${BULK_PROVISION.flagged} flagged rows were skipped.`,
        card: {
          variant: "status",
          statusMessage: `${BULK_PROVISION.valid} invitations sent · ${BULK_PROVISION.flagged} rows skipped`,
          statusTone: "success",
        },
      },
    ],
  },

  {
    id: "promote-to-admin",
    label: "Promote to Admin",
    group: "provisioning",
    messages: [
      {
        role: "user",
        text: `Promote ${promoteTarget.name} to Admin.`,
      },
      {
        role: "assistant",
        text: `I'll promote ${promoteTarget.name} from Member to Admin. Admins have full workspace access including billing, all settings, and the ability to manage other members.`,
        card: {
          variant: "diff",
          diffItems: [
            { name: promoteTarget.name, email: promoteTarget.email, changeType: "changed" },
          ],
        },
      },
      {
        role: "user",
        text: "Yes, promote them.",
      },
      {
        role: "assistant",
        text: `${promoteTarget.name} is now an **Admin**. They can manage workspace settings, billing, and other members.`,
        card: {
          variant: "status",
          statusMessage: `${promoteTarget.name} promoted to Admin`,
          statusTone: "success",
        },
      },
    ],
  },

  // ── Sharing ───────────────────────────────────────────────────────────────────

  {
    id: "share-with-user",
    label: "Share with a user",
    group: "sharing",
    messages: [
      {
        role: "user",
        text: `Share my ${ARTIFACTS.dashboard.name} with ${shareUser.name}. Read-only.`,
      },
      {
        role: "assistant",
        text: `I'll share **${ARTIFACTS.dashboard.name}** with ${shareUser.name} as read-only. They'll be able to view and continue the conversation but not re-share it.`,
        card: {
          variant: "approval",
          approvalItems: [
            { name: shareUser.name, email: shareUser.email, role: "Member" },
          ],
        },
      },
      {
        role: "user",
        text: "Share it.",
      },
      {
        role: "assistant",
        text: `**${ARTIFACTS.dashboard.name}** shared with ${shareUser.name}. They'll see it in their Shared Chats sidebar.`,
        card: {
          variant: "status",
          statusMessage: `Shared with ${shareUser.name} · Read-only`,
          statusTone: "success",
        },
      },
    ],
  },

  {
    id: "share-with-group",
    label: "Share with a team",
    group: "sharing",
    messages: [
      {
        role: "user",
        text: `Share my ${ARTIFACTS.command.name} with the ${es.name} team.`,
      },
      {
        role: "assistant",
        text: `I'll share **${ARTIFACTS.command.name}** with all ${es.memberCount} members of **${es.name}**. Each member will see it in their Shared Chats sidebar and can run it.`,
        card: {
          variant: "summary",
          summaryLines: [
            { text: `Shared with ${es.name} (${es.memberCount} members)`, tone: "success" },
            { text: "Members can view and run the command", tone: "neutral" },
            { text: "Admins can manage sharing permissions", tone: "neutral" },
          ],
        },
      },
      {
        role: "user",
        text: "Share it.",
      },
      {
        role: "assistant",
        text: `**${ARTIFACTS.command.name}** shared with the ${es.name} team.`,
        card: {
          variant: "status",
          statusMessage: `Shared with ${es.name} · ${es.memberCount} members`,
          statusTone: "success",
        },
      },
    ],
  },

  {
    id: "share-with-reporting-line",
    label: "Share with reporting line",
    group: "sharing",
    messages: [
      {
        role: "user",
        text: `Share the ${ARTIFACTS.dashboard.name} with everyone who reports to Sam Whitfield.`,
      },
      {
        role: "assistant",
        text: `Sam Whitfield has ${reportingLineCount} direct reports in your Salesforce hierarchy. I'll share **${ARTIFACTS.dashboard.name}** with all of them:`,
        card: {
          variant: "approval",
          approvalItems: reportingLineMembers.map((m) => ({
            name: m.name,
            email: m.email,
            role: "Member" as const,
          })),
        },
      },
      {
        role: "user",
        text: `Share with all ${reportingLineCount}.`,
      },
      {
        role: "assistant",
        text: `**${ARTIFACTS.dashboard.name}** shared with Sam Whitfield's reporting line (${reportingLineCount} people).`,
        card: {
          variant: "status",
          statusMessage: `Shared with reporting line · ${reportingLineCount} members`,
          statusTone: "success",
        },
      },
    ],
  },

  {
    id: "scope-integration",
    label: "Scope an integration",
    group: "sharing",
    messages: [
      {
        role: "user",
        text: `I want the ${INTEGRATION.name} integration to only be accessible to the ${es.name} team, not the whole workspace.`,
      },
      {
        role: "assistant",
        text: `Right now the ${INTEGRATION.name} integration is available to all workspace members. I'll scope it to **${es.name}** only. Members outside the team won't be able to query ${INTEGRATION.name} data through Von.`,
        card: {
          variant: "summary",
          summaryLines: [
            { text: `${INTEGRATION.name} access restricted to ${es.name} (${es.memberCount} members)`, tone: "success" },
            { text: `${scopeLostAccess} Salesforce users outside this team will not have Von access to ${INTEGRATION.name}`, tone: "warning" },
            { text: "Admins retain access regardless of team membership", tone: "neutral" },
          ],
        },
      },
      {
        role: "user",
        text: "Apply the restriction.",
      },
      {
        role: "assistant",
        text: `Done. The ${INTEGRATION.name} integration is now scoped to **${es.name}**. Others will see a 'Not available' message if they try to use it.`,
        card: {
          variant: "status",
          statusMessage: `${INTEGRATION.name} scoped to ${es.name}`,
          statusTone: "success",
        },
      },
    ],
  },
];

export const SCENARIO_GROUPS = [
  { id: "groups", label: "Groups" },
  { id: "provisioning", label: "Provisioning" },
  { id: "sharing", label: "Sharing" },
] as const;

export function getScenario(id: string): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}
