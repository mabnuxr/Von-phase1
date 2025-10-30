import usePreferencesStore from "../store/preferencesStore";

interface AppConfig {
  id: string;
  name: string;
  logoPath: string;
  disabled?: boolean;
}

const apps: AppConfig[] = [
  {
    id: "salesforce",
    name: "Salesforce",
    logoPath: "/Images/salesforce.svg",
  },
  {
    id: "gong",
    name: "Gong",
    logoPath: "/Images/gong.svg",
  },
  {
    id: "hubspot",
    name: "HubSpot",
    logoPath: "/Images/hubspot.svg",
    disabled: true,
  },
];

/**
 * AppsConfigPanel - Displays integration icons for configuration
 */
export function AppsConfigPanel() {
  const { setConfiguringIntegration, clearIntegrationConfig } =
    usePreferencesStore();

  const handleAppClick = (appId: string, disabled?: boolean) => {
    if (disabled) return;
    // Clear any stale config before opening to ensure fresh start
    clearIntegrationConfig(appId);
    setConfiguringIntegration(appId);
  };

  return (
    <div className="px-6 py-6">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4 max-w-4xl">
        {apps.map((app) => (
          <button
            key={app.id}
            onClick={() => handleAppClick(app.id, app.disabled)}
            disabled={app.disabled}
            className={`
              flex flex-col items-center justify-center
              p-8 rounded-xl border border-gray-200
              transition-all duration-200
              ${
                app.disabled
                  ? "opacity-50 cursor-not-allowed bg-gray-50"
                  : "hover:border-gray-400 hover:shadow-sm cursor-pointer bg-white"
              }
            `}
          >
            {/* App Icon */}
            <div className="w-16 h-16 mb-4 flex items-center justify-center">
              <img
                src={app.logoPath}
                alt={app.name}
                className="w-full h-full object-contain"
              />
            </div>

            {/* App Name */}
            <span className="text-sm font-medium text-gray-900">
              {app.name}
            </span>

            {/* Coming Soon Badge for Disabled Apps */}
            {app.disabled && (
              <span className="mt-2 text-xs text-gray-500 font-normal">
                Coming soon
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
