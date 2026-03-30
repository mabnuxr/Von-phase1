import { useCallback } from "react";
import type {
  Command,
  CommandAttachment,
  ScheduleRecipient,
} from "@vonlabs/design-components";
import {
  useQuickCommandsList,
  useCreateQuickCommand,
  useUpdateQuickCommand,
  useDeleteQuickCommand,
  useBookmarkQuickCommand,
} from "./useQuickCommands";
import {
  quickCommandsService,
  scheduleToApiConfigs,
} from "../services/quickCommandsService";
import { useToast } from "./useToast";
import { getErrorMessage } from "../utils/getErrorMessage";

/**
 * Encapsulates all quick-command panel logic shared across chat components:
 *  - prefetched commands list
 *  - save (create / update) with already-uploaded dataSources
 *  - eager file upload (presign → S3)
 *  - presigned download URL for file preview
 *  - delete and bookmark mutations
 */
export function useCommandsPanel(userId?: string) {
  const { showToast } = useToast();

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
      data: Pick<
        Command,
        "name" | "prompt" | "prefillText" | "sharingScope" | "schedule"
      >,
      editingId?: string,
      dataSources?: CommandAttachment[],
      commandId?: string,
    ) => {
      const accessLevel = (data.sharingScope === "org" ? "tenant" : "user") as
        | "tenant"
        | "user";

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

      const scheduleConfigs = data.schedule?.enabled
        ? scheduleToApiConfigs(data.schedule)
        : undefined;

      try {
        if (editingId) {
          await updateCommand({
            id: editingId,
            data: {
              name: data.name,
              prompt: data.prompt,
              prefillText: data.prefillText || undefined,
              accessLevel,
              dataSources: apiDataSources,
              triggerConfig: scheduleConfigs?.triggerConfig ?? null,
              deliveryConfig: scheduleConfigs?.deliveryConfig ?? null,
            },
          });
          showToast({ message: "Command updated", variant: "success" });
        } else {
          await createCommand({
            id: commandId,
            name: data.name,
            prompt: data.prompt,
            prefillText: data.prefillText || undefined,
            accessLevel,
            dataSources: apiDataSources.length > 0 ? apiDataSources : undefined,
            ...(scheduleConfigs ?? {}),
          });
          showToast({ message: "Command created", variant: "success" });
        }
      } catch (err) {
        showToast({
          message: getErrorMessage(
            err,
            editingId
              ? "Failed to update command. Please try again."
              : "Failed to create command. Please try again.",
          ),
          variant: "error",
        });
        throw err;
      }
    },
    [createCommand, updateCommand, showToast],
  );

  const handleUploadFile = useCallback(
    async (
      cmdId: string,
      file: File,
    ): Promise<{ fileId: string; s3Key: string }> => {
      try {
        const presign = await quickCommandsService.presignFile(cmdId, {
          fileName: file.name,
          fileType: file.type || "application/octet-stream",
          fileSize: file.size,
        });
        await quickCommandsService.uploadToS3(presign.uploadUrl, file);
        return { fileId: presign.uploadId, s3Key: presign.s3Key };
      } catch (err) {
        showToast({
          message: getErrorMessage(
            err,
            `Failed to upload "${file.name}". Please try again.`,
          ),
          variant: "error",
        });
        throw err;
      }
    },
    [showToast],
  );

  const handleRequestFilePreviewUrl = useCallback(
    async (s3Key: string): Promise<string> => {
      try {
        const { downloadUrl } =
          await quickCommandsService.getFileDownloadUrl(s3Key);
        return downloadUrl;
      } catch (err) {
        showToast({
          message: getErrorMessage(err, "Could not load file preview."),
          variant: "error",
        });
        throw err;
      }
    },
    [showToast],
  );

  const handleDeleteCommand = useCallback(
    (id: string) =>
      deleteCommand(id, {
        onSuccess: () =>
          showToast({ message: "Command deleted", variant: "success" }),
        onError: (err) =>
          showToast({
            message: getErrorMessage(
              err,
              "Failed to delete command. Please try again.",
            ),
            variant: "error",
          }),
      }),
    [deleteCommand, showToast],
  );

  const handleToggleFavorite = useCallback(
    (cmd: Command) =>
      toggleBookmark(
        { id: cmd.id, bookmark: !cmd.isFavorite },
        {
          onError: (err) =>
            showToast({
              message: getErrorMessage(
                err,
                "Failed to update bookmark. Please try again.",
              ),
              variant: "error",
            }),
        },
      ),
    [toggleBookmark, showToast],
  );

  const handleSendTest = useCallback(
    async (
      data: Pick<Command, "name" | "prompt">,
      dataSources: CommandAttachment[],
      recipients: ScheduleRecipient[],
    ) => {
      const apiDataSources = dataSources
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

      try {
        await quickCommandsService.trigger({
          name: data.name,
          prompt: data.prompt,
          dataSources: apiDataSources.length > 0 ? apiDataSources : undefined,
          deliveryConfig: {
            type: "email",
            recipients: recipients.map((r) => ({
              id: r.email,
              name: `${r.firstName} ${r.lastName}`.trim(),
            })),
          },
        });
      } catch (err) {
        throw new Error(
          getErrorMessage(err, "Failed to send test. Please try again."),
        );
      }
    },
    [],
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
    handleSendTest,
  };
}
