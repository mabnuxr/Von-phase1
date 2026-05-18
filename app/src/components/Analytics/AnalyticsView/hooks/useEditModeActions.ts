import { useCallback } from "react";

interface AcquireLockCallbacks {
  onSuccess?: () => void;
  onHeldByOther?: () => void;
  onUnknownError?: (error: unknown) => void;
}

interface UseEditModeActionsArgs {
  isDashboardCollabEnabled: boolean;
  isDashboardOwner: boolean;
  dashboardVersion: number;
  onAcquireLock?: (callbacks?: AcquireLockCallbacks) => Promise<void> | void;
  onChatClick?: () => void;
  onEditModeChange?: (isEditable: boolean) => void;
  onDiscardDraft?: () => Promise<void> | void;
  onSaveDraft?: () => Promise<void> | void;
  onSave: (options?: { isFirstSave?: boolean; onSuccess?: () => void }) => void;
  onRevert: (options?: { onSuccess?: () => void }) => void;
  openLockModal: () => void;
}

export function useEditModeActions({
  isDashboardCollabEnabled,
  isDashboardOwner,
  dashboardVersion,
  onAcquireLock,
  onChatClick,
  onEditModeChange,
  onDiscardDraft,
  onSaveDraft,
  onSave,
  onRevert,
  openLockModal,
}: UseEditModeActionsArgs) {
  const handleEnterEditMode = useCallback(() => {
    if (isDashboardCollabEnabled && onAcquireLock) {
      // M1 path — Edit always calls POST /lock. Server response decides:
      //   - 2xx              → we hold the lock, open chat
      //   - 409 HELD_BY_OTHER → show EditLockModal
      //   - other 4xx        → handled inside the parent's acquireLock
      // Chat-open is deferred into onSuccess so a HELD_BY_OTHER doesn't
      // also pop the chat panel underneath the modal.
      void onAcquireLock({
        onSuccess: () => onChatClick?.(),
        onHeldByOther: openLockModal,
      });
      return;
    }
    // Legacy path — toggle `is_editable` directly.
    if (isDashboardOwner) {
      onEditModeChange?.(true);
    }
    onChatClick?.();
  }, [
    isDashboardCollabEnabled,
    onAcquireLock,
    isDashboardOwner,
    onEditModeChange,
    onChatClick,
    openLockModal,
  ]);

  // Discard / Save-as-draft fall back to a local exit-edit-mode no-op when
  // the parent didn't pass a handler (legacy flag-off path).
  const handleDiscardDraft = useCallback(() => {
    if (onDiscardDraft) {
      void onDiscardDraft();
      return;
    }
    onEditModeChange?.(false);
  }, [onDiscardDraft, onEditModeChange]);

  const handleSaveDraft = useCallback(() => {
    if (onSaveDraft) {
      void onSaveDraft();
      return;
    }
    onEditModeChange?.(false);
  }, [onSaveDraft, onEditModeChange]);

  const handleSaveFromEditMode = useCallback(() => {
    onSave({ isFirstSave: dashboardVersion < 1 });
  }, [onSave, dashboardVersion]);

  const handleRevertFromEditMode = useCallback(() => {
    onRevert();
  }, [onRevert]);

  return {
    handleEnterEditMode,
    handleDiscardDraft,
    handleSaveDraft,
    handleSaveFromEditMode,
    handleRevertFromEditMode,
  };
}

export type EditModeActions = ReturnType<typeof useEditModeActions>;
