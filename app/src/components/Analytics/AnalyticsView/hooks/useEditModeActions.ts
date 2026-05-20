import { useCallback, useEffect, useMemo, useRef } from "react";
import { useVisibilityToggle } from "@vonlabs/design-components";
import type { MutationPhase } from "../../../../hooks/useMutationPhase";

interface AcquireLockCallbacks {
  onSuccess?: () => void;
  onHeldByOther?: () => void;
  onUnknownError?: (error: unknown) => void;
}

interface UseEditModeActionsArgs {
  dashboardVersion: number;
  onAcquireLock?: (callbacks?: AcquireLockCallbacks) => Promise<void> | void;
  onChatClick?: () => void;
  onDiscardDraft?: () => Promise<void> | void;
  onSaveDraft?: () => Promise<void> | void;
  onSave: (options?: { isFirstSave?: boolean; onSuccess?: () => void }) => void;
  openLockModal: () => void;
  /** Drives `discardModal.isPending` and the auto-close once the
   *  discard mutation transitions back to `idle`. Error paths are
   *  handled by the parent mutation's toast wiring; we just close the
   *  modal so the user can recover. */
  discardDraftPhase: MutationPhase;
}

export function useEditModeActions({
  dashboardVersion,
  onAcquireLock,
  onChatClick,
  onDiscardDraft,
  onSaveDraft,
  onSave,
  openLockModal,
  discardDraftPhase,
}: UseEditModeActionsArgs) {
  // Edit always calls POST /lock (M1). Server response decides:
  //   - 2xx              → we hold the lock, open chat
  //   - 409 HELD_BY_OTHER → show EditLockModal
  //   - other 4xx        → handled inside the parent's acquireLock
  // Chat-open is deferred into onSuccess so a HELD_BY_OTHER doesn't
  // also pop the chat panel underneath the modal.
  const handleEnterEditMode = useCallback(() => {
    if (!onAcquireLock) return;
    void onAcquireLock({
      onSuccess: () => onChatClick?.(),
      onHeldByOther: openLockModal,
    });
  }, [onAcquireLock, onChatClick, openLockModal]);

  // ── Discard confirmation modal ──────────────────────────────────
  //
  // Discard pops a confirmation modal that auto-closes once the
  // discard mutation transitions from `pending` back to `idle`
  // (success or error — error toasts are owned upstream).
  const {
    isVisible: isDiscardModalOpen,
    show: openDiscardModal,
    hide: closeDiscardModal,
  } = useVisibilityToggle();
  const wasPendingRef = useRef(false);

  useEffect(() => {
    const isPending = discardDraftPhase === "pending";
    if (wasPendingRef.current && !isPending && isDiscardModalOpen) {
      closeDiscardModal();
    }
    wasPendingRef.current = isPending;
  }, [discardDraftPhase, isDiscardModalOpen, closeDiscardModal]);

  // Discard pops the confirmation modal; save-as-draft fires
  // immediately.
  const handleDiscardDraft = useCallback(() => {
    if (!onDiscardDraft) return;
    openDiscardModal();
  }, [onDiscardDraft, openDiscardModal]);

  const handleSaveDraft = useCallback(() => {
    if (!onSaveDraft) return;
    void onSaveDraft();
  }, [onSaveDraft]);

  const handleSaveFromEditMode = useCallback(() => {
    onSave({ isFirstSave: dashboardVersion < 1 });
  }, [onSave, dashboardVersion]);

  const confirmDiscard = useCallback(() => {
    if (!onDiscardDraft) return;
    void onDiscardDraft();
  }, [onDiscardDraft]);

  // Split return: handlers (stable references, drilled down to toolbar/cluster)
  // are kept separate from `discardModal` (frequently-changing state — only the
  // shell renders the modal). Bundling them would cause AnalyticsToolbarActions
  // to re-render every time the modal opens/closes, even though it doesn't
  // read any modal state.
  const editActions = useMemo(
    () => ({
      handleEnterEditMode,
      handleDiscardDraft,
      handleSaveDraft,
      handleSaveFromEditMode,
    }),
    [
      handleEnterEditMode,
      handleDiscardDraft,
      handleSaveDraft,
      handleSaveFromEditMode,
    ],
  );

  const discardModal = {
    isOpen: isDiscardModalOpen,
    close: closeDiscardModal,
    isPending: discardDraftPhase === "pending",
    confirm: confirmDiscard,
  };

  return { editActions, discardModal };
}

export type EditModeActions = ReturnType<
  typeof useEditModeActions
>["editActions"];
export type DiscardModalState = ReturnType<
  typeof useEditModeActions
>["discardModal"];
