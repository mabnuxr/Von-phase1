import {
  PencilSimpleIcon,
  TrashIcon,
  FolderSimpleIcon,
  FoldersIcon,
  PushPinIcon,
  PushPinSimpleSlashIcon,
  ExportIcon,
  GlobeSimpleIcon,
  UsersIcon,
} from '@phosphor-icons/react';
import type { ContextMenuItem } from '../../popups';

/**
 * Get context menu items for any sidebar item (chat or dashboard).
 *
 * Same shape across both item types — the only differences are:
 *   - "Share" only appears for chats when `enableShare` is on.
 *   - Rename / Delete are owner-gated (chats are always owned by the
 *     current user; dashboards reflect API truth via `isOwner`).
 *   - "Remove from Folder" only appears when `isInFolder` is true.
 */
export function getContextMenuItems(
  options: {
    itemType?: 'chat' | 'dashboard';
    isOwner?: boolean;
    isInFolder?: boolean;
    isSystemManaged?: boolean;
    enableShare?: boolean;
    shareInfo?: { isShared: boolean; accessType?: string | null };
  } = {}
): ContextMenuItem[] {
  const itemType = options.itemType ?? 'chat';
  // Chats: every viewer is the owner. Dashboards: respect API.
  const isOwner = itemType === 'chat' ? true : !!options.isOwner;

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

  // Server-managed items (e.g. scheduled command runs) don't allow folder
  // mutations on the API — hide those entries entirely rather than show
  // them disabled.
  const managed = !!options.isSystemManaged;

  return [
    {
      id: 'rename',
      label: 'Rename',
      icon: <PencilSimpleIcon size={14} />,
      disabled: !isOwner,
    },
    ...(managed
      ? []
      : [
          {
            id: 'manage-folders',
            label: options.isInFolder ? 'Manage Folders' : 'Add to Folder',
            icon: <FoldersIcon size={14} />,
          },
        ]),
    ...(options.enableShare && itemType === 'chat'
      ? [{ id: 'share', label: isShared ? 'Shared' : 'Share', icon: shareIcon }]
      : []),
    ...(options.isInFolder && !managed
      ? [
          {
            id: 'remove-from-folder',
            label: 'Remove from Folder',
            icon: <FolderSimpleIcon size={14} />,
          },
        ]
      : []),
    {
      id: 'delete',
      label: 'Delete',
      icon: <TrashIcon size={14} />,
      variant: 'danger' as const,
      disabled: !isOwner,
    },
  ];
}

/** Get context menu items for folders. */
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

// `getDashboardContextMenuItems` was removed — use `getContextMenuItems`
// with `{ itemType: 'dashboard', isOwner, isInFolder }` instead. Same shape,
// no duplicate definition.
