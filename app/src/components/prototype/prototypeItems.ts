import { ItemType } from "@vonlabs/design-components";
import type { SidebarItem } from "@vonlabs/design-components";

export const PROTOTYPE_CHAT_IDS = new Set([
  "prototype-create-group",
  "prototype-inspect-group",
  "prototype-add-users-to-group",
  "prototype-add-non-workspace-users",
  "prototype-make-group-admin",
  "prototype-remove-group-admin",
  "prototype-individual-provisioning",
  "prototype-bulk-provisioning",
  "prototype-promote-to-admin",
  "prototype-share-with-user",
  "prototype-share-with-group",
  "prototype-share-with-reporting-line",
]);

export const PROTOTYPE_SIDEBAR_ITEMS: SidebarItem[] = [
  { id: "prototype-create-group",              label: "Create a team",                       type: ItemType.Chat },
  { id: "prototype-inspect-group",             label: "Inspect a team",                      type: ItemType.Chat },
  { id: "prototype-add-users-to-group",        label: "Add users to a team",                   type: ItemType.Chat },
  { id: "prototype-add-non-workspace-users",   label: "Add non-workspace users to a team",     type: ItemType.Chat },
  { id: "prototype-make-group-admin",          label: "Make Team Admin",                     type: ItemType.Chat },
  { id: "prototype-remove-group-admin",        label: "Remove Team Admin",                   type: ItemType.Chat },
  { id: "prototype-individual-provisioning",   label: "Individual provisioning",              type: ItemType.Chat },
  { id: "prototype-bulk-provisioning",         label: "Bulk provisioning",                    type: ItemType.Chat },
  { id: "prototype-promote-to-admin",          label: "Promote to Admin",                     type: ItemType.Chat },
  { id: "prototype-share-with-user",           label: "Share with a user",                    type: ItemType.Chat },
  { id: "prototype-share-with-group",          label: "Share with a team",                   type: ItemType.Chat },
  { id: "prototype-share-with-reporting-line", label: "Share with reporting line",            type: ItemType.Chat },
];
