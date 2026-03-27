import {
  PencilSimpleIcon,
  TrashIcon,
  FolderSimpleIcon,
  ArrowBendUpRightIcon,
  PushPinIcon,
  PushPinSimpleSlashIcon,
} from '@phosphor-icons/react';
import type { ContextMenuItem } from '../../popups';

/**
 * Get context menu items for conversation items
 */
export function getContextMenuItems(options: { isInFolder?: boolean } = {}): ContextMenuItem[] {
  return [
    { id: 'rename', label: 'Rename', icon: <PencilSimpleIcon size={14} /> },
    { id: 'move', label: 'Add to Folder', icon: <ArrowBendUpRightIcon size={14} /> },
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
export function getFolderContextMenuItems(options: { isPinned?: boolean } = {}): ContextMenuItem[] {
  return [
    {
      id: 'pin',
      label: options.isPinned ? 'Unpin' : 'Pin',
      icon: options.isPinned ? <PushPinSimpleSlashIcon size={14} /> : <PushPinIcon size={14} />,
    },
    { id: 'rename', label: 'Rename', icon: <PencilSimpleIcon size={14} /> },
    { id: 'delete', label: 'Delete', icon: <TrashIcon size={14} />, variant: 'danger' as const },
  ];
}

/**
 * Get context menu items for dashboards (rename only)
 */
export function getDashboardContextMenuItems(): ContextMenuItem[] {
  return [{ id: 'rename', label: 'Rename', icon: <PencilSimpleIcon size={14} /> }];
}
