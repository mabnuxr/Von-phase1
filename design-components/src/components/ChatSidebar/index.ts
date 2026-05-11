// `ItemType` is a const-object + matching type alias; re-export it as a
// value so it works in both value position (`ItemType.Dashboard`) and type
// position (`(t: ItemType) => …`) for consumers.
export { ChatSidebar, ItemType } from './ChatSidebar';
export type {
  ChatSidebarProps,
  SidebarItem,
  Folder,
  ItemStatus,
  ApprovalState,
  FolderItemsMap,
  FolderDashboardsMap,
  FolderLoadingMap,
  DashboardSidebarItem,
  DashboardItemState,
  DashboardItemVisibility,
  SectionShowMoreMap,
  FolderItemType,
} from './ChatSidebar';
export { ApprovalDot } from './components';
export type { ApprovalDotProps } from './components';
export { ApprovalPill } from './components';
export type { ApprovalPillProps } from './components';
