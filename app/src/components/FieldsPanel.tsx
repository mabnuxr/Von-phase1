import usePreferencesStore from "../store/preferencesStore";
import { FieldItem } from "./FieldItem";

export default function FieldsPanel() {
  const { salesforceFields, fieldsSearchTerm: searchTerm } =
    usePreferencesStore();

  // Filter fields based on search term
  const filteredFields = salesforceFields.filter((field) =>
    field.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="w-full h-full flex flex-col">
      {/* Fields List */}
      <div className="px-6 pt-6 pb-4 flex-1 overflow-y-auto min-h-0 settings-scrollbar">
        <div className="px-6 pt-2 pb-6 space-y-2 max-w-4xl">
          {filteredFields.map((field) => (
            <FieldItem key={field.id} field={field} />
          ))}
        </div>
      </div>
    </div>
  );
}
