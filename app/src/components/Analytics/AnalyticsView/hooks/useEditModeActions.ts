import { useCallback, useEffect, useMemo, useRef } from "react";
import { useVisibilityToggle } from "@vonlabs/design-components";
import type { MutationPhase } from "../../../../hooks/useMutationPhase";

interface AcquireLockCallbacks {
  onSuccess?: () => void;
  onHeldByOther?: () => void;
  onUnknownError?: (error: unknown) => void;
}

type DiscardModalMode = "discard" | "revert";

interface UseEditModeActionsArgs {
  dashboardVersion: number;
  onAcquireLock?: (callbacks?: AcquireLockCallbacks) => Promise<void> | void;
  onChatClick?: () => void;
  onDiscardDraft?: () => Promise<void> | void;
  onSaveDraft?: () => Promise<void> | void;
  onSave: (options?: { isFirstSave?: boolean; onSuccess?: () => void }) => void;
  onRevert: (options?: { onSuccess?: () => void }) => void;
  openLockModal: () => void;
  // Mutation phases — used to derive `discardModal.isPending` and to auto-
  // close the modal once the originating mutation finishes (success path).
  // Error paths are handled by the parent mutations' toast wiring; we just
  // close the modal so the user can recover.
  discardDraftPhase: MutationPhase;
  revertPhase: MutationPhase;
}

export function useEditModeActions({
  dashboardVersion,
  onAcquireLock,
  onChatClick,
  onDiscardDraft,
  onSaveDraft,
  onSave,
  onRevert,
  openLockModal,
  discardDraftPhase,
  revertPhase,
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

  // ── Shared discard/revert confirmation modal ────────────────────
  //
  // Discard (collab) and Revert (legacy) both pop the same modal. A ref
  // tracks which path opened it so `confirm` knows which mutation to fire.
  // The modal closes itself when the in-flight mutation transitions from
  // `pending` back to `idle` (success or error) — error toasts are owned
  // by the upstream mutations.
  const {
    isVisible: isDiscardModalOpen,
    show: openDiscardModal,
    hide: closeDiscardModal,
  } = useVisibilityToggle();
  const discardModeRef = useRef<DiscardModalMode>("discard");
  const wasPendingRef = useRef(false);
  const activePhase =
    discardModeRef.current === "discard" ? discardDraftPhase : revertPhase;

  useEffect(() => {
    const isPending = activePhase === "pending";
    if (wasPendingRef.current && !isPending && isDiscardModalOpen) {
      closeDiscardModal();
    }
    wasPendingRef.current = isPending;
  }, [activePhase, isDiscardModalOpen, closeDiscardModal]);

  // Discard pops the confirmation modal; save-as-draft fires
  // immediately. Callers always wire both handlers under collab.
  const handleDiscardDraft = useCallback(() => {
    if (!onDiscardDraft) return;
    discardModeRef.current = "discard";
    openDiscardModal();
  }, [onDiscardDraft, openDiscardModal]);

  const handleSaveDraft = useCallback(() => {
    if (!onSaveDraft) return;
    void onSaveDraft();
  }, [onSaveDraft]);

  const handleSaveFromEditMode = useCallback(() => {
    onSave({ isFirstSave: dashboardVersion < 1 });
  }, [onSave, dashboardVersion]);

  const handleRevertFromEditMode = useCallback(() => {
    discardModeRef.current = "revert";
    openDiscardModal();
  }, [openDiscardModal]);

  const confirmDiscardOrRevert = useCallback(() => {
    if (discardModeRef.current === "discard") {
      if (onDiscardDraft) void onDiscardDraft();
      return;
    }
    onRevert();
  }, [onDiscardDraft, onRevert]);

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
      handleRevertFromEditMode,
    }),
    [
      handleEnterEditMode,
      handleDiscardDraft,
      handleSaveDraft,
      handleSaveFromEditMode,
      handleRevertFromEditMode,
    ],
  );

  const discardModal = {
    isOpen: isDiscardModalOpen,
    close: closeDiscardModal,
    isPending: activePhase === "pending",
    confirm: confirmDiscardOrRevert,
  };

  return { editActions, discardModal };
}

export type EditModeActions = ReturnType<
  typeof useEditModeActions
>["editActions"];
export type DiscardModalState = ReturnType<
  typeof useEditModeActions
>["discardModal"];
