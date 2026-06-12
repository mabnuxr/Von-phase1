import { ItemType } from "@vonlabs/design-components";
import type { SidebarItem } from "@vonlabs/design-components";

export const PROTOTYPE_V1_ITEMS: SidebarItem[] = [
  { id: "prototype-individual-provisioning",   label: "Individual provisioning",              type: ItemType.Chat },
  { id: "prototype-multiple-provisioning",     label: "Multiple provisioning",                type: ItemType.Chat },
  { id: "prototype-bulk-provisioning",         label: "Bulk provisioning",                    type: ItemType.Chat },
  { id: "prototype-create-group",              label: "Create a team",                        type: ItemType.Chat },
  { id: "prototype-create-group-guided",       label: "Create a team (guided)",               type: ItemType.Chat },
  { id: "prototype-inspect-group",             label: "Inspect a team",                       type: ItemType.Chat },
  { id: "prototype-add-users-to-group",        label: "Add users to a team",                  type: ItemType.Chat },
  { id: "prototype-add-non-workspace-users",   label: "Add non-workspace users to a team",    type: ItemType.Chat },
  { id: "prototype-promote-to-admin",          label: "Promote user to admin",                type: ItemType.Chat },
  { id: "prototype-demote-to-member",          label: "Demote admin to member",               type: ItemType.Chat },
  { id: "prototype-make-group-admin",          label: "Make Team Admin",                      type: ItemType.Chat },
  { id: "prototype-remove-group-admin",        label: "Remove Team Admin",                    type: ItemType.Chat },
];

export const PROTOTYPE_V2_ITEMS: SidebarItem[] = [
  { id: "prototype-bulk-provisioning-v2.1", label: "Bulk provisioning v2.1", type: ItemType.Chat },
  { id: "prototype-bulk-provisioning-v2.2", label: "Bulk provisioning v2.2", type: ItemType.Chat },
  { id: "prototype-bulk-provisioning-v2.3", label: "Bulk provisioning v2.3", type: ItemType.Chat },
  { id: "prototype-create-team-v2.1",       label: "Create a team v2.1",     type: ItemType.Chat },
  { id: "prototype-promote-to-admin-v2",    label: "Promote user to admin v2", type: ItemType.Chat },
  { id: "prototype-demote-to-member-v2",    label: "Demote admin to member v2", type: ItemType.Chat },
  { id: "prototype-make-team-admin-v2",     label: "Make Team Admin v2",       type: ItemType.Chat },
  { id: "prototype-remove-team-admin-v2",   label: "Remove Team Admin v2",     type: ItemType.Chat },
];

export const PROTOTYPE_V3_ITEMS: SidebarItem[] = [
  { id: "prototype-bulk-provisioning-v3",  label: "Bulk provisioning v3",     type: ItemType.Chat },
  { id: "prototype-bulk-provisioning-v3.1", label: "Bulk provisioning v3.1",  type: ItemType.Chat },
  { id: "prototype-create-team-v3",        label: "Create a team v3",         type: ItemType.Chat },
  { id: "prototype-promote-to-admin-v3",   label: "Promote user to admin v3", type: ItemType.Chat },
  { id: "prototype-demote-to-member-v3",   label: "Demote admin to member v3", type: ItemType.Chat },
  { id: "prototype-make-team-admin-v3",    label: "Make Team Admin v3",       type: ItemType.Chat },
  { id: "prototype-remove-team-admin-v3",  label: "Remove Team Admin v3",     type: ItemType.Chat },
];

export const PROTOTYPE_CHAT_IDS = new Set([
  ...PROTOTYPE_V1_ITEMS.map((i) => i.id),
  ...PROTOTYPE_V2_ITEMS.map((i) => i.id),
  ...PROTOTYPE_V3_ITEMS.map((i) => i.id),
]);

/** Keep for legacy callers that expect a flat list — now empty since the
 *  accordion injects items directly into the sidebar slot. */
export const PROTOTYPE_SIDEBAR_ITEMS: SidebarItem[] = [];
