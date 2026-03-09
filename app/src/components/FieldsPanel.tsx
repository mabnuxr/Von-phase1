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
      <div className="h-full w-full pb-6">
        <div className="flex flex-col gap-6 h-full w-full max-w-4xl mx-auto">
          {/* Header Row with Description and Search */}
          <div className="flex flex-col items-baseline justify-between">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                Salesforce Field Mappings
              </h3>
              <p className="text-xs font-medium text-gray-600">
                Configure Salesforce object and field mappings for your org.
              </p>
            </div>
            <div className="relative mt-2 flex-1 w-full">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setFieldsSearchTerm(e.target.value)}
                placeholder="Search fields..."
                className="w-full px-4 py-2.5 pl-10 text-sm text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-gray-100 focus:border-2 focus:border-gray-300 transition-all duration-200 bg-white hover:border-gray-300 shadow-xs"
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

          <div className="flex-1 overflow-y-auto settings-scrollbar">
            {/* Fields List */}
            <div className="flex-1 space-y-2">
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
    </div>
  );
}
