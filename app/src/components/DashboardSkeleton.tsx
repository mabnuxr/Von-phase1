import { ChatSkeleton } from "@vonlabs/design-components";

/**
 * Full-page skeleton that mimics the Dashboard layout.
 * Used as a loading state while the app initializes (e.g., LaunchDarkly).
 */
export const DashboardSkeleton = () => {
  return (
    <div className="h-screen bg-gray-100 flex flex-col overflow-hidden">
      {/* TopBar skeleton */}
      <div className="bg-transparent px-3 py-2">
        <div className="flex items-center justify-between">
          {/* Logo placeholder */}
          <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
          {/* New chat button placeholder */}
          <div className="h-9 w-28 bg-gray-200 rounded-lg animate-pulse" />
        </div>
      </div>

      {/* Two-Pane Layout */}
      <div className="flex flex-1 px-3 pb-3 gap-2 overflow-hidden min-h-0">
        {/* Sidebar skeleton */}
        <div className="w-60 h-full rounded-lg bg-white shadow-xs border border-gray-200 p-3 space-y-3">
          {/* Search placeholder */}
          <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
          {/* Chat items placeholders */}
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-10 bg-gray-100 rounded-lg animate-pulse"
              />
            ))}
          </div>
        </div>

        {/* Chat area skeleton */}
        <div className="flex-1 min-w-0">
          <ChatSkeleton messageCount={4} />
        </div>
      </div>
    </div>
  );
};
