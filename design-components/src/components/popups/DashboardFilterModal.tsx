import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from '@phosphor-icons/react';
import { Select } from '../forms/dropdown';
import { PrimaryButton, GhostButton } from '../forms/buttons';

// ============================================================================
// Types
// ============================================================================

export interface DashboardFilterConfig {
  dateRange: string;
  region: string;
  riskLevel: string;
}

export interface DashboardFilterModalProps {
  /**
   * Whether the popover is open
   */
  isOpen: boolean;

  /**
   * Position of the popover (from button rect)
   */
  position?: { top: number; right: number };

  /**
   * Current filter values
   */
  currentFilters?: Partial<DashboardFilterConfig>;

  /**
   * Callback when user applies filters
   */
  onApply: (filters: DashboardFilterConfig) => void;

  /**
   * Callback when user closes/cancels
   */
  onClose: () => void;
}

// ============================================================================
// Default Options
// ============================================================================

const dateRangeOptions = [
  { value: 'last-7-days', label: 'Last 7 days' },
  { value: 'last-30-days', label: 'Last 30 days' },
  { value: 'last-90-days', label: 'Last 90 days' },
  { value: 'last-6-months', label: 'Last 6 months' },
  { value: 'last-year', label: 'Last year' },
  { value: 'all-time', label: 'All time' },
];

const regionOptions = [
  { value: 'all', label: 'All Regions' },
  { value: 'west', label: 'West' },
  { value: 'east', label: 'East' },
  { value: 'central', label: 'Central' },
  { value: 'south', label: 'South' },
  { value: 'north', label: 'North' },
];

const riskLevelOptions = [
  { value: 'all', label: 'All Levels' },
  { value: 'high', label: 'High Risk' },
  { value: 'medium', label: 'Medium Risk' },
  { value: 'low', label: 'Low Risk' },
];

// ============================================================================
// Component
// ============================================================================

export const DashboardFilterModal: React.FC<DashboardFilterModalProps> = ({
  isOpen,
  position,
  currentFilters = {},
  onApply,
  onClose,
}) => {
  const [dateRange, setDateRange] = useState(currentFilters.dateRange || 'last-30-days');
  const [region, setRegion] = useState(currentFilters.region || 'all');
  const [riskLevel, setRiskLevel] = useState(currentFilters.riskLevel || 'all');

  const handleApply = () => {
    onApply({ dateRange, region, riskLevel });
    onClose();
  };

  const handleReset = () => {
    setDateRange('last-30-days');
    setRegion('all');
    setRiskLevel('all');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - invisible, just for click outside */}
          <div
            className="fixed inset-0 z-[9998]"
            onClick={onClose}
          />

          {/* Popover */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="fixed w-[480px] z-[9999] bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden"
            style={{
              top: position?.top ?? 60,
              right: position?.right ?? 20,
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Filters</h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={18} weight="bold" className="text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Date Range */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Date Range</label>
                <Select
                  options={dateRangeOptions}
                  value={dateRange}
                  onChange={setDateRange}
                  placeholder="Select date range..."
                />
              </div>

              {/* Region */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Region</label>
                <Select
                  options={regionOptions}
                  value={region}
                  onChange={setRegion}
                  placeholder="Select region..."
                />
              </div>

              {/* Risk Level */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Risk Level</label>
                <Select
                  options={riskLevelOptions}
                  value={riskLevel}
                  onChange={setRiskLevel}
                  placeholder="Select risk level..."
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-100 bg-gray-50">
              <GhostButton onClick={handleReset} fullWidth>
                Reset
              </GhostButton>
              <PrimaryButton onClick={handleApply} fullWidth>
                Apply
              </PrimaryButton>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DashboardFilterModal;
