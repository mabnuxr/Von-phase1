import usePreferencesStore from "../store/preferencesStore";
import { getAllIntegrations } from "../constants/integrationMetadata";
import type { IntegrationMetadata } from "../constants/integrationMetadata";
import { useFeatureFlag } from "../hooks/useFeatureFlag";

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
    <div className="px-6 py-6">
      {CATEGORY_ORDER.map((category) => {
        const categoryApps = appsByCategory[category];
        if (!categoryApps || categoryApps.length === 0) return null;

        return (
          <div key={category} className="mb-6 last:mb-0">
            {/* Category Header */}
            <h3 className="mb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {category}
            </h3>

            {/* App Grid */}
            <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3 max-w-5xl">
              {categoryApps.map((app) => (
                <button
                  key={app.id}
                  onClick={() => handleAppClick(app.id, app.disabled)}
                  disabled={app.disabled}
                  className={`
                    group relative flex flex-col items-center justify-center
                    ${app.id === "googlecalendar" ? "p-5" : "p-4"}
                    rounded-lg border transition-all duration-300 ease-out
                    ${
                      app.disabled
                        ? "opacity-40 cursor-not-allowed bg-gray-50 border-gray-200"
                        : "cursor-pointer bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50 hover:-translate-y-1 active:translate-y-0"
                    }
                  `}
                >
                  {/* App Icon */}
                  <div className="w-10 h-10 mb-2 flex items-center justify-center">
                    <img
                      src={app.logoPath}
                      alt={app.name}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* App Name */}
                  <span className="text-xs font-medium text-gray-900 text-center">
                    {app.name}
                  </span>

                  {/* Coming Soon Badge for Disabled Apps */}
                  {app.disabled && (
                    <span className="mt-1.5 text-[10px] text-gray-500">
                      Coming soon
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
