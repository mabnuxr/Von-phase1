import { VonAiFieldsDefaultPanel } from "../VonAiFieldsDefaultPanel";

interface VonAiFieldsDefaultTabProps {
  onRowClick: (fieldId: string) => void;
}

export function VonAiFieldsDefaultTab({
  onRowClick,
}: VonAiFieldsDefaultTabProps) {
  return (
    <div className="flex flex-col h-full p-2">
      <div className="">
        <div className="px-4 pt-4 pb-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Default AI Fields
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                System-provided AI fields. Enable the ones you want — they run
                on the same schedule as your custom fields. You can&apos;t edit
                or delete defaults.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 justify-center overflow-y-auto settings-scrollbar px-6">
        <div className="pt-6 pb-12 w-full max-w-4xl mx-auto">
          <VonAiFieldsDefaultPanel onRowClick={onRowClick} />
        </div>
      </div>
    </div>
  );
}
