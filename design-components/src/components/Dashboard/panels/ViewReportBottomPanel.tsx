import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon } from '@phosphor-icons/react';
import { SecondaryIconButton } from '../../forms/buttons';
import { FilterButton, type FilterGroup } from '../../forms/filter';
import { ReportTable, buildGridOptions, type ReportColumn } from '../../ReportTable';
import { dashboardFilterFields } from './DashboardFilterBar';

export type { ReportColumn };

export interface ViewReportBottomPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  columns: ReportColumn[];
  rows: Record<string, unknown>[];
}

export const ViewReportBottomPanel: React.FC<ViewReportBottomPanelProps> = ({
  isOpen,
  onClose,
  title,
  columns,
  rows,
}) => {
  const [filterGroups, setFilterGroups] = useState<FilterGroup[]>([]);

  const gridOptions = useMemo(
    () =>
      buildGridOptions(columns, rows, {
        pageSize: 25,
      }),
    [columns, rows]
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/20 z-[100] rounded-xl"
            onClick={onClose}
          />

          {/* Bottom panel */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute left-0 right-0 bottom-0 z-[101] bg-white rounded-t-xl border-t border-gray-200 shadow-xl flex flex-col overflow-hidden"
            style={{ top: 56 }}
          >
            {/* Panel header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 flex-shrink-0">
              <span className="text-sm font-medium text-gray-900">{title}</span>
              <div className="flex items-center gap-1.5">
                <FilterButton
                  fields={dashboardFilterFields}
                  groups={filterGroups}
                  onGroupsChange={setFilterGroups}
                  hideIcon
                  readOnly
                />
                <SecondaryIconButton
                  icon={<XIcon size={14} />}
                  onClick={onClose}
                  title="Close"
                  className="!w-[38px] !h-[38px] rounded-xl border-gray-200 shadow-xs"
                />
              </div>
            </div>

            {/* Content: table */}
            <div className="flex-1 flex min-h-0 overflow-hidden">
              <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
                <ReportTable options={gridOptions} hidePagination={rows.length <= 25} />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
