import React from 'react';
import {
  PencilSimpleIcon,
  TrashIcon,
  FolderSimpleIcon,
  ArrowBendUpRightIcon,
} from '@phosphor-icons/react';
import type { ContextMenuItem } from '../../popups';

/**
 * Get context menu items for conversation items
 */
export function getContextMenuItems(options: { isInFolder?: boolean } = {}): ContextMenuItem[] {
  return [
    { id: 'rename', label: 'Rename', icon: <PencilSimpleIcon size={14} /> },
    { id: 'move', label: 'Move', icon: <ArrowBendUpRightIcon size={14} /> },
    ...(options.isInFolder
      ? [
          {
            id: 'remove-from-folder',
            label: 'Remove from Folder',
            icon: <FolderSimpleIcon size={14} />,
          },
        ]
      : []),
    { id: 'delete', label: 'Delete', icon: <TrashIcon size={14} />, variant: 'danger' as const },
  ];
}

/**
 * Get context menu items for folders
 */
export function getFolderContextMenuItems(): ContextMenuItem[] {
  return [
    { id: 'rename', label: 'Rename', icon: <PencilSimpleIcon size={14} /> },
    { id: 'delete', label: 'Delete', icon: <TrashIcon size={14} />, variant: 'danger' as const },
  ];
}
