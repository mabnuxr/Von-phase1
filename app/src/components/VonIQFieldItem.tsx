import usePreferencesStore from "../store/preferencesStore";
import type { VonIQField } from "../store/preferencesStore";
import { EyeIcon } from "./icons";

interface VonIQFieldItemProps {
  field: VonIQField;
  enabled: boolean;
  isUserDefined: boolean;
}

export function VonIQFieldItem({ field, isUserDefined }: VonIQFieldItemProps) {
  const { setEditingField } = usePreferencesStore();

  const handleViewDetails = () => {
    setEditingField(field.id, "voniq");
  };

  return (
    <div className="p-2 rounded-lg border border-gray-200 bg-gray-50 transition-all duration-200 hover:border-gray-400">
      <div className="w-full px-4 py-2.5 flex items-center gap-3">
        {/* Field Info */}
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900 m-0">
            {field.sourceFieldDisplayName}
          </h3>
          {isUserDefined && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
              Custom
            </span>
          )}
        </div>

        {/* Eye Icon - View details button */}
        <button
          onClick={handleViewDetails}
          className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors duration-200 hover:cursor-pointer"
          title={isUserDefined ? "Edit field" : "View field"}
        >
          <EyeIcon className="size-4" />
        </button>
      </div>
    </div>
  );
}
