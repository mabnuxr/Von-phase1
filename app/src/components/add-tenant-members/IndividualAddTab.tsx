import { useEffect, useMemo, useState } from "react";
import { Input, Banner, SingleSelect } from "@vonlabs/design-components";
import { useAddTenantMember, useRoles } from "../../hooks/useTenantMembers";
import { useUser } from "../../hooks/useUser";
import type { TabContentProps } from "./types";
import { report } from "../../lib/analytics/tracker";

export function IndividualAddTab({
  onClose,
  onRegisterFooter,
  onMemberAdded,
}: TabContentProps) {
  const { user } = useUser();

  const addMutation = useAddTenantMember(user?.tenantId as string | undefined);
  const { data: roles, isLoading: rolesLoading } = useRoles(
    user?.tenantId as string | undefined,
  );

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "",
  });

  const [validationErrors, setValidationErrors] = useState<string[]>([]);

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

  // Initialize role default once options load
  useEffect(() => {
    if (!formData.role && roleOptions.length > 0) {
      setFormData((prev) => ({ ...prev, role: roleOptions[0].value }));
    }
  }, [roleOptions, formData.role]);

  const rolesNotInitialized = !rolesLoading && roles && roles.length === 0;

  const handleChange = (fieldName: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleSave = async () => {
    const errors: string[] = [];

    if (!formData.firstName.trim()) errors.push("First Name is required");
    if (!formData.lastName.trim()) errors.push("Last Name is required");
    if (!formData.email.trim()) {
      errors.push("Email is required");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push("Please enter a valid email address");
    }
    if (!formData.role) errors.push("Role is required");

    if (errors.length > 0) {
      report.manageTeamMemberAdded({
        success: false,
        error: errors.join(", "),
        memberEmail: formData.email.trim(),
        memberRole: formData.role,
      });
      setValidationErrors(errors);
      return;
    }

    try {
      setValidationErrors([]);

      await addMutation.mutateAsync({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        role: formData.role,
      });

      report.manageTeamMemberAdded({
        success: true,
        error: null,
        memberEmail: formData.email.trim(),
        memberRole: formData.role,
      });
      onMemberAdded?.();

      // Stay open, reset form so user can add another. Toast is fired by the
      // mutation hook.
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        role: roleOptions.length > 0 ? roleOptions[0].value : "",
      });
    } catch (error: unknown) {
      console.error("[IndividualAddTab] Save error:", error);

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
            detail || "Failed to add team member. Please check your input.";
          report.manageTeamMemberAdded({
            success: false,
            error: msg,
            memberEmail: formData.email.trim(),
            memberRole: formData.role,
          });
          setValidationErrors([msg]);
          return;
        }

        if (response?.status === 403) {
          const detail = response.data?.detail || response.data?.message;
          const msg =
            detail || "You don't have permission to assign this role.";
          report.manageTeamMemberAdded({
            success: false,
            error: msg,
            memberEmail: formData.email.trim(),
            memberRole: formData.role,
          });
          setValidationErrors([msg]);
          return;
        }
      }

      const errorMessage =
        error && typeof error === "object" && "message" in error
          ? (error as { message: string }).message
          : "Failed to add team member. Please try again.";
      report.manageTeamMemberAdded({
        success: false,
        error: errorMessage,
        memberEmail: formData.email.trim(),
        memberRole: formData.role,
      });
      setValidationErrors([errorMessage]);
    }
  };

  // Register footer with the shell. Re-registers when button state changes.
  useEffect(() => {
    onRegisterFooter(
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={onClose}
          className="px-3 py-2 text-sm font-medium text-gray-800 bg-gray-50 border border-gray-100 rounded-xl hover:bg-gray-100 hover:border-gray-200 transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={
            addMutation.isPending || rolesLoading || !!rolesNotInitialized
          }
          className="px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {addMutation.isPending ? "Adding..." : "Add Team Member"}
        </button>
      </div>,
    );
    // handleSave is recreated each render but that's fine — we just need the
    // latest closure in the registered footer node.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    addMutation.isPending,
    rolesLoading,
    rolesNotInitialized,
    onClose,
    formData,
  ]);

  return (
    <div className="space-y-5 max-w-md">
      {validationErrors.length > 0 && (
        <Banner
          variant="error"
          message={validationErrors.join(". ")}
          dismissible={false}
        />
      )}

      {rolesNotInitialized && (
        <Banner
          variant="warning"
          message="Team roles not initialized. Please contact your administrator to set up roles first."
          dismissible={false}
        />
      )}

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
                {roles.find((r) => r.name === formData.role)?.description}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
