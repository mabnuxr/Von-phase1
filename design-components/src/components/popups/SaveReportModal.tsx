import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FloppyDisk, FolderSimple, CaretRight } from '@phosphor-icons/react';
import { PrimaryButton, GhostButton } from '../forms/buttons';
import { TextInput } from '../forms/input';

// ============================================================================
// Types
// ============================================================================

export interface ParentReport {
  id: string;
  name: string;
}

export interface SaveReportConfig {
  name: string;
  isSubReport: boolean;
  parentReportId?: string;
}

export interface SaveReportModalProps {
  /**
   * Whether the modal is open
   */
  isOpen: boolean;

  /**
   * Available parent reports for sub-report option
   */
  parentReports?: ParentReport[];

  /**
   * Default name suggestion
   */
  defaultName?: string;

  /**
   * Number of active filters (for context)
   */
  filterCount?: number;

  /**
   * Callback when user confirms save
   */
  onConfirm: (config: SaveReportConfig) => void;

  /**
   * Callback when user cancels
   */
  onCancel: () => void;
}

// ============================================================================
// Main Component
// ============================================================================

export const SaveReportModal: React.FC<SaveReportModalProps> = ({
  isOpen,
  parentReports = [],
  defaultName = '',
  filterCount = 0,
  onConfirm,
  onCancel,
}) => {
  const [reportName, setReportName] = useState(defaultName);
  const [saveAs, setSaveAs] = useState<'report' | 'subreport'>('report');
  const [selectedParentId, setSelectedParentId] = useState<string>('');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setReportName(defaultName || `Custom Report ${new Date().toLocaleDateString()}`);
      setSaveAs('report');
      setSelectedParentId(parentReports[0]?.id || '');
    }
  }, [isOpen, defaultName, parentReports]);

  const handleConfirm = () => {
    onConfirm({
      name: reportName,
      isSubReport: saveAs === 'subreport',
      parentReportId: saveAs === 'subreport' ? selectedParentId : undefined,
    });
  };

  const canSave = reportName.trim().length > 0 && (saveAs === 'report' || selectedParentId);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm"
            onClick={onCancel}
          />

          {/* Modal panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-[10000] rounded-2xl border border-gray-200 shadow-xl overflow-hidden bg-white"
          >
            {/* Content */}
            <div className="p-5">
              {/* Header */}
              <div className="flex items-center gap-2 pb-4 mb-4 border-b border-gray-100">
                <FloppyDisk size={20} weight="duotone" className="text-gray-700" />
                <h3 className="text-base font-medium text-gray-900">Save Report</h3>
              </div>

              {/* Filter context */}
              {filterCount > 0 && (
                <div className="mb-4 px-3 py-2 bg-indigo-50 rounded-lg">
                  <p className="text-[13px] text-indigo-700">
                    {filterCount} filter{filterCount > 1 ? 's' : ''} will be saved with this report
                  </p>
                </div>
              )}

              {/* Report name input */}
              <div className="mb-4">
                <TextInput
                  label="Report Name"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  placeholder="Enter report name..."
                />
              </div>

              {/* Save as options */}
              <div className="space-y-2 mb-4">
                <span className="text-xs font-medium text-gray-700">Save as</span>

                {/* New Report option */}
                <button
                  type="button"
                  onClick={() => setSaveAs('report')}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer
                    ${saveAs === 'report' ? 'bg-gray-50 border border-gray-200' : 'bg-white border border-gray-100 hover:bg-gray-50'}
                  `}
                >
                  <div
                    className={`
                    w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0
                    ${saveAs === 'report' ? 'border-gray-900 bg-gray-900' : 'border-gray-300'}
                  `}
                  >
                    {saveAs === 'report' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <div className="flex-1">
                    <span className={`text-[13px] ${saveAs === 'report' ? 'text-gray-900 font-medium' : 'text-gray-900'}`}>
                      New Report
                    </span>
                    <p className="text-[11px] text-gray-500">Create as a standalone report</p>
                  </div>
                </button>

                {/* Sub-report option */}
                <button
                  type="button"
                  onClick={() => setSaveAs('subreport')}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer
                    ${saveAs === 'subreport' ? 'bg-gray-50 border border-gray-200' : 'bg-white border border-gray-100 hover:bg-gray-50'}
                  `}
                >
                  <div
                    className={`
                    w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0
                    ${saveAs === 'subreport' ? 'border-gray-900 bg-gray-900' : 'border-gray-300'}
                  `}
                  >
                    {saveAs === 'subreport' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <div className="flex-1">
                    <span className={`text-[13px] ${saveAs === 'subreport' ? 'text-gray-900 font-medium' : 'text-gray-900'}`}>
                      Sub-report
                    </span>
                    <p className="text-[11px] text-gray-500">Save as a child of an existing report</p>
                  </div>
                </button>
              </div>

              {/* Parent report selection (shown when sub-report is selected) */}
              <AnimatePresence>
                {saveAs === 'subreport' && parentReports.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="overflow-hidden mb-4"
                  >
                    <div className="pl-4 border-l-2 border-gray-200 space-y-2">
                      <span className="text-xs font-medium text-gray-700">Parent Report</span>
                      <div className="space-y-1">
                        {parentReports.map((report) => (
                          <button
                            key={report.id}
                            type="button"
                            onClick={() => setSelectedParentId(report.id)}
                            className={`
                              w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors cursor-pointer
                              ${selectedParentId === report.id ? 'bg-gray-100 border border-gray-200' : 'bg-gray-50 border border-gray-100 hover:bg-gray-100'}
                            `}
                          >
                            <FolderSimple size={14} weight="regular" className="text-gray-700 flex-shrink-0" />
                            <span className={`text-[13px] flex-1 ${selectedParentId === report.id ? 'text-gray-900 font-medium' : 'text-gray-700'}`}>
                              {report.name}
                            </span>
                            {selectedParentId === report.id && (
                              <CaretRight size={12} className="text-gray-500" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action buttons */}
              <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                <GhostButton onClick={onCancel} fullWidth>
                  Cancel
                </GhostButton>
                <PrimaryButton onClick={handleConfirm} disabled={!canSave} fullWidth>
                  Save Report
                </PrimaryButton>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SaveReportModal;
