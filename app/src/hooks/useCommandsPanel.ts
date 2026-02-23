import { useCallback } from "react";
import type { Command, CommandAttachment } from "@vonlabs/design-components";
import {
  useQuickCommandsList,
  useCreateQuickCommand,
  useUpdateQuickCommand,
  useDeleteQuickCommand,
  useBookmarkQuickCommand,
} from "./useQuickCommands";
import { quickCommandsService } from "../services/quickCommandsService";

/**
 * Encapsulates all quick-command panel logic shared between ChatV1Container
 * and ChatV2Container:
 *  - prefetched commands list
 *  - save (create / update) with already-uploaded dataSources
 *  - eager file upload (presign → S3)
 *  - presigned download URL for file preview
 *  - delete and bookmark mutations
 */
export function useCommandsPanel(userId?: string) {
  const { data: commandsData, isLoading: isLoadingCommands } =
    useQuickCommandsList(undefined, userId);

  const commands = commandsData?.data ?? [];

  const { mutateAsync: createCommand, isPending: isCreating } =
    useCreateQuickCommand();
  const { mutateAsync: updateCommand, isPending: isUpdating } =
    useUpdateQuickCommand();
  const { mutate: deleteCommand } = useDeleteQuickCommand();
  const { mutate: toggleBookmark } = useBookmarkQuickCommand();

  const handleSaveCommand = useCallback(
    async (
      data: Pick<Command, "name" | "prompt" | "prefillText" | "sharingScope">,
      editingId?: string,
      dataSources?: CommandAttachment[],
      commandId?: string,
    ) => {
      const accessLevel = (data.sharingScope === "org" ? "tenant" : "user") as
        | "tenant"
        | "user";

      // All files are already uploaded eagerly — just map to the API shape
      const apiDataSources = (dataSources ?? [])
        .filter((ds) => ds.s3Key)
        .map((ds) => ({
          fileId: ds.id,
          fileName: ds.name,
          mimeType: ds.type,
          fileSize: ds.size,
          extension: ds.extension,
          category: ds.category as
            | "document"
            | "spreadsheet"
            | "presentation"
            | "text"
            | "image",
          s3Key: ds.s3Key!,
        }));

      if (editingId) {
        await updateCommand({
          id: editingId,
          data: {
            name: data.name,
            prompt: data.prompt,
            prefillText: data.prefillText || undefined,
            accessLevel,
            dataSources: apiDataSources,
          },
        });
      } else {
        // Pre-generated commandId enables a single create call with dataSources included
        await createCommand({
          id: commandId,
          name: data.name,
          prompt: data.prompt,
          prefillText: data.prefillText || undefined,
          accessLevel,
          dataSources: apiDataSources.length > 0 ? apiDataSources : undefined,
        });
      }
    },
    [createCommand, updateCommand],
  );

  const handleUploadFile = useCallback(
    async (cmdId: string, file: File): Promise<{ fileId: string; s3Key: string }> => {
      const presign = await quickCommandsService.presignFile(cmdId, {
        fileName: file.name,
        fileType: file.type || "application/octet-stream",
        fileSize: file.size,
      });
      await quickCommandsService.uploadToS3(presign.uploadUrl, file);
      return { fileId: presign.uploadId, s3Key: presign.s3Key };
    },
    [],
  );

  const handleRequestFilePreviewUrl = useCallback(
    async (commandId: string, fileId: string): Promise<string> => {
      const { downloadUrl } = await quickCommandsService.getFileDownloadUrl(
        commandId,
        fileId,
      );
      return downloadUrl;
    },
    [],
  );

  const handleDeleteCommand = useCallback(
    (id: string) => deleteCommand(id),
    [deleteCommand],
  );

  const handleToggleFavorite = useCallback(
    (cmd: Command) => toggleBookmark({ id: cmd.id, bookmark: !cmd.isFavorite }),
    [toggleBookmark],
  );

  return {
    commands,
    isLoadingCommands,
    isSavingCommand: isCreating || isUpdating,
    handleSaveCommand,
    handleUploadFile,
    handleRequestFilePreviewUrl,
    handleDeleteCommand,
    handleToggleFavorite,
  };
}
