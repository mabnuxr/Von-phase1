import React, { useEffect } from 'react';
import { Button } from '../Button';

export interface ConfirmationModalProps {
  /**
   * Whether the modal is open
   */
  isOpen: boolean;

  /**
   * Modal title
   */
  title: string;

  /**
   * Confirmation message (can include JSX for formatting)
   */
  message: React.ReactNode;

  /**
   * Text for confirm button
   * @default 'Confirm'
   */
  confirmText?: string;

  /**
   * Text for cancel button
   * @default 'Cancel'
   */
  cancelText?: string;

  /**
   * Callback when user confirms
   */
  onConfirm: () => void;

  /**
   * Callback when user cancels
   */
  onCancel: () => void;

  /**
   * Variant for confirm button
   * @default 'danger'
   */
  confirmVariant?: 'primary' | 'secondary' | 'danger';
}

/**
 * ConfirmationModal - Reusable confirmation dialog
 *
 * Displays a modal dialog for user confirmation with customizable
 * title, message, and action buttons. Includes backdrop overlay.
 *
 * @example
 * ```tsx
 * <ConfirmationModal
 *   isOpen={showModal}
 *   title="Disable Integration"
 *   message="Are you sure you want to disable this integration?"
 *   confirmText="Disable"
 *   cancelText="Cancel"
 *   onConfirm={() => handleDisable()}
 *   onCancel={() => setShowModal(false)}
 *   confirmVariant="danger"
 * />
 * ```
 */
export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  confirmVariant = 'danger',
}) => {
  // Handle escape key press
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    // Close modal if clicking on overlay (not the modal content)
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4  antialiased"
      onClick={handleOverlayClick}
    >
      <div
        className="bg-white rounded-xl shadow-modal max-w-[400px] w-full p-6 flex flex-col gap-5"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <h2 id="modal-title" className="text-xl font-semibold text-gray-900 m-0">
          {title}
        </h2>
        <p className="text-sm text-gray-700 leading-6 m-0">{message}</p>
        <div className="flex gap-3 justify-end mt-1">
          <Button variant="secondary" onClick={onCancel}>
            {cancelText}
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm}>
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
