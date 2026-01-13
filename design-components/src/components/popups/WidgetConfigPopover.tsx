import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChartBar,
  ChartLine,
  ChartPie,
  ChartDonut,
  Hash,
  Table,
  XIcon,
  DatabaseIcon,
  LinkIcon,
} from '@phosphor-icons/react';
import { TextInput } from '../forms/input';
import { Select } from '../forms/dropdown';
import { PrimaryButton, GhostButton } from '../forms/buttons';

// ============================================================================
// Types
// ============================================================================

export interface DataSourceOption {
  id: string;
  name: string;
  type: 'report' | 'subreport';
  parentId?: string;
  columnCount?: number;
}

export interface WidgetConfig {
  id: string;
  name: string;
  chartType: 'bar' | 'line' | 'pie' | 'donut' | 'metric' | 'table';
  dataSourceId: string;
  dataSourceType: 'report' | 'subreport';
}

export interface WidgetConfigPopoverProps {
  /**
   * Whether the popover is open
   */
  isOpen: boolean;

  /**
   * The type of chart being configured
   */
  chartType: 'bar' | 'line' | 'pie' | 'donut' | 'metric' | 'table';

  /**
   * Pre-filled widget name (optional)
   */
  defaultName?: string;

  /**
   * Available data sources (reports and subreports)
   */
  dataSources: DataSourceOption[];

  /**
   * Position of the popover relative to the widget
   */
  position?: { top: number; left: number };

  /**
   * Callback when user saves the widget configuration
   */
  onSave: (config: WidgetConfig) => void;

  /**
   * Callback when user cancels/closes the popover
   */
  onCancel: () => void;

  /**
   * Widget ID (for editing existing widgets)
   */
  widgetId?: string;

  /**
   * Existing configuration (for editing)
   */
  existingConfig?: Partial<WidgetConfig>;
}

// ============================================================================
// Constants
// ============================================================================

const chartIcons = {
  bar: ChartBar,
  line: ChartLine,
  pie: ChartPie,
  donut: ChartDonut,
  metric: Hash,
  table: Table,
};

const chartLabels = {
  bar: 'Bar Chart',
  line: 'Line Chart',
  pie: 'Pie Chart',
  donut: 'Donut Chart',
  metric: 'Metric Card',
  table: 'Data Table',
};

// ============================================================================
// Component
// ============================================================================

/**
 * WidgetConfigPopover - Configuration popover shown when a widget is dropped
 *
 * Features:
 * - Pre-filled widget name based on chart type
 * - Data source selection (reports and subreports)
 * - Visual preview of selected configuration
 * - Save/Cancel actions
 */
export const WidgetConfigPopover: React.FC<WidgetConfigPopoverProps> = ({
  isOpen,
  chartType,
  defaultName,
  dataSources,
  position,
  onSave,
  onCancel,
  widgetId,
  existingConfig,
}) => {
  const [name, setName] = useState(existingConfig?.name || defaultName || chartLabels[chartType]);
  const [selectedDataSourceId, setSelectedDataSourceId] = useState(existingConfig?.dataSourceId || '');
  const [errors, setErrors] = useState<{ name?: string; dataSource?: string }>({});

  const IconComponent = chartIcons[chartType];

  // Build data source options for dropdown
  const dataSourceOptions = dataSources.map((ds) => ({
    value: ds.id,
    label: ds.name,
    icon: ds.type === 'subreport' ? <LinkIcon size={16} /> : <DatabaseIcon size={16} />,
  }));

  const selectedDataSource = dataSources.find((ds) => ds.id === selectedDataSourceId);

  const handleSave = () => {
    const newErrors: { name?: string; dataSource?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Widget name is required';
    }

    if (!selectedDataSourceId) {
      newErrors.dataSource = 'Please select a data source';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    onSave({
      id: widgetId || `widget-${Date.now()}`,
      name: name.trim(),
      chartType,
      dataSourceId: selectedDataSourceId,
      dataSourceType: selectedDataSource?.type || 'report',
    });
  };

  const handleCancel = () => {
    setName(defaultName || chartLabels[chartType]);
    setSelectedDataSourceId('');
    setErrors({});
    onCancel();
  };

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
            className="fixed inset-0 z-[998] bg-black/10"
            onClick={handleCancel}
          />

          {/* Popover */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed z-[999] w-80 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden"
            style={{
              top: position?.top ?? '50%',
              left: position?.left ?? '50%',
              transform: position ? undefined : 'translate(-50%, -50%)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-white rounded-lg border border-gray-200">
                  <IconComponent size={18} weight="regular" className="text-gray-800" />
                </div>
                <div>
                  <h3 className="text-[13px] font-medium text-gray-900">Configure Widget</h3>
                  <p className="text-[11px] text-gray-500">{chartLabels[chartType]}</p>
                </div>
              </div>
              <button
                onClick={handleCancel}
                className="p-1 rounded-md hover:bg-gray-200 transition-colors cursor-pointer"
              >
                <XIcon size={16} className="text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Widget Name */}
              <TextInput
                label="Widget Name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                }}
                placeholder="Enter widget name..."
                error={errors.name}
              />

              {/* Data Source Selection */}
              <Select
                label="Data Source"
                options={dataSourceOptions}
                value={selectedDataSourceId}
                onChange={(value) => {
                  setSelectedDataSourceId(value);
                  if (errors.dataSource) setErrors((prev) => ({ ...prev, dataSource: undefined }));
                }}
                placeholder="Select a report or subreport..."
                error={errors.dataSource}
                helperText={
                  selectedDataSource
                    ? `${selectedDataSource.type === 'subreport' ? 'Subreport' : 'Report'} • ${selectedDataSource.columnCount || 0} columns`
                    : undefined
                }
              />

              {/* Preview */}
              {selectedDataSource && (
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <IconComponent size={16} weight="regular" className="text-gray-600" />
                    <span className="text-[13px] font-medium text-gray-900">{name || 'Untitled'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-gray-500">
                    {selectedDataSource.type === 'subreport' ? (
                      <LinkIcon size={12} />
                    ) : (
                      <DatabaseIcon size={12} />
                    )}
                    <span>Connected to: {selectedDataSource.name}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-100 bg-gray-50">
              <GhostButton onClick={handleCancel} fullWidth>
                Cancel
              </GhostButton>
              <PrimaryButton onClick={handleSave} fullWidth>
                {widgetId ? 'Update' : 'Add Widget'}
              </PrimaryButton>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default WidgetConfigPopover;
