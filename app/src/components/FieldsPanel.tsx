import { TabSwitcher } from "@vonlabs/design-components";
import usePreferencesStore from "../store/preferencesStore";
import { SearchIcon, PlusIcon } from "./icons";
import { FieldItem } from "./FieldItem";

export default function FieldsPanel() {
  const {
    fieldsActiveTab: activeTab,
    setFieldsActiveTab: setActiveTab,
    vonFields,
    salesforceFields,
    fieldsSearchTerm: searchTerm,
    setFieldsSearchTerm: setSearchTerm,
    addField,
    setEditingField,
  } = usePreferencesStore();

  const tabs = [
    {
      id: "von-fields",
      label: "Von fields",
    },
    {
      id: "salesforce-fields",
      label: "Salesforce fields",
    },
  ];

  const currentFields =
    activeTab === "von-fields" ? vonFields : salesforceFields;
  const category = activeTab === "von-fields" ? "von" : "salesforce";

  // Filter fields based on search term
  const filteredFields = currentFields.filter(
    (field) =>
      field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      field.apiName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Split fields into two sections
  // Section 1: Fields with Salesforce mapping (for Salesforce fields tab)
  // Section 2: All other fields
  const mappedFields = filteredFields.filter(
    (field) =>
      field.mappedSalesforceField && field.mappedSalesforceField.trim() !== "",
  );
  const otherFields = filteredFields.filter(
    (field) =>
      !field.mappedSalesforceField || field.mappedSalesforceField.trim() === "",
  );

  // Handle Add New button click
  const handleAddNew = () => {
    const newFieldId = `${category}-new-${Date.now()}`;
    const newField = {
      id: newFieldId,
      name: "",
      apiName: "",
      type: "Text",
      enabled: false,
      description: "",
      prompt: "",
      mappedSalesforceField: "",
      runConditionPrompt: "",
      runConditionPreview: "",
      source: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    // Add the new field to the store first
    addField(newField, category);
    // Then open the edit pane for it
    setEditingField(newFieldId);
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Tab Switcher */}
      <div className="px-6 pt-6 pb-4 shrink-0">
        <TabSwitcher
          tabs={tabs}
          activeTabId={activeTab}
          onTabClick={(id) =>
            setActiveTab(id as "von-fields" | "salesforce-fields")
          }
        />
      </div>

      {/* Search and Add Button */}
      <div className="px-6 pb-4 shrink-0">
        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="flex-1 relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <SearchIcon className="w-4 h-4 text-gray-500" />
            </div>
            <input
              type="text"
              placeholder="Search fields..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 text-sm text-[#1d1d1f] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white transition-all duration-200"
            />
          </div>

          {/* Add New Button */}
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-600 border border-purple-600 rounded-lg hover:bg-purple-50 transition-colors duration-200"
          >
            <PlusIcon className="w-4 h-4" />
            Add new
          </button>
        </div>
      </div>

      {/* Fields List */}
      <div className="flex-1 overflow-y-auto min-h-0 settings-scrollbar px-6 pb-6">
        {filteredFields.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-gray-500 text-sm">
              {searchTerm
                ? "No fields found matching your search."
                : "No fields yet. Click 'Add new' to create a field."}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Section 1: Mapped Fields */}
            {mappedFields.length > 0 && (
              <div>
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                  Map the following fields to Salesforce
                </h3>
                <div className="space-y-2">
                  {mappedFields.map((field) => (
                    <FieldItem
                      key={field.id}
                      field={field}
                      category={category}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Section 2: All Other Fields */}
            {otherFields.length > 0 && (
              <div>
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                  All fields
                </h3>
                <div className="space-y-2">
                  {otherFields.map((field) => (
                    <FieldItem
                      key={field.id}
                      field={field}
                      category={category}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
