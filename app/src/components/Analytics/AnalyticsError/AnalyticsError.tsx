import { WarningCircle } from "@phosphor-icons/react";

interface AnalyticsErrorProps {
  error?: string | null;
}

const AnalyticsError = ({ error }: AnalyticsErrorProps) => (
  <div className="flex flex-1 items-center justify-center rounded-xl bg-white shadow-xs border border-gray-100">
    <div className="flex flex-col items-center gap-3 text-center px-6">
      <WarningCircle size={40} weight="duotone" className="text-gray-300" />
      <div>
        <p className="text-sm font-medium text-gray-700">
          {error ? "Failed to load dashboard" : "Dashboard not found"}
        </p>
        {error && <p className="mt-1 text-xs text-gray-500">{error}</p>}
      </div>
    </div>
  </div>
);

export { AnalyticsError };
