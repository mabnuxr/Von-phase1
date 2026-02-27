/**
 * DeleteCommandConfirmModal component
 * Confirmation modal for deleting a command.
 */

import React from 'react';
import { createPortal } from 'react-dom';

export interface DeleteCommandConfirmModalProps {
  isOpen: boolean;
  commandName: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export const DeleteCommandConfirmModal: React.FC<DeleteCommandConfirmModalProps> = ({
  isOpen,
  commandName,
  onCancel,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/20">
      <div className="bg-white rounded-2xl shadow-xl p-5 max-w-xs w-full mx-4">
        <h3 className="text-sm font-semibold text-gray-900">Delete command?</h3>
        <p className="mt-1.5 text-sm text-gray-500">
          &ldquo;{commandName}&rdquo; will be permanently deleted.
        </p>
        <div className="mt-4 flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-3 py-1.5 text-sm font-medium text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors cursor-pointer"
          >
            Delete
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DeleteCommandConfirmModal;
