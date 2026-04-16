import { StiggProvider } from "@stigg/react-sdk";
import "@stigg/react-sdk/dist/styles.css";
import { useUser } from "../../hooks/useUser";
import { UsagePortal } from "../usage/UsagePortal";

const STIGG_API_KEY = import.meta.env.VITE_STIGG_CLIENT_KEY;

export function UsageTab() {
  const { user, loading } = useUser();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!STIGG_API_KEY || !user?.tenantId) {
    return (
      <div className="text-center py-12 text-gray-500 text-sm">
        Usage tracking is not configured. Contact your administrator.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-8 pt-6">
        <h2 className="text-xl font-semibold text-gray-900">Usage</h2>
        <p className="text-sm text-gray-500 mt-1">
          Monitor resource consumption
        </p>
      </div>

      <div className="flex-1 overflow-y-auto settings-scrollbar">
        <div className="p-8 w-full">
          <StiggProvider apiKey={STIGG_API_KEY} customerId={user.tenantId}>
            <UsagePortal />
          </StiggProvider>
        </div>
      </div>
    </div>
  );
}
