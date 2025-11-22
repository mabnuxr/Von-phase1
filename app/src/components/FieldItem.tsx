import usePreferencesStore from "../store/preferencesStore";
import type { Field } from "../store/preferencesStore";
import { EditIcon } from "./icons";

interface FieldItemProps {
  field: Field;
}

export function FieldItem({ field }: FieldItemProps) {
  const { setEditingField } = usePreferencesStore();

  const handleEdit = () => {
    setEditingField(field.id, "salesforce");
  };

  return (
    <div
      className="p-2 rounded-lg border border-gray-200 bg-gray-50 transition-all duration-200 hover:border-gray-400 cursor-pointer"
      onClick={handleEdit}
    >
      <div className="w-full px-4 py-2.5 flex items-center gap-3">
        {/* Field Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 m-0">
            {field.name}
          </h3>
        </div>

        {/* Edit Icon - Integrated (not clickable separately) */}
        <span className="text-gray-400" title="Edit field">
          <EditIcon className="size-4" />
        </span>
      </div>
    </div>
  );
}
