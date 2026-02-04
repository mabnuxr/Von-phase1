import React, { useState, useMemo, useCallback, useEffect, Children, isValidElement } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, DatabaseIcon } from '@phosphor-icons/react';
import type { TransparencyDrawerProps, TransparencyDrawerTabProps, TabConfig } from './types';
import { DrawerBackdrop, TabNavigation } from './components';
import { useHorizontalResize } from '../ArtifactViewer/hooks';

const Tab: React.FC<TransparencyDrawerTabProps> = ({ children }) => {
  return <>{children}</>;
};

Tab.displayName = 'TransparencyDrawer.Tab';

const TransparencyDrawerBase: React.FC<TransparencyDrawerProps> = ({
  isOpen,
  onClose,
  title = 'Sources',
  children,
  activeTab: controlledActiveTab,
  defaultActiveTab,
  onTabChange,
  isLoading = false,
}) => {
  const tabs = useMemo(() => {
    const tabData: { config: TabConfig; content: React.ReactNode }[] = [];

    Children.forEach(children, (child) => {
      if (isValidElement<TransparencyDrawerTabProps>(child) && child.type === Tab) {
        tabData.push({
          config: child.props.config,
          content: child.props.children,
        });
      }
    });

    // Filter to only show tabs with data (count > 0)
    return tabData.filter((tab) => tab.config.count > 0);
  }, [children]);

  const [internalActiveTab, setInternalActiveTab] = useState<string>(
    defaultActiveTab || tabs[0]?.config.id || ''
  );

  const activeTabId = controlledActiveTab ?? internalActiveTab;

  // Automatically select the first tab with data when:
  // 1. The drawer opens and no tab is selected
  // 2. The currently active tab no longer has data
  useEffect(() => {
    if (tabs.length === 0) return;

    const currentTabExists = tabs.some((tab) => tab.config.id === activeTabId);
    const firstAvailableTabId = tabs[0]?.config.id;

    // If current tab doesn't exist (filtered out due to no data) or no tab is selected,
    // switch to the first available tab
    if (!currentTabExists || !activeTabId) {
      if (controlledActiveTab === undefined && firstAvailableTabId) {
        setInternalActiveTab(firstAvailableTabId);
      }
      if (firstAvailableTabId && onTabChange) {
        onTabChange(firstAvailableTabId);
      }
    }
  }, [tabs, activeTabId, controlledActiveTab, onTabChange]);

  const handleTabChange = useCallback(
    (tabId: string) => {
      if (controlledActiveTab === undefined) {
        setInternalActiveTab(tabId);
      }
      onTabChange?.(tabId);
    },
    [controlledActiveTab, onTabChange]
  );

  const tabConfigs: TabConfig[] = useMemo(() => tabs.map((tab) => tab.config), [tabs]);

  const activeTabContent = useMemo(
    () => tabs.find((tab) => tab.config.id === activeTabId)?.content,
    [tabs, activeTabId]
  );

  const activeTabIndex = useMemo(
    () => tabs.findIndex((tab) => tab.config.id === activeTabId),
    [tabs, activeTabId]
  );

  // Horizontal resize functionality - larger default for data tables
  const { width, handleProps } = useHorizontalResize({
    initialWidth: 800,
    minWidth: 500,
    storageKey: 'transparency-drawer-width',
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <DrawerBackdrop onClose={onClose} />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{ width: `${width}px` }}
            className="fixed right-0 top-0 h-full max-w-[90vw] pr-2 py-2 z-[9999]"
          >
            {/* Resize Handle - transparent, wider hit area for easier dragging */}
            <div
              {...handleProps}
              className="absolute left-0 top-0 bottom-0 w-3 z-10 cursor-ew-resize"
            />

            <div className="h-full flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-2 border-b border-gray-200 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-50">
                    <DatabaseIcon size={18} weight="duotone" className="text-indigo-600" />
                  </div>
                  <h2 className="text-base font-semibold text-gray-900">{title}</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                >
                  <XIcon size={18} weight="bold" />
                </button>
              </div>

              {isLoading ? (
                <div className="flex-1 overflow-hidden flex flex-col">
                  <div className="flex flex-col h-full animate-pulse">
                    {/* Tab navigation shimmer */}
                    <div className="px-5 py-3 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="h-7 bg-gray-200 rounded-full"
                            style={{ width: `${50 + i * 15}px` }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Content shimmer */}
                    <div className="px-5 py-4 flex flex-col gap-4">
                      {/* Query pills shimmer */}
                      <div className="flex items-center gap-2">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="h-7 bg-gray-200 rounded-full"
                            style={{ width: `${60 + i * 20}px` }}
                          />
                        ))}
                      </div>

                      {/* SQL section shimmer */}
                      <div className="rounded-lg border border-gray-200 overflow-hidden">
                        <div className="px-3 py-2 bg-gray-50 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-gray-200 rounded" />
                            <div className="w-16 h-3 bg-gray-200 rounded" />
                          </div>
                          <div className="w-10 h-3 bg-gray-200 rounded" />
                        </div>
                      </div>

                      {/* Table shimmer */}
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                              {[1, 2, 3, 4].map((i) => (
                                <th key={i} className="px-3 py-2">
                                  <div className="h-3 bg-gray-200 rounded w-16" />
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {[1, 2, 3, 4, 5].map((row) => (
                              <tr key={row} className="border-b border-gray-100">
                                {[1, 2, 3, 4].map((col) => (
                                  <td key={col} className="px-3 py-2">
                                    <div className="h-3 bg-gray-200 rounded w-3/4" />
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              ) : tabs.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-4">
                    <DatabaseIcon size={28} weight="duotone" className="text-gray-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-500">No sources found</p>
                </div>
              ) : (
                <>
                  <div className="px-5 py-3 border-b border-gray-100 shrink-0">
                    <TabNavigation
                      tabs={tabConfigs}
                      activeTab={activeTabId}
                      onTabChange={handleTabChange}
                    />
                  </div>

                  <div className="flex-1 overflow-hidden flex flex-col">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeTabId}
                        initial={{ opacity: 0, x: activeTabIndex === 0 ? -10 : 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: activeTabIndex === 0 ? 10 : -10 }}
                        transition={{ duration: 0.15 }}
                        className="flex-1 flex flex-col overflow-hidden"
                      >
                        {activeTabContent}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

TransparencyDrawerBase.displayName = 'TransparencyDrawer';

export const TransparencyDrawer = Object.assign(TransparencyDrawerBase, {
  Tab,
});

export default TransparencyDrawer;
