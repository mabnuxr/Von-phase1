import {
  PencilSimpleIcon,
  TrashIcon,
  FolderSimpleIcon,
  ArrowBendUpRightIcon,
  PushPinIcon,
  PushPinSimpleSlashIcon,
  ShareNetworkIcon,
} from '@phosphor-icons/react';
import type { ContextMenuItem } from '../../popups';

/**
 * Get context menu items for conversation items.
 *
 * `enableShare` controls whether the "Share" item appears — wire it to
 * `!!onShareItem` so callers that don't provide a share handler (e.g.
 * when the chat-sharing feature flag is off) also don't get the menu
 * entry.
 */
export function getContextMenuItems(
  options: { isInFolder?: boolean; enableShare?: boolean } = {},
): ContextMenuItem[] {
  return [
    { id: 'rename', label: 'Rename', icon: <PencilSimpleIcon size={14} /> },
    { id: 'move', label: 'Add to Folder', icon: <ArrowBendUpRightIcon size={14} /> },
    ...(options.enableShare
      ? [{ id: 'share', label: 'Share', icon: <ShareNetworkIcon size={14} /> }]
      : []),
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
export function getDashboardContextMenuItems(
  options: { isOwner?: boolean } = {}
): ContextMenuItem[] {
  return [
    {
      id: 'rename',
      label: 'Rename',
      icon: <PencilSimpleIcon size={14} />,
      disabled: !options.isOwner,
    },
  ];
}
