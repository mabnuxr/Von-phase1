import { useState } from "react";
import usePreferencesStore from "../store/preferencesStore";
import {
  getAllIntegrations,
  canBeOrgLevel,
  canBeUserLevel,
  getIntegrationDescription,
} from "../constants/integrationMetadata";
import type { IntegrationMetadata } from "../constants/integrationMetadata";
import { useFeatureFlag } from "../hooks/useFeatureFlag";
import { usePermissions, Resource } from "../hooks/usePermissions";
import { Button } from "@vonlabs/design-components";
import { SegmentedControl } from "./SegmentedControl";

// Define category order for display
const CATEGORY_ORDER: Array<
  | "CRM"
  | "Call Recorder"
  | "Internal Documents"
  | "Sales Engagement"
  | "Data Warehouse"
  | "Customer Support"
  | "Other"
> = [
  "CRM",
  "Call Recorder",
  "Internal Documents",
  "Sales Engagement",
  "Data Warehouse",
  "Customer Support",
  "Other",
];

/**
 * Renders a list of integrations grouped by category
 */
function IntegrationCategoryList({
  apps,
  onConnect,
  disabledReason,
  isPersonal = false,
}: {
  apps: IntegrationMetadata[];
  onConnect: (appId: string, accessLevel: "tenant" | "user") => void;
  disabledReason?: string;
  isPersonal?: boolean;
}) {
  // Group apps by category
  const appsByCategory = apps.reduce(
    (acc, app) => {
      if (!acc[app.category]) {
        acc[app.category] = [];
      }
      acc[app.category].push(app);
      return acc;
    },
    {} as Record<string, IntegrationMetadata[]>,
  );

  const nonEmptyCategories = CATEGORY_ORDER.filter(
    (c) => appsByCategory[c]?.length > 0,
  );

  if (apps.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No integrations available
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {CATEGORY_ORDER.map((category, categoryIndex) => {
        const categoryApps = appsByCategory[category];
        if (!categoryApps || categoryApps.length === 0) return null;

        return (
          <div key={category}>
            {/* Category Header */}
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {category}
              </h3>
            </div>

            {/* App List */}
            <div className="divide-y divide-gray-200">
              {categoryApps.map((app) => {
                const isDisabled = app.disabled || !!disabledReason;
                return (
                  <div
                    key={app.id}
                    className={`
                      flex items-center justify-between px-4 py-4
                      ${isDisabled ? "opacity-50" : ""}
                    `}
                  >
                    {/* Left side - Icon and Info */}
                    <div className="flex items-center gap-4">
                      {/* App Icon */}
                      <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                        <img
                          src={app.logoPath}
                          alt={app.name}
                          className="w-full h-full object-contain"
                        />
                      </div>

                      {/* App Name and Description */}
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">
                          {app.name}
                        </span>
                        <span className="text-sm text-gray-500">
                          {getIntegrationDescription(app.id, isPersonal)}
                        </span>
                      </div>
                    </div>

                    {/* Right side - Connect Button or Coming Soon */}
                    <div className="flex-shrink-0 ml-4">
                      {app.disabled ? (
                        <span className="text-sm text-gray-400">
                          Coming soon
                        </span>
                      ) : disabledReason ? (
                        <span className="text-sm text-gray-400">
                          {disabledReason}
                        </span>
                      ) : (
                        <Button
                          variant="secondary"
                          size="small"
                          onClick={() => {
                            // Determine access level based on which section this is in
                            const accessLevel = canBeOrgLevel(app.id)
                              ? "tenant"
                              : "user";
                            onConnect(app.id, accessLevel);
                          }}
                        >
                          Connect
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add bottom border except for last category */}
            {categoryIndex < nonEmptyCategories.length - 1 && (
              <div className="border-b border-gray-200" />
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * AppsConfigPanel - Displays integration icons grouped by organization and personal sections
 */
export function AppsConfigPanel() {
  const {
    setConfiguringWorkspaceIntegration,
    setConfiguringPersonalIntegration,
  } = usePreferencesStore();
  const { isGoogleCalendarEnabled } = useFeatureFlag();

  // Check if user can create org-level integrations
  const { data: integrationPermissions } = usePermissions(Resource.INTEGRATION);
  const canCreateOrgIntegration = integrationPermissions?.create ?? false;

  const handleConnect = (appId: string, accessLevel: "tenant" | "user") => {
    // Open the appropriate pane based on access level
    // Each pane manages its own state and unmounts when closed
    if (accessLevel === "tenant") {
      setConfiguringWorkspaceIntegration(appId);
    } else {
      setConfiguringPersonalIntegration(appId);
    }
  };

  // Get all integrations and filter based on feature flags
  const allApps = getAllIntegrations().filter((app) => {
    // Filter out Google Calendar if feature flag is disabled
    if (app.id === "googlecalendar" && !isGoogleCalendarEnabled) {
      return false;
    }
    return true;
  });

  // Split apps into org-level and user-level
  const orgApps = allApps.filter((app) => canBeOrgLevel(app.id));
  const userApps = allApps.filter((app) => canBeUserLevel(app.id));

  // Segmented control state
  const [activeSection, setActiveSection] = useState<"workspace" | "personal">(
    "personal",
  );

  return (
    <div className="space-y-2">
      {/* Segmented Control */}
      <SegmentedControl
        options={[
          { value: "personal", label: "Personal" },
          { value: "workspace", label: "Workspace" },
        ]}
        value={activeSection}
        onChange={setActiveSection}
      />

      {/* Helper text for sections */}
      {activeSection === "workspace" ? (
        <p className="text-xs text-gray-500 px-1">
          Workspace integrations can only be managed by admins.
        </p>
      ) : (
        <p className="text-xs text-gray-500 px-1">
          Personal integrations are private to your account.
        </p>
      )}

      {/* Integration List */}
      {activeSection === "workspace" ? (
        <IntegrationCategoryList
          apps={orgApps}
          onConnect={(appId) => handleConnect(appId, "tenant")}
          disabledReason={
            !canCreateOrgIntegration ? "Admin access required" : undefined
          }
          isPersonal={false}
        />
      ) : (
        <IntegrationCategoryList
          apps={userApps}
          onConnect={(appId) => handleConnect(appId, "user")}
          isPersonal={true}
        />
      )}
    </div>
  );
}
