import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { report } from "../../lib/analytics/tracker";
import { SearchIcon } from "../icons";
import {
  DotsThreeVertical,
  CaretRight,
  ShieldCheck,
  TrashSimple,
  BookOpen,
  PencilSimple,
} from "@phosphor-icons/react";
import {
  useTeamMembers,
  useRemoveTeamMember,
  useUpdateMemberPermissions,
} from "../../hooks/useTeam";
import { useUser } from "../../hooks/useUser";
import { useFeatureFlag } from "../../hooks/useFeatureFlag";
import { usePermissions, Resource } from "../../hooks/usePermissions";
import usePreferencesStore from "../../store/preferencesStore";
import { Banner, Tooltip } from "@vonlabs/design-components";

export function ManageUsersTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openMenuUserId, setOpenMenuUserId] = useState<string | null>(null);
  const [showPermissionsSubmenu, setShowPermissionsSubmenu] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    userId: string;
    userName: string;
    userEmail: string;
    userRole: string;
  } | null>(null);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Get current user for tenant context
  const { user } = useUser();
  const activeTenant = user?.tenantId as string | undefined;

  // Get permissions for team resource
  const { data: teamPermissions } = usePermissions(Resource.TEAM);

  const { isHubspotEnabled } = useFeatureFlag();

  // Check if user can create/delete team members
  const canCreateTeamMember = teamPermissions?.create ?? false;
  const canDeleteTeamMember = teamPermissions?.delete ?? false;

  // Fetch team members
  const { data: teamMembers, isLoading, error } = useTeamMembers(activeTenant);

  // Remove team member mutation
  const removeMutation = useRemoveTeamMember(activeTenant);

  // Update member permissions mutation
  const updatePermissionsMutation = useUpdateMemberPermissions(activeTenant);

  // Access store to open add team member panels
  const { setAddingTeamMember, setEditingTeamMemberId } = usePreferencesStore();

  const pageViewCaptured = useRef(false);
  const trackPageView = useCallback(() => {
    if (!user || pageViewCaptured.current) return;
    report.manageTeamPageViewed();
    pageViewCaptured.current = true;
  }, [user]);
  useEffect(() => {
    trackPageView();
  }, [trackPageView]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuUserId(null);
        setShowPermissionsSubmenu(false);
      }
    };

    if (openMenuUserId) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [openMenuUserId]);

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!teamMembers) return [];

    if (!searchQuery.trim()) {
      return teamMembers;
    }

    const query = searchQuery.toLowerCase();
    return teamMembers.filter(
      (user) =>
        user.firstName.toLowerCase().includes(query) ||
        user.lastName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query),
    );
  }, [searchQuery, teamMembers]);

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!searchQuery.trim()) return;
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      report.manageTeamMemberSearched(searchQuery, filteredUsers.length);
    }, 500);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery, filteredUsers.length]);

  const handleAddTeamMemberClick = () => {
    report.manageTeamAddMemberClicked();
    setAddingTeamMember(true);
  };

  const handleDeleteUser = (
    userId: string,
    userName: string,
    userEmail: string,
    userRole: string,
  ) => {
    report.manageTeamDeleteUserClicked(userEmail, userRole);
    setDeleteConfirmation({ userId, userName, userEmail, userRole });
    setOpenMenuUserId(null);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation) return;
    const { userId, userEmail, userRole } = deleteConfirmation;

    try {
      await removeMutation.mutateAsync(userId);
      report.manageTeamMemberRemoved(true, null, userEmail, userRole);
      setDeleteConfirmation(null);
      setShowSuccessBanner(true);
    } catch (error) {
      const errMsg =
        error instanceof Error ? error.message : "Failed to remove member";
      report.manageTeamMemberRemoved(false, errMsg, userEmail, userRole);
      console.error("Failed to remove team member:", error);
      setDeleteConfirmation(null);
      // Error is already handled by the mutation's onError callback
    }
  };

  const cancelDelete = () => {
    report.manageTeamRemoveCancelled(deleteConfirmation?.userEmail ?? "");
    setDeleteConfirmation(null);
  };

  const toggleMenu = (userId: string) => {
    setOpenMenuUserId(openMenuUserId === userId ? null : userId);
    setShowPermissionsSubmenu(false);
  };

  const handleToggleSfdcWrite = (member: (typeof filteredUsers)[number]) => {
    const currentValue = member.permissions?.sfdc_write ?? true;
    report.manageTeamSalesforceUpdatesToggled(
      !currentValue,
      member.email,
      member.role,
    );
    updatePermissionsMutation.mutate({
      userId: member.id,
      permissions: { sfdc_write: !currentValue },
    });
  };

  const handleToggleHubspotWrite = (member: (typeof filteredUsers)[number]) => {
    const currentValue = member.permissions?.hubspot_write ?? true;
    updatePermissionsMutation.mutate({
      userId: member.id,
      permissions: { hubspot_write: !currentValue },
    });
  };

  // Per-member permission toggles, keyed by member.id for O(1) lookup in JSX.
  // Adding another integration's permission = one entry in this array per member.
  // HubSpot toggle is gated on the enable-hubspot FF (matches the BE gate).
  const memberPermissionToggles = useMemo(
    () =>
      Object.fromEntries(
        filteredUsers.map((m) => [
          m.id,
          [
            {
              key: "sfdc_write",
              label: "Salesforce Updates",
              value: m.permissions?.sfdc_write ?? true,
              onToggle: () => handleToggleSfdcWrite(m),
            },
            ...(isHubspotEnabled
              ? [
                  {
                    key: "hubspot_write",
                    label: "HubSpot Updates",
                    value: m.permissions?.hubspot_write ?? true,
                    onToggle: () => handleToggleHubspotWrite(m),
                  },
                ]
              : []),
          ],
        ]),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filteredUsers, isHubspotEnabled],
  );

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="flex flex-col h-full p-2">
      {/* Heading - Fixed */}
      <div className="">
        <div className="px-4 pt-4 pb-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Manage Team
              </h2>
              <p className="text-sm text-gray-600">
                Add and manage team members
              </p>
            </div>
            <a
              href="https://docs.vonlabs.ai/workspace-setup/manage-and-invite-your-team"
              target="_blank"
              rel="noopener noreferrer"
              onClick={report.manageTeamLearnMoreClicked}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer shrink-0"
            >
              <BookOpen size={14} />
              Learn more
            </a>
          </div>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 justify-center overflow-y-auto settings-scrollbar px-6">
        <div className="pt-6 pb-12 space-y-6 w-full max-w-4xl mx-auto">
          {/* Actions Row */}
          <div className="flex items-center gap-4">
            {/* Search Input - Full Width */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="w-4 h-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full pl-10 pr-3 py-2.5 text-sm text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-gray-100 focus:border-2 focus:border-gray-300 transition-all duration-200 bg-white hover:border-gray-300 shadow-xs"
              />
            </div>
            {canCreateTeamMember && (
              <button
                onClick={handleAddTeamMemberClick}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 hover:cursor-pointer transition-colors duration-200 shadow-sm shrink-0"
              >
                Invite Users
              </button>
            )}
          </div>

          {/* Table Content */}
          {/* Loading State */}
          {(isLoading || !teamMembers) && !error && (
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs text-gray-700 tracking-wide"
                    >
                      Name
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs text-gray-700 tracking-wide"
                    >
                      Email
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs text-gray-700 tracking-wide"
                    >
                      Role
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-center text-xs text-gray-700 tracking-wide"
                    >
                      <Tooltip content="Number of conversations created">
                        <span className="cursor-default">Questions</span>
                      </Tooltip>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs text-gray-700 tracking-wide"
                    >
                      Joined
                    </th>
                    {canDeleteTeamMember && (
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs text-gray-700 tracking-wide"
                      >
                        Action
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {[1, 2, 3].map((i) => (
                    <tr key={i}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-48"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-5 bg-gray-200 rounded-full animate-pulse w-20"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-12 mx-auto"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                      </td>
                      {canDeleteTeamMember && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="flex items-center justify-center min-h-75">
              <p className="text-sm text-red-600">
                Failed to load team members. Please try again.
              </p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading &&
            !error &&
            teamMembers &&
            filteredUsers.length === 0 && (
              <div className="flex items-center justify-center min-h-75">
                <p className="text-sm text-gray-500">
                  {searchQuery
                    ? "No users found matching your search"
                    : "No team members yet"}
                </p>
              </div>
            )}

          {/* Data Table */}
          {!isLoading && !error && teamMembers && filteredUsers.length > 0 && (
            <div className="overflow-visible border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs text-gray-700 tracking-wide"
                    >
                      Name
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs text-gray-700 tracking-wide"
                    >
                      Email
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs text-gray-700 tracking-wide"
                    >
                      Role
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-center text-xs text-gray-700 tracking-wide"
                    >
                      <Tooltip content="Number of conversations created">
                        <span className="cursor-default">Questions</span>
                      </Tooltip>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs text-gray-700 tracking-wide"
                    >
                      Joined
                    </th>
                    {canDeleteTeamMember && (
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs text-gray-700 tracking-wide"
                      >
                        Action
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((member) => (
                    <tr
                      key={member.id}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {member.firstName} {member.lastName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-700">
                          {member.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-von-purple-50 text-von-purple-700">
                          {member.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <Tooltip
                          content={
                            <div className="flex flex-col gap-1">
                              <span>
                                Last 7d:{" "}
                                <span className="font-medium">
                                  {member.usage.last_week}
                                </span>
                              </span>
                              <span>
                                Last 30d:{" "}
                                <span className="font-medium">
                                  {member.usage.last_month}
                                </span>
                              </span>
                              <span>
                                All time:{" "}
                                <span className="font-medium">
                                  {member.usage.total}
                                </span>
                              </span>
                            </div>
                          }
                        >
                          <span
                            className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 cursor-default tabular-nums hover:bg-gray-200 transition-colors duration-150"
                            onMouseEnter={() =>
                              report.manageTeamQuestionsTooltipViewed(
                                member.email,
                                member.usage.last_week,
                                member.usage.last_month,
                                member.usage.total,
                              )
                            }
                          >
                            {member.usage.total}
                          </span>
                        </Tooltip>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {formatDate(member.joinedDate)}
                        </div>
                      </td>
                      {canDeleteTeamMember && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="relative">
                            <button
                              onClick={() => {
                                if (openMenuUserId !== member.id) {
                                  report.manageTeamActionsMenuOpened(
                                    member.email,
                                    member.role,
                                  );
                                }
                                toggleMenu(member.id);
                              }}
                              className={`p-1.5 rounded-lg transition-colors duration-150 cursor-pointer ${
                                openMenuUserId === member.id
                                  ? "bg-gray-200 text-gray-900"
                                  : "hover:bg-gray-200 text-gray-600"
                              }`}
                              aria-label="Open menu"
                            >
                              <DotsThreeVertical size={18} weight="bold" />
                            </button>

                            {/* Dropdown Menu */}
                            {openMenuUserId === member.id && (
                              <div
                                ref={menuRef}
                                className="absolute right-0 top-full mt-1 w-52 bg-white rounded-2xl shadow-lg border border-gray-100 p-1 z-100"
                              >
                                {/* Edit Details */}
                                <button
                                  onClick={() => {
                                    report.manageTeamEditDetailsClicked(
                                      member.email,
                                      member.role,
                                    );
                                    setEditingTeamMemberId(member.id);
                                    setOpenMenuUserId(null);
                                  }}
                                  className="w-full rounded-xl flex items-center gap-2.5 px-3 py-2 text-sm text-gray-900 hover:bg-gray-100/80 transition-colors duration-150 cursor-pointer"
                                >
                                  <PencilSimple
                                    size={14}
                                    className="text-gray-800"
                                  />
                                  <span>Edit Details</span>
                                </button>

                                {/* Customize Permissions */}
                                <div className="relative">
                                  <button
                                    onClick={() => {
                                      const willOpen = !showPermissionsSubmenu;
                                      if (willOpen)
                                        report.manageTeamAccessPermissionsClicked(
                                          member.email,
                                          member.role,
                                        );
                                      setShowPermissionsSubmenu(willOpen);
                                    }}
                                    className={`w-full rounded-xl flex items-center justify-between px-3 py-2 text-sm text-gray-900 transition-colors duration-150 cursor-pointer ${
                                      showPermissionsSubmenu
                                        ? "bg-gray-100/80"
                                        : "hover:bg-gray-100/80"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <ShieldCheck
                                        size={14}
                                        className="text-gray-800"
                                      />
                                      <span>Access Permissions</span>
                                    </div>
                                    <CaretRight
                                      size={14}
                                      className="text-gray-400"
                                    />
                                  </button>

                                  {/* Permissions Submenu */}
                                  {showPermissionsSubmenu && (
                                    <div className="absolute right-full top-0 mr-1 w-56 bg-white rounded-2xl shadow-lg border border-gray-100 p-1">
                                      {memberPermissionToggles[member.id]?.map(
                                        (toggle) => (
                                          <div
                                            key={toggle.key}
                                            className="flex items-center justify-between rounded-xl px-3 py-2"
                                          >
                                            <span className="text-sm text-gray-900 whitespace-nowrap">
                                              {toggle.label}
                                            </span>
                                            <button
                                              onClick={toggle.onToggle}
                                              disabled={
                                                updatePermissionsMutation.isPending
                                              }
                                              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed ${
                                                toggle.value
                                                  ? "bg-green-500"
                                                  : "bg-gray-200"
                                              }`}
                                            >
                                              <span
                                                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                                  toggle.value
                                                    ? "translate-x-4"
                                                    : "translate-x-0"
                                                }`}
                                              />
                                            </button>
                                          </div>
                                        ),
                                      )}
                                      <p
                                        className="px-3 pb-2"
                                        style={{
                                          color: "#9ca3af",
                                          fontSize: "11px",
                                          lineHeight: "1.3",
                                        }}
                                      >
                                        Overrides org-level access
                                      </p>
                                    </div>
                                  )}
                                </div>

                                {/* Delete User - not shown for current user */}
                                {member.email !== user?.email && (
                                  <button
                                    onClick={() =>
                                      handleDeleteUser(
                                        member.id,
                                        `${member.firstName} ${member.lastName}`,
                                        member.email,
                                        member.role,
                                      )
                                    }
                                    disabled={removeMutation.isPending}
                                    className="w-full rounded-xl flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 cursor-pointer"
                                  >
                                    <TrashSimple size={14} />
                                    {removeMutation.isPending
                                      ? "Removing..."
                                      : "Delete User"}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Success Banner */}
      {showSuccessBanner && (
        <Banner
          variant="success"
          message="Team member removed successfully"
          autoDismissMs={3000}
          onClose={() => setShowSuccessBanner(false)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center"
            onClick={cancelDelete}
          >
            {/* Modal */}
            <div
              className="bg-white rounded-xl shadow-elevated p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-4">
                {/* Warning Icon */}
                <div className="shrink-0 w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Remove Team Member
                  </h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Are you sure you want to remove{" "}
                    <span className="font-medium text-gray-900">
                      {deleteConfirmation.userName}
                    </span>{" "}
                    from the team? This action cannot be undone.
                  </p>

                  {/* Buttons */}
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={cancelDelete}
                      className="px-3 py-2 text-sm font-medium text-gray-800 bg-gray-50 border border-gray-100 rounded-xl hover:bg-gray-100 hover:border-gray-200 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmDelete}
                      disabled={removeMutation.isPending}
                      className="px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      {removeMutation.isPending ? "Removing..." : "Remove"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
