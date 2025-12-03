import usePreferencesStore from "../store/preferencesStore";
import { getAllIntegrations } from "../constants/integrationMetadata";
import type { IntegrationMetadata } from "../constants/integrationMetadata";
import { useFeatureFlag } from "../hooks/useFeatureFlag";
import { Button } from "@vonlabs/design-components";

// Define category order for display
const CATEGORY_ORDER: Array<"CRM" | "Call Recorder" | "Other"> = [
  "CRM",
  "Call Recorder",
  "Other",
];

/**
 * AppsConfigPanel - Displays integration icons grouped by category
 */
export function AppsConfigPanel() {
  const { setConfiguringIntegration, clearIntegrationConfig } =
    usePreferencesStore();
  const { isGoogleCalendarEnabled } = useFeatureFlag();

  const handleAppClick = (appId: string, disabled?: boolean) => {
    if (disabled) return;
    // Clear any stale config before opening to ensure fresh start
    clearIntegrationConfig(appId);
    setConfiguringIntegration(appId);
  };

  // Get all integrations and filter based on feature flags
  const apps = getAllIntegrations().filter((app) => {
    // Filter out Google Calendar if feature flag is disabled
    if (app.id === "googlecalendar" && !isGoogleCalendarEnabled) {
      return false;
    }
    return true;
  });

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
              {categoryApps.map((app, appIndex) => (
                <div
                  key={app.id}
                  className={`
                    flex items-center justify-between px-4 py-4
                    ${app.disabled ? "opacity-50" : ""}
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
                        {app.description}
                      </span>
                    </div>
                  </div>

                  {/* Right side - Connect Button or Coming Soon */}
                  <div className="flex-shrink-0 ml-4">
                    {app.disabled ? (
                      <span className="text-sm text-gray-400">Coming soon</span>
                    ) : (
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={() => handleAppClick(app.id, app.disabled)}
                      >
                        Connect
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add bottom border except for last category */}
            {categoryIndex < CATEGORY_ORDER.filter(c => appsByCategory[c]?.length > 0).length - 1 && (
              <div className="border-b border-gray-200" />
            )}
          </div>
        );
      })}
    </div>
  );
}
