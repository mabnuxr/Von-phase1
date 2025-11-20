import usePreferencesStore, { type Field } from "../store/preferencesStore";
import { FieldItem } from "./FieldItem";

export default function FieldsPanel() {
  const { salesforceFields, fieldsSearchTerm: searchTerm } =
    usePreferencesStore();

  // Filter fields based on search term
  const filteredFields = salesforceFields.filter((field: { name: string }) =>
    field.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="w-full h-full flex flex-col">
      {/* Fields List */}
      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-6">
        <div className="space-y-3">
          {filteredFields.map((field: Field) => (
            <FieldItem key={field.id} field={field} />
          ))}
        </div>
      </div>
    </div>
  );
}
