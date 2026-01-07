import { useMutation, useQueryClient } from "@tanstack/react-query";
import { conversationsService } from "../services";
import { chatSidebarKeys } from "./useChatSidebar";

/**
 * Parameters for renaming a folder
 */
export interface RenameFolderParams {
  folderId: string;
  name: string;
}

/**
 * Rename a folder
 * Invalidates sidebar cache on success to refetch folder list
 */
export function useRenameFolder() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, RenameFolderParams>({
    mutationFn: ({ folderId, name }: RenameFolderParams) =>
      conversationsService.renameFolder(folderId, name),
    onSuccess: (_, { folderId, name }) => {
      if (import.meta.env.DEV) {
        console.log("[useRenameFolder] Renamed folder:", folderId, "to:", name);
      }
      // Invalidate sidebar cache to refetch with updated folder name
      queryClient.invalidateQueries({ queryKey: chatSidebarKeys.all });
    },
    onError: (error: Error) => {
      console.error("[useRenameFolder] Error:", error);
    },
  });
}
