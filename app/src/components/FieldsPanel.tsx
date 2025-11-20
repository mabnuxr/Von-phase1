import usePreferencesStore, { type Field } from "../store/preferencesStore";
import { FieldItem } from "./FieldItem";

export default function FieldsPanel() {
  const {
    salesforceFields,
    fieldsSearchTerm: searchTerm,
    setFieldsSearchTerm,
  } = usePreferencesStore();

  // Filter fields based on search term
  const filteredFields = salesforceFields.filter((field: { name: string }) =>
    field.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="w-full h-full flex flex-col">
      {/* Fields List */}
      <div className="flex-1 overflow-y-auto px-6 pt-2 pb-6">
        <div className="space-y-6">
          {/* Header Row with Description and Search */}
          <div className="flex flex-row items-baseline justify-between gap-4">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                Salesforce Field Mappings
              </h3>
              <p className="text-xs text-gray-600">
                Configure Salesforce object and field mappings for your org.
              </p>
            </div>
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setFieldsSearchTerm(e.target.value)}
                placeholder="Search fields..."
                className="w-full px-4 py-2 pl-10 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-von-purple focus:border-transparent bg-white"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {/* Fields List */}
          <div className="space-y-3">
            {filteredFields.map((field: Field) => (
              <FieldItem key={field.id} field={field} />
            ))}
            {filteredFields.length === 0 && (
              <div className="text-sm text-gray-500 text-center py-8 border border-dashed border-gray-300 rounded-lg">
                No fields found
                {searchTerm && ` matching "${searchTerm}"`}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
