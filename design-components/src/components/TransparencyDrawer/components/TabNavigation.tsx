import React, { useCallback } from 'react';
import type { TabNavigationProps } from '../types';

export const TabNavigation = React.memo<TabNavigationProps>(({ tabs, activeTab, onTabChange }) => {
  const handleTabClick = useCallback(
    (tabId: string) => {
      onTabChange(tabId);
    },
    [onTabChange]
  );

  return (
    <div className="flex items-center gap-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => handleTabClick(tab.id)}
          className={`
              flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium
              transition-colors duration-150 cursor-pointer
              ${
                activeTab === tab.id
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }
            `}
        >
          {tab.icon}
          {tab.label}
          {tab.count > 0 && (
            <span
              className={`text-[11px] px-1.5 py-0.5 rounded-md ${
                activeTab === tab.id ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
});

TabNavigation.displayName = 'TabNavigation';
