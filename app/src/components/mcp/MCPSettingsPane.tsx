import { useState, useEffect } from "react";
import { RadioButton } from "@vonlabs/design-components";
import { X, MagnifyingGlass } from "@phosphor-icons/react";
import {
  useMCPSettings,
  useUpdateMCPSettings,
} from "../../hooks/useMCPServers";
import type { MCPSettings } from "../../types/mcp";

interface MCPSettingsPaneProps {
  onClose: () => void;
}

export function MCPSettingsPane({ onClose }: MCPSettingsPaneProps) {
  const { data: settings, isLoading } = useMCPSettings();
  const updateMutation = useUpdateMCPSettings();

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(), 300);
  };

  const handleRegistrationChange = (
    value: MCPSettings["custom_mcp_registration"],
  ) => {
    updateMutation.mutate({ custom_mcp_registration: value });
  };

  const registration = settings?.custom_mcp_registration || "admin_only";

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/20 transition-opacity duration-300 z-40 ${isVisible ? "opacity-100" : "opacity-0"}`}
        onClick={handleClose}
      />
      <div
        className={`fixed top-0 right-0 h-full w-[420px] p-2 z-50 transform transition-transform duration-300 ease-in-out ${isVisible ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="h-full flex flex-col bg-white rounded-xl border border-gray-200 shadow-xs">
          {/* Header */}
          <div className="px-5 py-4 border-b border-gray-200 shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  MCP Settings
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Workspace-level controls for MCP connectors
                </p>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 cursor-pointer p-1"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto settings-scrollbar px-5 py-5 space-y-8">
            {isLoading ? (
              <p className="text-sm text-gray-500">Loading settings…</p>
            ) : (
              <>
                {/* ── Connector Library ── */}
                <div>
                  <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    Connector Library
                  </h3>
                  <p className="text-xs text-gray-500 mb-4">
                    Control which MCP apps users can connect.
                  </p>

                  {/* Block all toggle */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Block all connectors
                      </p>
                      <p className="text-xs text-gray-500">
                        All users see "Request Access" on every app
                      </p>
                    </div>
                    {/* Simple toggle placeholder — could use a proper Toggle component */}
                    <button className="w-10 h-5 rounded-full bg-gray-200 relative cursor-pointer">
                      <div className="w-4 h-4 rounded-full bg-white shadow absolute top-0.5 left-0.5 transition-transform" />
                    </button>
                  </div>

                  {/* Block selective apps dropdown placeholder */}
                  <div className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-600 cursor-pointer hover:bg-gray-50">
                    Block selective apps
                  </div>
                </div>

                {/* ── Custom MCP Apps ── */}
                <div>
                  <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    Custom MCP Apps
                  </h3>
                  <p className="text-xs text-gray-500 mb-4">
                    Control who can add custom MCP server connections.
                  </p>

                  <div className="space-y-3">
                    <RadioButton
                      name="mcpRegistration"
                      value="all_members"
                      checked={registration === "all_members"}
                      onChange={() => handleRegistrationChange("all_members")}
                      label="All users"
                      helperText="Any user in the workspace can add custom MCP apps"
                      disabled={updateMutation.isPending}
                    />
                    <RadioButton
                      name="mcpRegistration"
                      value="admin_only"
                      checked={registration === "admin_only"}
                      onChange={() => handleRegistrationChange("admin_only")}
                      label="Admins only"
                      helperText="Only admins can add custom MCP apps"
                      disabled={updateMutation.isPending}
                    />
                    <RadioButton
                      name="mcpRegistration"
                      value="user_allowlist"
                      checked={registration === "user_allowlist"}
                      onChange={() =>
                        handleRegistrationChange("user_allowlist")
                      }
                      label="Specific users"
                      helperText="Choose which users can add custom MCP apps"
                      disabled={updateMutation.isPending}
                    />
                  </div>

                  {/* User chips (shown when specific users selected) */}
                  {registration === "user_allowlist" && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <div className="relative">
                        <MagnifyingGlass
                          size={14}
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <input
                          type="text"
                          placeholder="Search and add users..."
                          className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder:text-gray-400"
                        />
                      </div>
                    </div>
                  )}

                  {/* Save indicator */}
                  {updateMutation.isSuccess && (
                    <p className="text-xs text-green-600 mt-2">✓ Saved</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
