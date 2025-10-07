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
   * Confirmation message
   */
  message: string;

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

  const overlayStyles: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '16px',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
  };

  const modalStyles: React.CSSProperties = {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
    maxWidth: '400px',
    width: '100%',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  };

  const titleStyles: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: 600,
    color: '#1d1d1f',
    margin: 0,
  };

  const messageStyles: React.CSSProperties = {
    fontSize: '14px',
    color: '#6e6e73',
    lineHeight: '1.5',
    margin: 0,
  };

  const actionsStyles: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '4px',
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    // Close modal if clicking on overlay (not the modal content)
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div style={overlayStyles} onClick={handleOverlayClick}>
      <div style={modalStyles} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <h2 id="modal-title" style={titleStyles}>
          {title}
        </h2>
        <p style={messageStyles}>{message}</p>
        <div style={actionsStyles}>
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
