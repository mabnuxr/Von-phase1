import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CaretDownIcon } from '@phosphor-icons/react';
import { ConversationItem } from './ConversationItem';
import type { SidebarItem, FolderItemType, SectionShowMoreMap } from '../ChatSidebar';

/**
 * Per-section cap that drives the inline "Show N more" expander. Mirrors
 * the constant in app/src/hooks/folders/useFolderContents.ts so the design
 * never gets out of step with the data layer.
 */
export const FOLDER_SECTION_LIMIT = 5;

export interface FolderContentsProps {
  folderId: string;
  isExpanded: boolean;
  isLoading?: boolean;
  /** Chat items in this folder. */
  conversations: SidebarItem[];
  /** Dashboard items in this folder (rendered with the same row component). */
  dashboards?: SidebarItem[];
  /** Per-type total counts from the contents endpoint, used by Show-N-more. */
  conversationsTotal?: number;
  dashboardsTotal?: number;
  selectedItemId?: string;
  menuOpenItemId?: string | null;
  editingItemId?: string | null;
  sectionShowMore?: SectionShowMoreMap;
  onToggleSectionShowMore?: (folderId: string, itemType: FolderItemType) => void;
  onItemClick?: (item: SidebarItem) => void;
  onItemContextMenu?: (e: React.MouseEvent, item: SidebarItem) => void;
  onSaveEdit?: (item: SidebarItem, newName: string) => void;
  onCancelEdit?: () => void;
}

/**
 * Subhead label inside the nested folder body — matches the top-level
 * SectionHeader's text scale (12px / weight 500 / gray-600) so the in-folder
 * subhead reads as a peer of "Folders / Dashboards / Chats" rather than a
 * heavier nested treatment.
 */
const Subhead: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="px-2 py-1.5 text-xs font-medium text-gray-600">{children}</div>
);

/** Dotted-outline empty hint pointing the user back to "Add to folder". */
const EmptyHint: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="mx-1 my-1 rounded-md border border-dashed border-gray-200 px-2.5 py-2 text-[11px] leading-snug text-left text-gray-500">
    {children}
  </div>
);

const ShowMoreRow: React.FC<{
  expanded: boolean;
  remaining: number;
  onClick: () => void;
}> = ({ expanded, remaining, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex items-center gap-1 px-2 py-1 text-[11.5px] font-medium text-gray-500 hover:text-gray-700 transition-colors whitespace-nowrap"
  >
    <span>{expanded ? 'Show less' : `Show ${remaining} more`}</span>
    <CaretDownIcon
      size={10}
      weight="bold"
      className={`flex-shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
    />
  </button>
);

interface ItemListProps {
  items: SidebarItem[];
  selectedItemId?: string;
  menuOpenItemId?: string | null;
  editingItemId?: string | null;
  onItemClick?: (item: SidebarItem) => void;
  onItemContextMenu?: (e: React.MouseEvent, item: SidebarItem) => void;
  onSaveEdit?: (item: SidebarItem, newName: string) => void;
  onCancelEdit?: () => void;
}

/**
 * Renders a list of `SidebarItem`s using the shared `ConversationItem` row.
 * Same component for chats and dashboards so the visual shape — height,
 * padding, hover ring, kebab placement — is identical.
 */
const ItemList: React.FC<ItemListProps> = ({
  items,
  selectedItemId,
  menuOpenItemId,
  editingItemId,
  onItemClick,
  onItemContextMenu,
  onSaveEdit,
  onCancelEdit,
}) => (
  <>
    {items.map((item) => (
      <ConversationItem
        key={item.id}
        item={item}
        isSelected={item.id === selectedItemId}
        onClick={() => onItemClick?.(item)}
        onContextMenu={onItemContextMenu ? (e) => onItemContextMenu(e, item) : undefined}
        isMenuOpen={menuOpenItemId === item.id}
        isEditing={editingItemId === item.id}
        onSaveEdit={(newName) => onSaveEdit?.(item, newName)}
        onCancelEdit={onCancelEdit}
      />
    ))}
  </>
);

/**
 * FolderContents — the A2 nested body of an expanded folder.
 *
 * Renders Dashboards and Chats as two subsections inside a left guide-line
 * column. Each section caps at FOLDER_SECTION_LIMIT items and grows on
 * "Show N more" / shrinks on "Show less". Empty sections fall back to a
 * dotted hint pointing the user at Add to folder. Both subsections render
 * through `ConversationItem` so the row visual is identical.
 */
export const FolderContents: React.FC<FolderContentsProps> = ({
  folderId,
  isExpanded,
  isLoading = false,
  conversations,
  dashboards = [],
  conversationsTotal,
  dashboardsTotal,
  selectedItemId,
  menuOpenItemId,
  editingItemId,
  sectionShowMore = {},
  onToggleSectionShowMore,
  onItemClick,
  onItemContextMenu,
  onSaveEdit,
  onCancelEdit,
}) => {
  const dashShowAll = !!sectionShowMore[`${folderId}:dashboard`];
  const chatShowAll = !!sectionShowMore[`${folderId}:conversation`];

  const dashTotal = dashboardsTotal ?? dashboards.length;
  const chatTotal = conversationsTotal ?? conversations.length;

  const visibleDashboards =
    dashShowAll || dashboards.length <= FOLDER_SECTION_LIMIT
      ? dashboards
      : dashboards.slice(0, FOLDER_SECTION_LIMIT);
  const visibleConversations =
    chatShowAll || conversations.length <= FOLDER_SECTION_LIMIT
      ? conversations
      : conversations.slice(0, FOLDER_SECTION_LIMIT);

  const dashRemaining = Math.max(0, dashTotal - FOLDER_SECTION_LIMIT);
  const chatRemaining = Math.max(0, chatTotal - FOLDER_SECTION_LIMIT);

  const isFullyEmpty = !isLoading && dashTotal === 0 && chatTotal === 0;

  const sharedListProps = {
    selectedItemId,
    menuOpenItemId,
    editingItemId,
    onItemClick,
    onItemContextMenu,
    onSaveEdit,
    onCancelEdit,
  };

  return (
    <AnimatePresence>
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="overflow-hidden pl-3 ml-3.5 border-l border-gray-200"
        >
          {isLoading ? (
            <div className="space-y-1 py-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-2.5 px-2 py-1.5">
                  <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                  <div
                    className="h-4 flex-1 bg-gray-200 rounded animate-pulse"
                    style={{ maxWidth: `${50 + i * 15}%` }}
                  />
                </div>
              ))}
            </div>
          ) : isFullyEmpty ? (
            <EmptyHint>
              Add chats and dashboards to this folder using{' '}
              <span className="text-gray-700 font-medium">Add to folder</span>.
            </EmptyHint>
          ) : (
            <>
              {/* Dashboards subsection */}
              <Subhead>Dashboards</Subhead>
              {dashTotal === 0 ? (
                <EmptyHint>
                  No dashboards yet — use{' '}
                  <span className="text-gray-700 font-medium">Add to folder</span>.
                </EmptyHint>
              ) : (
                <>
                  <ItemList items={visibleDashboards} {...sharedListProps} />
                  {dashRemaining > 0 && (
                    <ShowMoreRow
                      expanded={dashShowAll}
                      remaining={dashRemaining}
                      onClick={() => onToggleSectionShowMore?.(folderId, 'dashboard')}
                    />
                  )}
                </>
              )}

              {/* Chats subsection */}
              <Subhead>Chats</Subhead>
              {chatTotal === 0 ? (
                <EmptyHint>
                  No chats yet — use{' '}
                  <span className="text-gray-700 font-medium">Add to folder</span>.
                </EmptyHint>
              ) : (
                <>
                  <ItemList items={visibleConversations} {...sharedListProps} />
                  {chatRemaining > 0 && (
                    <ShowMoreRow
                      expanded={chatShowAll}
                      remaining={chatRemaining}
                      onClick={() => onToggleSectionShowMore?.(folderId, 'conversation')}
                    />
                  )}
                </>
              )}
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FolderContents;
