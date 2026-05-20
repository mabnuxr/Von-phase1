import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import usePreferencesStore from "../store/preferencesStore";
import { report } from "../lib/analytics/tracker";
import { IndividualAddTab } from "./add-team-members/IndividualAddTab";
import { BulkImportTab } from "./add-team-members/BulkImportTab";
import type { AddTeamMembersTab } from "./add-team-members/types";

export function AddTeamMembersPane() {
  const { addingTeamMember, setAddingTeamMember } = usePreferencesStore();

  const [activeTab, setActiveTab] = useState<AddTeamMembersTab>("individual");
  const [footer, setFooter] = useState<ReactNode>(null);
  const closeGuardRef = useRef<(() => boolean) | null>(null);
  const memberAddedRef = useRef(false);

  // Reset to default tab whenever the pane closes.
  useEffect(() => {
    if (!addingTeamMember) {
      setActiveTab("individual");
      setFooter(null);
      closeGuardRef.current = null;
      memberAddedRef.current = false;
    }
  }, [addingTeamMember]);

  const canClose = useCallback(() => {
    return closeGuardRef.current ? closeGuardRef.current() : true;
  }, []);

  const handleMemberAdded = useCallback(() => {
    memberAddedRef.current = true;
  }, []);

  const handleClose = useCallback(() => {
    if (!canClose()) return;
    if (activeTab === "individual" && !memberAddedRef.current) {
      report.manageTeamAddMemberCancelled();
    }
    setAddingTeamMember(false);
  }, [canClose, setAddingTeamMember, activeTab]);

  const handleTabSwitch = (tab: AddTeamMembersTab) => {
    if (tab === activeTab) return;
    if (!canClose()) return; // bulk upload in flight — block switch too
    closeGuardRef.current = null;
    setFooter(null);
    setActiveTab(tab);
  };

  const registerCloseGuard = useCallback((guard: () => boolean) => {
    closeGuardRef.current = guard;
  }, []);

  // Swallow stray drops at the pane level so the browser doesn't navigate.
  const swallowDrop = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const tabButtonClass = (
    tab: AddTeamMembersTab,
    isUploadingDisabled = false,
  ) =>
    `pb-2 -mb-px text-sm font-medium transition-colors cursor-pointer border-b-2 ${
      activeTab === tab
        ? "text-gray-900 border-gray-900"
        : "text-gray-500 border-transparent hover:text-gray-700"
    } ${isUploadingDisabled ? "opacity-50 cursor-not-allowed" : ""}`;

  const otherTabDisabled = !canClose();

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/20 transition-opacity duration-300 z-40 ${
          addingTeamMember ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={handleClose}
      />

      {/* Side Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-xl p-2 z-50 transform transition-transform duration-300 ease-in-out ${
          addingTeamMember ? "translate-x-0" : "translate-x-full"
        }`}
        onDragOver={swallowDrop}
        onDrop={swallowDrop}
      >
        <div className="h-full flex flex-col bg-white rounded-xl border border-gray-200 shadow-xs">
          {/* Header */}
          <div className="px-5 py-3 border-b border-gray-200 shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 m-0">
                Add Team Members
              </h2>
              <button
                onClick={handleClose}
                className="text-gray-500 hover:text-gray-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Close panel"
              >
                <svg
                  className="size-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    d="M6 18L18 6M6 6l12 12"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-6 pt-3 border-b border-gray-200 shrink-0">
            <div className="flex items-center gap-6">
              <button
                onClick={() => handleTabSwitch("individual")}
                disabled={activeTab !== "individual" && otherTabDisabled}
                className={tabButtonClass(
                  "individual",
                  activeTab !== "individual" && otherTabDisabled,
                )}
              >
                Individual
              </button>
              <button
                onClick={() => handleTabSwitch("bulk")}
                disabled={activeTab !== "bulk" && otherTabDisabled}
                className={tabButtonClass(
                  "bulk",
                  activeTab !== "bulk" && otherTabDisabled,
                )}
              >
                Bulk import
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {addingTeamMember && activeTab === "individual" && (
              <IndividualAddTab
                onClose={handleClose}
                onRegisterFooter={setFooter}
                onMemberAdded={handleMemberAdded}
              />
            )}
            {addingTeamMember && activeTab === "bulk" && (
              <BulkImportTab
                onClose={handleClose}
                onRegisterFooter={setFooter}
                registerCloseGuard={registerCloseGuard}
              />
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 shrink-0">
            {footer}
          </div>
        </div>
      </div>
    </>
  );
}
