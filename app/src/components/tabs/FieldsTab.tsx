import { VonIQFieldsPanel } from "../VonIQFieldsPanel";

export function FieldsTab() {
  return (
    <div className="flex flex-col h-full p-2">
      {/* Heading - Fixed */}
      <div className="">
        <div className="px-4 pt-4 pb-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Fields</h2>
          <p className="text-sm text-gray-600">Manage your VonIQ fields</p>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 justify-center overflow-y-auto settings-scrollbar px-6">
        <div className="pt-6 pb-12 space-y-6 w-full max-w-4xl mx-auto">
          <VonIQFieldsPanel />
        </div>
      </div>
    </div>
  );
}
