import { useState, useEffect, useMemo } from "react";
import usePreferencesStore from "../store/preferencesStore";
import { Input, Banner, SingleSelect } from "@vonlabs/design-components";
import { useAddTeamMember, useRoles } from "../hooks/useTeam";
import { useUser } from "../hooks/useUser";

export function AddTeamMemberPane() {
  const { addingTeamMember, setAddingTeamMember } = usePreferencesStore();
  const { user } = useUser();

  // React Query mutations and data
  const addMutation = useAddTeamMember(user?.tenantId as string | undefined);
  const { data: roles, isLoading: rolesLoading } = useRoles(
    user?.tenantId as string | undefined,
  );

  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "",
  });

  // Validation errors state
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Prepare role options for dropdown (members can only see "Member" role)
  const isAdmin = user?.roles?.includes("Admin") ?? false;

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

  // Reset form when panel opens
  useEffect(() => {
    if (addingTeamMember) {
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        role: roleOptions.length > 0 ? roleOptions[0].value : "",
      });
      setValidationErrors([]);
    }
  }, [addingTeamMember, roles, user?.roles, roleOptions]);

  const handleClose = () => {
    setAddingTeamMember(false);
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      role: "",
    });
    setValidationErrors([]);
  };

  const handleSave = async () => {
    // Collect validation errors
    const errors: string[] = [];

    if (!formData.firstName.trim()) {
      errors.push("First Name is required");
    }
    if (!formData.lastName.trim()) {
      errors.push("Last Name is required");
    }
    if (!formData.email.trim()) {
      errors.push("Email is required");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push("Please enter a valid email address");
    }
    if (!formData.role) {
      errors.push("Role is required");
    }

    // If there are validation errors, display them and return
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      // Clear any previous errors
      setValidationErrors([]);

      // Call the mutation
      await addMutation.mutateAsync({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        role: formData.role,
      });

      // Success - close panel
      handleClose();
    } catch (error: unknown) {
      console.error("[AddTeamMemberPane] Save error:", error);

      // Handle 400 Bad Request errors (user already exists, role not found, etc.)
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
          setValidationErrors([
            detail || "Failed to add team member. Please check your input.",
          ]);
          return;
        }

        // Handle 403 Forbidden (insufficient permissions for role assignment)
        if (response?.status === 403) {
          const detail = response.data?.detail || response.data?.message;
          setValidationErrors([
            detail || "You don't have permission to assign this role.",
          ]);
          return;
        }
      }

      // Handle other errors
      const errorMessage =
        error && typeof error === "object" && "message" in error
          ? (error as { message: string }).message
          : "Failed to add team member. Please try again.";
      setValidationErrors([errorMessage]);
    }
  };

  const handleChange = (fieldName: keyof typeof formData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  // Check if roles are empty (not initialized)
  const rolesNotInitialized = !rolesLoading && roles && roles.length === 0;

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
        className={`fixed top-0 right-0 h-full w-120 p-2 z-50 transform transition-transform duration-300 ease-in-out ${
          addingTeamMember ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col bg-white rounded-xl border border-gray-200 shadow-xs">
          {/* Header */}
          <div className="px-5 py-3 border-b border-gray-200 shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 m-0">
                Add Team Member
              </h2>
              <button
                onClick={handleClose}
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

              {/* Roles Not Initialized Warning */}
              {rolesNotInitialized && (
                <Banner
                  variant="warning"
                  message="Team roles not initialized. Please contact your administrator to set up roles first."
                  dismissible={false}
                />
              )}

              {/* Description
              <div>
                <p className="text-sm text-gray-600">
                  Add a new team member to your organization.
                </p>
              </div> */}

              {/* First Name */}
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  First Name <span className="text-red-500">*</span>
                </label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleChange("firstName", e.target.value)}
                  placeholder="John"
                  fullWidth
                />
              </div>

              {/* Last Name */}
              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Last Name <span className="text-red-500">*</span>
                </label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleChange("lastName", e.target.value)}
                  placeholder="Doe"
                  fullWidth
                />
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Email <span className="text-red-500">*</span>
                </label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="john.doe@example.com"
                  fullWidth
                />
              </div>

              {/* Role */}
              <div>
                <label
                  htmlFor="role"
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
                    />
                    {roles && formData.role && (
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
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 shrink-0">
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={handleClose}
                className="px-3 py-2 text-sm font-medium text-gray-800 bg-gray-50 border border-gray-100 rounded-xl hover:bg-gray-100 hover:border-gray-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={
                  addMutation.isPending || rolesLoading || rolesNotInitialized
                }
                className="px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addMutation.isPending ? "Adding..." : "Add Team Member"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
