import usePreferencesStore from "../../store/preferencesStore";
import FieldsPanel from "../FieldsPanel";
import { VonIQFieldsPanel } from "../VonIQFieldsPanel";
import { TabSwitcher } from "@vonlabs/design-components";

export function FieldsTab() {
  const { fieldsActiveTab, setFieldsActiveTab } = usePreferencesStore();

  const tabs = [
    { id: "voniq", label: "VonIQ Fields" },
    { id: "salesforce", label: "Salesforce Fields" },
  ];

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Tab Switcher */}
      <div className="px-6 pt-6 pb-4 shrink-0">
        <TabSwitcher
          tabs={tabs}
          activeTabId={fieldsActiveTab}
          onTabClick={(id) => setFieldsActiveTab(id as "salesforce" | "voniq")}
        />
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {fieldsActiveTab === "salesforce" ? (
          <FieldsPanel />
        ) : (
          <VonIQFieldsPanel />
        )}
      </div>
    </div>
  );
}
