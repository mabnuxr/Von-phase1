import React, { useState, useMemo, useCallback, Children, isValidElement } from 'react';
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

    return tabData;
  }, [children]);

  const [internalActiveTab, setInternalActiveTab] = useState<string>(
    defaultActiveTab || tabs[0]?.config.id || ''
  );

  const activeTabId = controlledActiveTab ?? internalActiveTab;

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
