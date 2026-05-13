import { useEffect, useRef } from "react";
import { DotsThreeVerticalIcon, FolderSimpleIcon } from "@phosphor-icons/react";
import { useVisibilityToggle } from "@vonlabs/design-components";
import { ManageFoldersModal } from "./ManageFoldersModal";

interface DashboardMoreMenuProps {
  dashboardId: string;
  dashboardName: string;
}

/**
 * Dashboard-side companion to `ConversationMoreMenu`. Lives in the dashboard
 * header (rendered by `AnalyticsView`) and surfaces the multi-folder
 * "Add to Folder" entry point. Kept intentionally narrow — rename / delete
 * already have dedicated UI; this menu only exists to host folder-management
 * for now.
 */
export function DashboardMoreMenu({
  dashboardId,
  dashboardName,
}: DashboardMoreMenuProps) {
  const {
    isVisible: isMenuOpen,
    hide: closeMenu,
    toggleVisibility: toggleMenu,
  } = useVisibilityToggle();
  const {
    isVisible: isManageFoldersOpen,
    show: openManageFolders,
    hide: closeManageFolders,
  } = useVisibilityToggle();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        closeMenu();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isMenuOpen, closeMenu]);

  return (
    <>
      <div ref={containerRef} className="relative flex-shrink-0">
        <button
          onClick={toggleMenu}
          className="inline-flex items-center justify-center w-[34px] h-[34px] text-gray-800 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors"
          title="More options"
        >
          <DotsThreeVerticalIcon size={16} weight="bold" />
        </button>

        {isMenuOpen && (
          <div className="absolute top-full right-0 mt-1 bg-white border border-gray-100 rounded-2xl shadow-lg z-50 overflow-hidden p-1 min-w-[12rem]">
            <button
              onClick={() => {
                closeMenu();
                openManageFolders();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <FolderSimpleIcon
                size={14}
                weight="regular"
                className="flex-shrink-0"
              />
              Add to Folder
            </button>
          </div>
        )}
      </div>

      <ManageFoldersModal
        isOpen={isManageFoldersOpen}
        itemName={dashboardName}
        itemType="dashboard"
        itemId={dashboardId}
        onClose={closeManageFolders}
      />
    </>
  );
}
