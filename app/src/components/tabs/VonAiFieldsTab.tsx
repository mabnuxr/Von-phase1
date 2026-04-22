import { VonAiFieldsPanel } from "../VonAiFieldsPanel";
import useVonAiFieldsStore from "../../store/vonAiFieldsStore";

export function VonAiFieldsTab() {
  const { setPaneMode } = useVonAiFieldsStore();

  return (
    <div className="flex flex-col h-full p-2">
      {/* Heading - Fixed */}
      <div className="">
        <div className="px-4 pt-4 pb-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Von AI Fields
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Define questions that run automatically against matching
                records. Outputs become context Von uses in chat, filters, and
                exports.
              </p>
            </div>
            <button
              onClick={() => setPaneMode("create")}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer shrink-0"
            >
              + New question
            </button>
          </div>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 justify-center overflow-y-auto settings-scrollbar px-6">
        <div className="pt-6 pb-12 w-full mx-auto">
          <VonAiFieldsPanel />
        </div>
      </div>
    </div>
  );
}
