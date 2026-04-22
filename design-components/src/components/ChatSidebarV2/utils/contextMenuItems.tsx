import {
  PencilSimpleIcon,
  TrashIcon,
  FolderSimpleIcon,
  ArrowBendUpRightIcon,
  PushPinIcon,
  PushPinSimpleSlashIcon,
  ExportIcon,
  GlobeSimpleIcon,
  UsersIcon,
} from '@phosphor-icons/react';
import type { ContextMenuItem } from '../../popups';

/**
 * Get context menu items for conversation items.
 *
 * `enableShare` controls whether the "Share" item appears.
 * `shareInfo` drives the icon/label when the conversation is already shared.
 */
export function getContextMenuItems(
  options: {
    isInFolder?: boolean;
    enableShare?: boolean;
    shareInfo?: { isShared: boolean; accessType?: string | null };
  } = {}
): ContextMenuItem[] {
  const isShared = options.shareInfo?.isShared ?? false;
  const shareIcon = isShared ? (
    options.shareInfo?.accessType === 'restricted' ? (
      <UsersIcon size={14} />
    ) : (
      <GlobeSimpleIcon size={14} />
    )
  ) : (
    <ExportIcon size={14} />
  );

  return [
    { id: 'rename', label: 'Rename', icon: <PencilSimpleIcon size={14} /> },
    { id: 'move', label: 'Add to Folder', icon: <ArrowBendUpRightIcon size={14} /> },
    ...(options.enableShare
      ? [{ id: 'share', label: isShared ? 'Shared' : 'Share', icon: shareIcon }]
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
