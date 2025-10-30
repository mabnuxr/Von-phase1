import { ProcessConfigurationTab } from "./tabs/ProcessConfigurationTab";

export default function DefaultsPanel() {
  return (
    <div className="w-full h-full flex flex-col">
      {/* Tab Switcher */}
      {/* <div className="px-6 pt-6 pb-4 shrink-0">
        <TabSwitcher
          tabs={tabs}
          activeTabId={activeTab}
          onTabClick={(id) =>
            setActiveTab(id as "email-categorization" | "process-configuration")
          }
        />
      </div> */}

      {/* Tab Content */}
      <div className="p-6 flex-1 overflow-y-auto min-h-0 settings-scrollbar">
        <ProcessConfigurationTab />
      </div>
    </div>
  );
}
