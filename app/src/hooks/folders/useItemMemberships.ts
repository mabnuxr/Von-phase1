import { useQuery } from "@tanstack/react-query";
import { foldersService } from "../../services";
import { folderKeys } from "./folderKeys";
import type {
  FolderItemType,
  FolderMembershipLookupResponse,
} from "../../types/chatSidebar";

interface UseItemMembershipsParams {
  itemType: FolderItemType;
  itemId: string;
  /** Only run the lookup while the consumer (typically a modal) is open. */
  enabled?: boolean;
}

/**
 * Folders the given item is currently filed in for the calling user.
 * Drives the ManageFoldersModal's pre-checked state. The list is keyed off
 * (itemType, itemId) and invalidated by the setItemFolders mutation so a
 * second open of the modal reflects the latest membership.
 */
export function useItemMemberships({
  itemType,
  itemId,
  enabled = true,
}: UseItemMembershipsParams) {
  return useQuery<FolderMembershipLookupResponse>({
    queryKey: folderKeys.itemMemberships(itemType, itemId),
    queryFn: () => foldersService.getItemMemberships({ itemType, itemId }),
    enabled: enabled && !!itemId,
    // Memberships are mutation-driven and the modal must always show the
    // authoritative server state. `refetchOnMount: "always"` forces a fresh
    // GET every time the modal opens, so a stale cache (e.g. after the
    // sidebar's "Remove from folder") never leaks into the picker.
    staleTime: 0,
    refetchOnMount: "always",
    gcTime: 60 * 1000,
  });
}
