import { TabSwitcher } from "@vonlabs/design-components";
import usePreferencesStore from "../store/preferencesStore";
import { EmailCategorizationTab } from "./tabs/EmailCategorizationTab";
import { ProcessConfigurationTab } from "./tabs/ProcessConfigurationTab";

export default function DefaultsPanel() {
  const { defaultsActiveTab: activeTab, setDefaultsActiveTab: setActiveTab } =
    usePreferencesStore();

  const tabs = [
    {
      id: "process-configuration",
      label: "Process Configuration",
    },
    {
      id: "email-categorization",
      label: "Email Categorization",
    },
  ];

  return (
    <div className="w-full h-full flex flex-col">
      {/* Tab Switcher */}
      <div className="px-6 pt-6 pb-4 shrink-0">
        <TabSwitcher
          tabs={tabs}
          activeTabId={activeTab}
          onTabClick={(id) =>
            setActiveTab(id as "email-categorization" | "process-configuration")
          }
        />
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto min-h-0 settings-scrollbar">
        {activeTab === "email-categorization" ? (
          <EmailCategorizationTab />
        ) : (
          <ProcessConfigurationTab />
        )}
      </div>
    </div>
  );
}
