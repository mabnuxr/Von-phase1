/**
 * DashboardPanel - Displays dashboard metadata after creation
 *
 * Shows dashboard information as a panel at the bottom of the assistant message
 * when a dashboard is successfully created.
 */

import React from 'react';
import type { DashboardMetadata } from './DeepResearchChat';

export interface DashboardPanelProps {
  dashboard: DashboardMetadata;
  /** Optional navigation callback — provide React Router's navigate for SPA navigation */
  onNavigate?: (url: string) => void;
}

export const DashboardPanel: React.FC<DashboardPanelProps> = ({ dashboard, onNavigate }) => {
  const handleViewDashboard = () => {
    // Construct dashboard URL from ID and version
    const dashboardUrl = `/dashboard/${dashboard.dashboard_id}?version=${dashboard.dashboard_version}`;
    if (onNavigate) {
      onNavigate(dashboardUrl);
    } else {
      window.location.href = dashboardUrl;
    }
  };

  return (
    <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <svg
              className="h-5 w-5 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <h3 className="font-semibold text-gray-900">Dashboard Created</h3>
          </div>
          <div className="mt-2 space-y-1 text-sm text-gray-600">
            <p className="font-medium text-gray-900">{dashboard.dashboard_name}</p>
            <div className="flex gap-4">
              <span>{dashboard.panel_count} panels</span>
              <span>{dashboard.query_count} queries</span>
              <span>Version {dashboard.dashboard_version}</span>
            </div>
          </div>
        </div>
        <button
          onClick={handleViewDashboard}
          className="ml-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          View Dashboard →
        </button>
      </div>
    </div>
  );
};
