import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChartBarIcon,
  ChartLineIcon,
  ChartPieIcon,
  ChartDonutIcon,
  HashIcon,
  TableIcon,
  XIcon,
  DatabaseIcon,
  LinkIcon,
  CaretDownIcon,
  ArrowsOutCardinalIcon,
} from '@phosphor-icons/react';
import { PrimaryButton, GhostButton } from '../forms/buttons';

// ============================================================================
// Types
// ============================================================================

export type ChartType = 'bar' | 'line' | 'pie' | 'donut' | 'metric' | 'table';

export interface DataSourceOption {
  id: string;
  name: string;
  type: 'report' | 'subreport';
  columnCount?: number;
}

export interface WidgetConfigData {
  id: string;
  name: string;
  chartType: ChartType;
  dataSourceId: string;
  dataSourceType: 'report' | 'subreport';
  // Grid position and size
  gridPosition?: { x: number; y: number };
  gridSize?: { width: number; height: number };
}

export interface WidgetConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: WidgetConfigData) => void;
  existingConfig?: Partial<WidgetConfigData>;
  dataSources?: DataSourceOption[];
  widgetId?: string;
  /** Mode: 'create' for new widget, 'edit' for existing */
  mode?: 'create' | 'edit';
}

// ============================================================================
// Constants
// ============================================================================

const chartOptions: { value: ChartType; label: string; icon: React.ReactNode }[] = [
  { value: 'bar', label: 'Bar Chart', icon: <ChartBarIcon size={18} /> },
  { value: 'line', label: 'Line Chart', icon: <ChartLineIcon size={18} /> },
  { value: 'pie', label: 'Pie Chart', icon: <ChartPieIcon size={18} /> },
  { value: 'donut', label: 'Donut Chart', icon: <ChartDonutIcon size={18} /> },
  { value: 'metric', label: 'Metric Card', icon: <HashIcon size={18} /> },
  { value: 'table', label: 'Data Table', icon: <TableIcon size={18} /> },
];

const defaultDataSources: DataSourceOption[] = [
  { id: 'ds-1', name: 'Opportunity Report', type: 'report', columnCount: 12 },
  { id: 'ds-2', name: 'Pipeline by Stage', type: 'subreport', columnCount: 5 },
  { id: 'ds-3', name: 'Win Rate Analysis', type: 'subreport', columnCount: 8 },
  { id: 'ds-4', name: 'Account Performance', type: 'report', columnCount: 15 },
];

// Grid size presets
const gridSizePresets = [
  { label: 'Small', width: 1, height: 1 },
  { label: 'Medium', width: 2, height: 1 },
  { label: 'Large', width: 2, height: 2 },
  { label: 'Wide', width: 3, height: 1 },
  { label: 'Full Width', width: 3, height: 2 },
];

// ============================================================================
// Main Component
// ============================================================================

export const WidgetConfigModal: React.FC<WidgetConfigModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingConfig,
  dataSources = defaultDataSources,
  widgetId,
  mode = 'edit',
}) => {
  const [name, setName] = useState(existingConfig?.name || '');
  const [chartType, setChartType] = useState<ChartType>(existingConfig?.chartType || 'bar');
  const [dataSourceId, setDataSourceId] = useState(existingConfig?.dataSourceId || '');
  const [gridSize, setGridSize] = useState(existingConfig?.gridSize || { width: 2, height: 1 });
  const [errors, setErrors] = useState<{ name?: string; dataSource?: string }>({});

  // Reset state when existingConfig changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setName(existingConfig?.name || '');
      setChartType(existingConfig?.chartType || 'bar');
      setDataSourceId(existingConfig?.dataSourceId || '');
      setGridSize(existingConfig?.gridSize || { width: 2, height: 1 });
      setErrors({});
    }
  }, [isOpen, existingConfig]);

  const selectedDataSource = dataSources.find((ds) => ds.id === dataSourceId);

  const handleSave = () => {
    const newErrors: { name?: string; dataSource?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Widget name is required';
    }

    if (!dataSourceId) {
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
      dataSourceId,
      dataSourceType: selectedDataSource?.type || 'report',
      gridSize,
    });

    onClose();
  };

  const handleClose = () => {
    setErrors({});
    onClose();
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
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/30 z-[9999]"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 flex items-center justify-center z-[10000] p-4"
          >
            <div
              className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div>
                  <h2 className="text-[15px] font-semibold text-gray-900">
                    {mode === 'create' ? 'Add Widget' : 'Edit Widget'}
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Configure widget settings and data source
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <XIcon size={18} className="text-gray-500" />
                </button>
              </div>

              {/* Content */}
              <div className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto">
                {/* Widget Name */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Widget Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                    }}
                    placeholder="Enter widget name..."
                    className={`
                      w-full px-3 py-2 text-[13px] text-gray-900 bg-white border rounded-lg
                      placeholder:text-gray-400 outline-none transition-colors
                      ${errors.name ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'}
                    `}
                  />
                  {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
                </div>

                {/* Chart Type */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Chart Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {chartOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setChartType(option.value)}
                        className={`
                          flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border transition-all cursor-pointer
                          ${
                            chartType === option.value
                              ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                              : 'border-gray-100 bg-white text-gray-700 hover:border-gray-200 hover:bg-gray-50'
                          }
                        `}
                      >
                        <span
                          className={chartType === option.value ? 'text-indigo-600' : 'text-gray-500'}
                        >
                          {option.icon}
                        </span>
                        <span className="text-[11px] font-medium">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Data Source */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Data Source
                  </label>
                  <div className="relative">
                    <select
                      value={dataSourceId}
                      onChange={(e) => {
                        setDataSourceId(e.target.value);
                        if (errors.dataSource)
                          setErrors((prev) => ({ ...prev, dataSource: undefined }));
                      }}
                      className={`
                        w-full px-3 py-2 text-[13px] text-gray-900 bg-white border rounded-lg
                        appearance-none cursor-pointer outline-none transition-colors
                        ${errors.dataSource ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'}
                      `}
                    >
                      <option value="">Select a data source...</option>
                      {dataSources.map((ds) => (
                        <option key={ds.id} value={ds.id}>
                          {ds.name} ({ds.type === 'subreport' ? 'Subreport' : 'Report'})
                        </option>
                      ))}
                    </select>
                    <CaretDownIcon
                      size={14}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    />
                  </div>
                  {errors.dataSource && (
                    <p className="text-xs text-red-600 mt-1">{errors.dataSource}</p>
                  )}
                  {selectedDataSource && (
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                      {selectedDataSource.type === 'subreport' ? (
                        <LinkIcon size={12} />
                      ) : (
                        <DatabaseIcon size={12} />
                      )}
                      <span>
                        {selectedDataSource.columnCount} columns available
                      </span>
                    </div>
                  )}
                </div>

                {/* Grid Size */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <ArrowsOutCardinalIcon size={14} />
                      <span>Widget Size</span>
                    </div>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {gridSizePresets.map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => setGridSize({ width: preset.width, height: preset.height })}
                        className={`
                          px-3 py-1.5 text-[13px] rounded-lg border transition-all cursor-pointer
                          ${
                            gridSize.width === preset.width && gridSize.height === preset.height
                              ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                              : 'border-gray-100 bg-white text-gray-700 hover:border-gray-200 hover:bg-gray-50'
                          }
                        `}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Size: {gridSize.width} × {gridSize.height} grid units
                  </p>
                </div>

                {/* Preview */}
                {name && selectedDataSource && (
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      {chartOptions.find((c) => c.value === chartType)?.icon}
                      <span className="text-[13px] font-medium text-gray-900">{name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        {selectedDataSource.type === 'subreport' ? (
                          <LinkIcon size={12} />
                        ) : (
                          <DatabaseIcon size={12} />
                        )}
                        {selectedDataSource.name}
                      </span>
                      <span className="flex items-center gap-1">
                        <ArrowsOutCardinalIcon size={12} />
                        {gridSize.width}×{gridSize.height}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
                <GhostButton onClick={handleClose} className="flex-1">
                  Cancel
                </GhostButton>
                <PrimaryButton onClick={handleSave} className="flex-1">
                  {mode === 'create' ? 'Add Widget' : 'Save Changes'}
                </PrimaryButton>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default WidgetConfigModal;
