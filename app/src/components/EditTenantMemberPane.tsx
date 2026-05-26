import { useState, useEffect, useMemo } from "react";
import usePreferencesStore from "../store/preferencesStore";
import { Input, Banner, SingleSelect } from "@vonlabs/design-components";
import {
  useTenantMembers,
  useRoles,
  useUpdateTenantMember,
} from "../hooks/useTenantMembers";
import { useUser } from "../hooks/useUser";
import { report } from "../lib/analytics/tracker";

export function EditTenantMemberPane() {
  const { editingTenantMemberId, setEditingTenantMemberId } =
    usePreferencesStore();
  const { user } = useUser();
  const activeTenant = user?.tenantId as string | undefined;

  // Fetch tenant members to get the member being edited
  const { data: tenantMembers } = useTenantMembers(activeTenant);
  const { data: roles, isLoading: rolesLoading } = useRoles(activeTenant);
  const updateMutation = useUpdateTenantMember(activeTenant);

  const member = useMemo(
    () => tenantMembers?.find((m) => m.id === editingTenantMemberId) ?? null,
    [tenantMembers, editingTenantMemberId],
  );

  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    role: "",
    timezone: "America/Los_Angeles",
  });

  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Role options - admins see all, members only see Member
  const isAdmin = user?.roles?.includes("Admin") ?? false;

  const timezoneOptions = useMemo(
    () =>
      Intl.supportedValuesOf("timeZone").map((tz) => ({
        value: tz,
        label: tz.replace(/_/g, " "),
      })),
    [],
  );

  const roleOptions = useMemo(
    () =>
      roles
        ?.filter((role) => isAdmin || role.name !== "Admin")
        .map((role) => ({
          value: role.name,
          label: role.displayName,
        })) ?? [],
    [roles, isAdmin],
  );

  // Match member's role display name to internal role name
  const memberRoleName = useMemo(
    () =>
      roles?.find(
        (r) => r.displayName === member?.role || r.name === member?.role,
      )?.name ?? "",
    [roles, member?.role],
  );

  // Populate form when member changes
  useEffect(() => {
    if (member) {
      setFormData({
        firstName: member.firstName,
        lastName: member.lastName,
        role: memberRoleName,
        timezone: member.timezone ?? "America/Los_Angeles",
      });
      setValidationErrors([]);
    }
  }, [member, memberRoleName]);

  // Disable role editing when viewing your own profile
  const isEditingSelf = member?.email === user?.email;

  const isOpen = editingTenantMemberId !== null;

  const handleClose = () => {
    setEditingTenantMemberId(null);
    setValidationErrors([]);
  };

  const handleCancelClose = () => {
    report.manageTeamEditDetailsCancelled(member?.email ?? "");
    handleClose();
  };

  // Members can only update their own timezone
  const canEditCoreFields = isAdmin;
  const canEditTimezone = isAdmin || isEditingSelf;

  const handleSave = async () => {
    if (!member) return;

    const errors: string[] = [];

    if (canEditCoreFields) {
      if (!formData.firstName.trim()) errors.push("First Name is required");
      if (!formData.lastName.trim()) errors.push("Last Name is required");
      if (!formData.role) errors.push("Role is required");
    }

    if (errors.length > 0) {
      report.manageTeamEditDetailsSaved({
        success: false,
        error: errors.join(", "),
        oldRole: memberRoleName,
        newRole: formData.role,
        targetUserEmail: member.email,
      });
      setValidationErrors(errors);
      return;
    }

    // Build update payload - only include fields the user is allowed to send
    const updates: Record<string, string> = {};

    if (canEditCoreFields) {
      if (formData.firstName.trim() !== member.firstName)
        updates.firstName = formData.firstName.trim();
      if (formData.lastName.trim() !== member.lastName)
        updates.lastName = formData.lastName.trim();
      if (formData.role !== memberRoleName) updates.role = formData.role;
    }

    if (
      canEditTimezone &&
      formData.timezone !== (member.timezone ?? "America/Los_Angeles")
    ) {
      updates.timezone = formData.timezone;
    }

    if (Object.keys(updates).length === 0) {
      handleClose();
      return;
    }

    try {
      setValidationErrors([]);
      await updateMutation.mutateAsync({
        userId: member.id,
        data: updates,
      });
      report.manageTeamEditDetailsSaved({
        success: true,
        error: null,
        oldRole: memberRoleName,
        newRole: formData.role,
        targetUserEmail: member.email,
      });
      handleClose();
    } catch (error: unknown) {
      console.error("[EditTenantMemberPane] Save error:", error);

      if (error && typeof error === "object") {
        const response =
          "response" in error
            ? (
                error as {
                  response?: {
                    status?: number;
                    data?: { detail?: string; message?: string };
                  };
                }
              ).response
            : null;

        if (response?.status === 400) {
          const detail = response.data?.detail || response.data?.message;
          const msg =
            detail || "Failed to update team member. Please check your input.";
          report.manageTeamEditDetailsSaved({
            success: false,
            error: msg,
            oldRole: memberRoleName,
            newRole: formData.role,
            targetUserEmail: member.email,
          });
          setValidationErrors([msg]);
          return;
        }

        if (response?.status === 403) {
          const msg = "You don't have permission to update this team member.";
          report.manageTeamEditDetailsSaved({
            success: false,
            error: msg,
            oldRole: memberRoleName,
            newRole: formData.role,
            targetUserEmail: member.email,
          });
          setValidationErrors([msg]);
          return;
        }
      }

      const errorMessage =
        error && typeof error === "object" && "message" in error
          ? (error as { message: string }).message
          : "Failed to update team member. Please try again.";
      report.manageTeamEditDetailsSaved({
        success: false,
        error: errorMessage,
        oldRole: memberRoleName,
        newRole: formData.role,
        targetUserEmail: member.email,
      });
      setValidationErrors([errorMessage]);
    }
  };

  const handleChange = (fieldName: keyof typeof formData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/20 transition-opacity duration-300 z-40 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={handleCancelClose}
      />

      {/* Side Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-120 p-2 z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col bg-white rounded-xl border border-gray-200 shadow-xs">
          {/* Header */}
          <div className="px-5 py-3 border-b border-gray-200 shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 m-0">
                Edit Details
              </h2>
              <button
                onClick={handleCancelClose}
                className="text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
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

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="space-y-5 max-w-md">
              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <Banner
                  variant="error"
                  message={validationErrors.join(". ")}
                  dismissible={false}
                />
              )}

              {/* First Name */}
              <div>
                <label
                  htmlFor="editFirstName"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  First Name <span className="text-red-500">*</span>
                </label>
                <Input
                  id="editFirstName"
                  value={formData.firstName}
                  onChange={(e) => handleChange("firstName", e.target.value)}
                  placeholder="John"
                  fullWidth
                  disabled={!canEditCoreFields}
                />
              </div>

              {/* Last Name */}
              <div>
                <label
                  htmlFor="editLastName"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Last Name <span className="text-red-500">*</span>
                </label>
                <Input
                  id="editLastName"
                  value={formData.lastName}
                  onChange={(e) => handleChange("lastName", e.target.value)}
                  placeholder="Doe"
                  fullWidth
                  disabled={!canEditCoreFields}
                />
              </div>

              {/* Email - Read Only */}
              <div>
                <label
                  htmlFor="editEmail"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Email
                </label>
                <Input
                  id="editEmail"
                  type="email"
                  value={member?.email ?? ""}
                  disabled
                  fullWidth
                />
                <p className="mt-1.5 text-xs text-gray-400">
                  Email cannot be changed
                </p>
              </div>

              {/* Role */}
              <div>
                <label
                  htmlFor="editRole"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Role <span className="text-red-500">*</span>
                </label>
                {rolesLoading ? (
                  <div className="w-full h-10 bg-gray-100 animate-pulse rounded-lg"></div>
                ) : (
                  <>
                    <SingleSelect
                      options={roleOptions}
                      value={formData.role}
                      onChange={(value: string) => handleChange("role", value)}
                      placeholder="Select a role"
                      fullWidth
                      showSearch={false}
                      disabled={isEditingSelf || !canEditCoreFields}
                    />
                    {isEditingSelf && (
                      <p className="mt-1.5 text-xs text-gray-400">
                        You cannot change your own role
                      </p>
                    )}
                    {!isEditingSelf && roles && formData.role && (
                      <p className="mt-2 text-xs text-gray-500">
                        {
                          roles.find((r) => r.name === formData.role)
                            ?.description
                        }
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Timezone */}
              <div>
                <label
                  htmlFor="editTimezone"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Timezone
                </label>
                <SingleSelect
                  options={timezoneOptions}
                  value={formData.timezone}
                  onChange={(value: string) => handleChange("timezone", value)}
                  placeholder="Select a timezone"
                  fullWidth
                  showSearch
                  disabled={!canEditTimezone}
                />
                {!canEditTimezone && (
                  <p className="mt-1.5 text-xs text-gray-400">
                    You can only update your own timezone
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 shrink-0">
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={handleCancelClose}
                className="px-3 py-2 text-sm font-medium text-gray-800 bg-gray-50 border border-gray-100 rounded-xl hover:bg-gray-100 hover:border-gray-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={updateMutation.isPending || rolesLoading}
                className="px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
