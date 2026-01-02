import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShareNetwork,
  Funnel,
  Download,
  TrendUp,
  TrendDown,
  Minus,
  X,
  Table as TableIcon,
  Plus,
  ChartBar,
  ChartLine,
  ChartPie,
  ChartDonut,
  NumberSquareOne,
  Rows,
  DotsThree,
  Trash,
  Link,
  Copy,
  Check,
  UserPlus,
  Clock,
  PaperPlaneTilt,
} from '@phosphor-icons/react';
import { Table } from 'rsuite';
import type { Dashboard, DashboardWidget, MetricConfig, DataViewTab, ChartConfig, DragItem, DataTable } from './types';
import { ChartWidget } from './ChartWidget';
import { TableWidget } from './TableWidget';
import {
  accountsAtRiskData,
  engagementTimelineData,
  riskByRegionData,
  arrAtRiskByIndustry,
  churnProbabilityData,
} from './mockData';

const { Column, HeaderCell, Cell } = Table;

export interface DashboardCanvasProps {
  /**
   * Dashboard configuration
   */
  dashboard: Dashboard;

  /**
   * Current view tab (data or dashboard)
   */
  viewMode: DataViewTab;

  /**
   * Callback when view mode changes
   */
  onViewModeChange?: (mode: DataViewTab) => void;

  /**
   * Callback when share is clicked
   */
  onShare?: () => void;

  /**
   * Callback when filter is clicked
   */
  onFilter?: () => void;

  /**
   * Callback when export is clicked
   */
  onExport?: () => void;

  /**
   * Callback when a widget is clicked for drill-down
   */
  onWidgetClick?: (widgetId: string) => void;

  /**
   * Callback when a widget is edited
   */
  onWidgetEdit?: (widgetId: string) => void;

  /**
   * Whether the dashboard is loading
   */
  isLoading?: boolean;

  /**
   * Callback when a new widget is added via drag-and-drop
   */
  onWidgetAdd?: (widget: DashboardWidget) => void;

  /**
   * Callback when a widget is deleted
   */
  onWidgetDelete?: (widgetId: string) => void;

  /**
   * Available data tables for widget configuration
   */
  dataTables?: DataTable[];
}

// Get data for a chart by tableId
const getDataForChart = (tableId: string): Record<string, unknown>[] => {
  switch (tableId) {
    case 'tbl-accounts-at-risk':
      return accountsAtRiskData as Record<string, unknown>[];
    case 'tbl-engagement-timeline':
      return engagementTimelineData as Record<string, unknown>[];
    case 'tbl-risk-by-region':
      return riskByRegionData as Record<string, unknown>[];
    case 'tbl-arr-by-industry':
      return arrAtRiskByIndustry as Record<string, unknown>[];
    case 'tbl-churn-distribution':
      return churnProbabilityData as Record<string, unknown>[];
    default:
      return [];
  }
};

/**
 * MetricCard - Displays a single metric with trend
 */
const MetricCard: React.FC<{
  config: MetricConfig;
  onClick?: () => void;
  onDelete?: () => void;
}> = ({ config, onClick, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);

  const getTrendIcon = () => {
    if (config.changeType === 'positive') {
      return <TrendUp size={14} weight="duotone" className="text-emerald-600" />;
    }
    if (config.changeType === 'negative') {
      return <TrendDown size={14} weight="duotone" className="text-red-600" />;
    }
    return <Minus size={14} weight="duotone" className="text-gray-400" />;
  };

  const getTrendColor = () => {
    if (config.changeType === 'positive') return 'text-emerald-600';
    if (config.changeType === 'negative') return 'text-red-600';
    return 'text-gray-500';
  };

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-100 p-4 cursor-pointer hover:border-gray-200 hover:shadow-sm transition-all duration-150 relative group"
    >
      {/* Delete menu button - only visible on hover */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 text-white bg-gray-800 hover:bg-gray-900 rounded-md transition-colors cursor-pointer"
          >
            <DotsThree size={14} weight="bold" />
          </button>
          <AnimatePresence>
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                  }}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.1 }}
                  className="absolute right-0 top-full mt-1 w-32 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1.5"
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      onDelete?.();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[13px] text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <Trash size={14} />
                    Delete
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
        {config.label}
      </p>
      <div className="flex items-end justify-between">
        <p className="text-2xl font-semibold text-gray-900 tabular-nums">{config.value}</p>
        {config.change !== undefined && (
          <div className={`flex items-center gap-1 ${getTrendColor()}`}>
            {getTrendIcon()}
            <span className="text-xs font-medium tabular-nums">
              {config.change > 0 ? '+' : ''}
              {config.change}%
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

/**
 * ExpandedWidgetModal - Shows widget with underlying data (glass effect)
 */
const ExpandedWidgetModal: React.FC<{
  widget: DashboardWidget;
  onClose: () => void;
}> = ({ widget, onClose }) => {
  const config = widget.config as ChartConfig;
  const data = getDataForChart(config.dataTableId);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-8"
      onClick={onClose}
    >
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      {/* Modal */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-5xl bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-sm font-medium text-gray-900">{config.title}</h2>
            {config.subtitle && (
              <p className="text-[13px] text-gray-500 mt-0.5">{config.subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Content with chart and underlying data */}
        <div className="p-5">
          {/* Chart at top */}
          <div className="mb-5">
            <ChartWidget widget={widget} />
          </div>

          {/* Glass effect divider */}
          <div className="relative py-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-[11px] font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                <TableIcon size={12} weight="duotone" />
                Underlying Data
              </span>
            </div>
          </div>

          {/* Underlying data table with glass effect */}
          <div className="relative rounded-xl overflow-hidden border border-gray-100">
            {/* Glass overlay effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/80 to-white/40 backdrop-blur-[2px] pointer-events-none z-10" style={{ top: -1, height: 20 }} />

            <div className="max-h-64 overflow-auto">
              <Table
                data={data}
                autoHeight
                rowHeight={40}
                headerHeight={36}
                bordered={false}
                cellBordered={false}
              >
                {Object.keys(data[0] || {}).map((key) => (
                  <Column key={key} width={120} flexGrow={key === 'accountName' ? 1 : 0}>
                    <HeaderCell>
                      <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">{key}</span>
                    </HeaderCell>
                    <Cell dataKey={key}>
                      {(rowData: Record<string, unknown>) => (
                        <span className="text-[13px] text-gray-900">{String(rowData[key])}</span>
                      )}
                    </Cell>
                  </Column>
                ))}
              </Table>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

/**
 * EditWidgetModal - Edit widget configuration
 */
const EditWidgetModal: React.FC<{
  widget: DashboardWidget;
  onClose: () => void;
  onSave: (config: Record<string, unknown>) => void;
}> = ({ widget, onClose, onSave }) => {
  const config = widget.config as ChartConfig;
  const [title, setTitle] = useState(config.title || '');
  const [chartType, setChartType] = useState<ChartConfig['type']>(config.type || 'bar');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-8"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-white rounded-xl shadow-xl border border-gray-100"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-medium text-gray-900">Edit Widget</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-[13px] text-gray-900 bg-white border border-gray-200 rounded-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Chart Type</label>
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value as ChartConfig['type'])}
              className="w-full px-3 py-2 text-[13px] text-gray-900 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow cursor-pointer"
            >
              <option value="bar">Bar Chart</option>
              <option value="line">Line Chart</option>
              <option value="pie">Pie Chart</option>
              <option value="donut">Donut Chart</option>
              <option value="area">Area Chart</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Data Source</label>
            <select className="w-full px-3 py-2 text-[13px] text-gray-900 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow cursor-pointer">
              <option value="tbl-accounts-at-risk">Accounts at Risk</option>
              <option value="tbl-engagement-timeline">Engagement Timeline</option>
              <option value="tbl-risk-by-region">Risk by Region</option>
              <option value="tbl-arr-by-industry">ARR by Industry</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 px-5 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="flex-1 px-3 py-2 text-[13px] font-medium text-gray-800 bg-gray-100/70 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSave({ ...config, title, type: chartType });
              onClose();
            }}
            className="flex-1 px-3 py-2 text-[13px] font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors cursor-pointer"
          >
            Save Changes
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

/**
 * FilterPopover - Dashboard-level filter
 */
const FilterPopover: React.FC<{
  onClose: () => void;
  onApply: (filters: Record<string, string>) => void;
}> = ({ onClose, onApply }) => {
  const [dateRange, setDateRange] = useState('last_30_days');
  const [region, setRegion] = useState('all');
  const [riskLevel, setRiskLevel] = useState('all');

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.15 }}
        className="absolute right-0 top-full mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-50"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <span className="text-xs font-medium text-gray-700">Filters</span>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
          >
            <X size={14} weight="bold" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 text-[13px] text-gray-900 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow cursor-pointer"
            >
              <option value="last_7_days">Last 7 days</option>
              <option value="last_30_days">Last 30 days</option>
              <option value="last_90_days">Last 90 days</option>
              <option value="this_year">This year</option>
              <option value="custom">Custom range</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Region</label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full px-3 py-2 text-[13px] text-gray-900 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow cursor-pointer"
            >
              <option value="all">All Regions</option>
              <option value="north_america">North America</option>
              <option value="europe">Europe</option>
              <option value="apac">APAC</option>
              <option value="latam">LATAM</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Risk Level</label>
            <select
              value={riskLevel}
              onChange={(e) => setRiskLevel(e.target.value)}
              className="w-full px-3 py-2 text-[13px] text-gray-900 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow cursor-pointer"
            >
              <option value="all">All Levels</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-100">
          <button
            onClick={() => {
              setDateRange('last_30_days');
              setRegion('all');
              setRiskLevel('all');
            }}
            className="flex-1 py-2 text-[13px] font-medium text-gray-800 bg-gray-100/70 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer"
          >
            Reset
          </button>
          <button
            onClick={() => {
              onApply({ dateRange, region, riskLevel });
              onClose();
            }}
            className="flex-1 py-2 text-[13px] font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-xl transition-colors cursor-pointer"
          >
            Apply
          </button>
        </div>
      </motion.div>
    </>
  );
};

/**
 * SharePopover - Share dashboard with update frequency and recipients
 */
const SharePopover: React.FC<{
  onClose: () => void;
  dashboardTitle: string;
}> = ({ onClose, dashboardTitle }) => {
  const [updateFrequency, setUpdateFrequency] = useState('daily');
  const [recipients, setRecipients] = useState<string[]>([]);
  const [newRecipient, setNewRecipient] = useState('');
  const [copied, setCopied] = useState(false);
  const [linkGenerated, setLinkGenerated] = useState(false);

  // Generate a dummy public link
  const publicLink = `https://app.von.ai/shared/${dashboardTitle.toLowerCase().replace(/\s+/g, '-')}-${Date.now().toString(36)}`;

  const handleAddRecipient = () => {
    if (newRecipient && newRecipient.includes('@') && !recipients.includes(newRecipient)) {
      setRecipients([...recipients, newRecipient]);
      setNewRecipient('');
    }
  };

  const handleRemoveRecipient = (email: string) => {
    setRecipients(recipients.filter((r) => r !== email));
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateLink = () => {
    setLinkGenerated(true);
  };

  return (
    <>
      {/* Backdrop to close popover */}
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.15 }}
        className="absolute right-0 top-full mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-50"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShareNetwork size={14} weight="duotone" className="text-gray-500" />
            <span className="text-xs font-medium text-gray-700">Share Dashboard</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
          >
            <X size={14} weight="bold" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Update Frequency */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Clock size={14} weight="duotone" className="text-gray-500" />
              <label className="text-xs font-medium text-gray-700">Update Frequency</label>
            </div>
            <p className="text-[11px] text-gray-500 mb-2">
              How often should the data refresh?
            </p>
            <div className="grid grid-cols-4 gap-1">
              {['hourly', 'daily', 'weekly', 'monthly'].map((freq) => (
                <button
                  key={freq}
                  onClick={() => setUpdateFrequency(freq)}
                  className={`px-1.5 py-1.5 text-[11px] font-medium rounded-lg transition-colors cursor-pointer capitalize ${
                    updateFrequency === freq
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {freq}
                </button>
              ))}
            </div>
          </div>

          {/* Public Link Section */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Link size={14} weight="duotone" className="text-gray-500" />
              <label className="text-xs font-medium text-gray-700">Public Link</label>
            </div>

            {!linkGenerated ? (
              <button
                onClick={handleGenerateLink}
                className="w-full py-2 text-[13px] font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Link size={14} weight="duotone" />
                Generate Public Link
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0 px-2.5 py-2 bg-gray-50 border border-gray-100 rounded-lg">
                  <p className="text-[11px] text-gray-600 truncate">{publicLink}</p>
                </div>
                <button
                  onClick={handleCopyLink}
                  className={`flex-shrink-0 p-2 rounded-lg transition-colors cursor-pointer ${
                    copied
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {copied ? <Check size={14} weight="bold" /> : <Copy size={14} weight="duotone" />}
                </button>
              </div>
            )}

            {linkGenerated && (
              <p className="text-[11px] text-gray-500 mt-1.5">
                Anyone with this link can view
              </p>
            )}
          </div>

          {/* Recipients Section */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <UserPlus size={14} weight="duotone" className="text-gray-500" />
              <label className="text-xs font-medium text-gray-700">Add Recipients</label>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <input
                type="email"
                value={newRecipient}
                onChange={(e) => setNewRecipient(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddRecipient()}
                placeholder="Enter email"
                className="flex-1 min-w-0 px-2.5 py-1.5 text-[13px] text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
              />
              <button
                onClick={handleAddRecipient}
                disabled={!newRecipient || !newRecipient.includes('@')}
                className="flex-shrink-0 px-2.5 py-1.5 text-[13px] font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>

            {/* Recipients List */}
            {recipients.length > 0 && (
              <div className="space-y-1.5 max-h-24 overflow-y-auto">
                {recipients.map((email) => (
                  <div
                    key={email}
                    className="flex items-center justify-between px-2.5 py-1.5 bg-gray-50 border border-gray-100 rounded-lg"
                  >
                    <span className="text-[13px] text-gray-700 truncate">{email}</span>
                    <button
                      onClick={() => handleRemoveRecipient(email)}
                      className="flex-shrink-0 p-0.5 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                    >
                      <X size={12} weight="bold" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {recipients.length === 0 && (
              <p className="text-[11px] text-gray-500">
                Recipients get email notifications
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-100">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-[13px] font-medium text-gray-800 bg-gray-100/70 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              console.log('Share settings:', { updateFrequency, recipients, publicLink: linkGenerated ? publicLink : null });
              onClose();
            }}
            disabled={!linkGenerated && recipients.length === 0}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[13px] font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PaperPlaneTilt size={12} weight="duotone" />
            {recipients.length > 0 ? `Send (${recipients.length})` : 'Share'}
          </button>
        </div>
      </motion.div>
    </>
  );
};

/**
 * MetricDetailModal - Detail view when clicking a metric card
 */
const MetricDetailModal: React.FC<{
  config: MetricConfig;
  onClose: () => void;
}> = ({ config, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-8"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-white rounded-xl shadow-xl border border-gray-100"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-medium text-gray-900">{config.label}</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        <div className="p-5">
          <div className="text-center mb-5">
            <p className="text-3xl font-semibold text-gray-900 tabular-nums">{config.value}</p>
            {config.change !== undefined && (
              <p className={`text-[13px] font-medium mt-1 tabular-nums ${config.changeType === 'positive' ? 'text-emerald-600' : config.changeType === 'negative' ? 'text-red-600' : 'text-gray-500'}`}>
                {config.change > 0 ? '+' : ''}{config.change}% vs last period
              </p>
            )}
          </div>

          <div className="space-y-0 border border-gray-100 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50/50">
              <span className="text-[13px] text-gray-600">Previous Period</span>
              <span className="text-[13px] font-medium text-gray-900 tabular-nums">
                {config.value ? `$${(parseFloat(String(config.value).replace(/[^0-9.]/g, '')) * 0.85).toFixed(1)}M` : '-'}
              </span>
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <span className="text-[13px] text-gray-600">YoY Change</span>
              <span className="text-[13px] font-medium text-emerald-600 tabular-nums">+12%</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
              <span className="text-[13px] text-gray-600">Target</span>
              <span className="text-[13px] font-medium text-gray-900 tabular-nums">
                {config.value ? `$${(parseFloat(String(config.value).replace(/[^0-9.]/g, '')) * 1.1).toFixed(1)}M` : '-'}
              </span>
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <span className="text-[13px] text-gray-600">Progress</span>
              <span className="text-[13px] font-medium text-gray-900 tabular-nums">85%</span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

/**
 * Get icon for visualization type
 */
const getVisualizationIcon = (type: string) => {
  switch (type) {
    case 'bar':
    case 'column':
      return ChartBar;
    case 'line':
    case 'area':
      return ChartLine;
    case 'pie':
      return ChartPie;
    case 'donut':
      return ChartDonut;
    case 'metric':
      return NumberSquareOne;
    case 'table':
      return Rows;
    default:
      return ChartBar;
  }
};

/**
 * Get default axis configuration for a table
 */
const getDefaultAxisConfig = (table: DataTable | undefined, chartType: ChartConfig['type']) => {
  if (!table) return { xAxis: '', yAxis: '', series: [] };

  const stringColumns = table.columns.filter((c) => c.type === 'string');
  const numericColumns = table.columns.filter((c) => ['number', 'currency', 'percentage'].includes(c.type));

  const xAxis = stringColumns[0]?.key || table.columns[0]?.key || '';
  const yAxis = numericColumns[0]?.key || '';

  // For bar/column charts with multiple series, use multiple numeric columns
  const series =
    chartType === 'bar' || chartType === 'column' || chartType === 'line' || chartType === 'area'
      ? numericColumns.slice(0, 3).map((c) => c.key)
      : [];

  return { xAxis, yAxis, series };
};

/**
 * ConfigureWidgetModal - Configure a newly dropped widget
 */
const ConfigureWidgetModal: React.FC<{
  dragItem: DragItem;
  dataTables: DataTable[];
  onClose: () => void;
  onSave: (widget: DashboardWidget) => void;
}> = ({ dragItem, dataTables, onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [selectedTableId, setSelectedTableId] = useState(dragItem.tableId || dataTables[0]?.id || '');
  const [chartType, setChartType] = useState<ChartConfig['type']>(
    (dragItem.visualizationType as ChartConfig['type']) || 'bar'
  );

  const isMetric = dragItem.visualizationType === 'metric';
  const isTable = dragItem.visualizationType === 'table';

  const [metricLabel, setMetricLabel] = useState('');
  const [metricValue, setMetricValue] = useState('');

  // Get selected table and its columns
  const selectedTable = dataTables.find((t) => t.id === selectedTableId);
  const stringColumns = selectedTable?.columns.filter((c) => c.type === 'string') || [];
  const numericColumns =
    selectedTable?.columns.filter((c) => ['number', 'currency', 'percentage'].includes(c.type)) || [];

  // Axis configuration
  const defaultConfig = getDefaultAxisConfig(selectedTable, chartType);
  const [xAxis, setXAxis] = useState(defaultConfig.xAxis);
  const [yAxis, setYAxis] = useState(defaultConfig.yAxis);
  const [selectedSeries, setSelectedSeries] = useState<string[]>(defaultConfig.series);

  // Update axis defaults when table changes
  const handleTableChange = (newTableId: string) => {
    setSelectedTableId(newTableId);
    const newTable = dataTables.find((t) => t.id === newTableId);
    const newConfig = getDefaultAxisConfig(newTable, chartType);
    setXAxis(newConfig.xAxis);
    setYAxis(newConfig.yAxis);
    setSelectedSeries(newConfig.series);
  };

  const Icon = getVisualizationIcon(dragItem.visualizationType || 'bar');

  const handleSave = () => {
    const widgetId = `widget-${Date.now()}`;

    if (isMetric) {
      const widget: DashboardWidget = {
        id: widgetId,
        type: 'metric',
        title: metricLabel || 'New Metric',
        position: { x: 0, y: 0 },
        size: { width: 3, height: 1 },
        config: {
          id: `metric-${Date.now()}`,
          label: metricLabel || 'New Metric',
          value: metricValue || '0',
          change: 0,
          changeType: 'neutral',
          format: 'number',
        } as MetricConfig,
      };
      onSave(widget);
    } else if (isTable) {
      const widget: DashboardWidget = {
        id: widgetId,
        type: 'table',
        title: title || 'New Table',
        position: { x: 0, y: 0 },
        size: { width: 12, height: 3 },
        config: {
          id: `table-${Date.now()}`,
          dataTableId: dragItem.tableId || selectedTableId,
          sortOrder: 'asc',
        },
      };
      onSave(widget);
    } else {
      // Determine if we use series or single yAxis
      const useSeries = chartType === 'bar' || chartType === 'column' || chartType === 'line' || chartType === 'area';

      const widget: DashboardWidget = {
        id: widgetId,
        type: 'chart',
        title: title || 'New Chart',
        position: { x: 0, y: 0 },
        size: { width: 6, height: 2 },
        config: {
          id: `chart-${Date.now()}`,
          type: chartType,
          title: title || 'New Chart',
          dataTableId: selectedTableId,
          xAxis: xAxis,
          yAxis: yAxis,
          series: useSeries && selectedSeries.length > 0 ? selectedSeries : undefined,
        } as ChartConfig,
      };
      onSave(widget);
    }
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-8"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-white rounded-xl shadow-xl border border-gray-100"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center">
              <Icon size={18} weight="duotone" className="text-gray-700" />
            </div>
            <h2 className="text-sm font-medium text-gray-900">
              Configure {isMetric ? 'Metric' : isTable ? 'Table' : 'Chart'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {isMetric ? (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Metric Label</label>
                <input
                  type="text"
                  value={metricLabel}
                  onChange={(e) => setMetricLabel(e.target.value)}
                  placeholder="e.g., Total Revenue"
                  className="w-full px-3 py-2 text-[13px] text-gray-900 bg-white border border-gray-200 rounded-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Value</label>
                <input
                  type="text"
                  value={metricValue}
                  onChange={(e) => setMetricValue(e.target.value)}
                  placeholder="e.g., $1.2M"
                  className="w-full px-3 py-2 text-[13px] text-gray-900 bg-white border border-gray-200 rounded-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={`Enter ${isTable ? 'table' : 'chart'} title`}
                  className="w-full px-3 py-2 text-[13px] text-gray-900 bg-white border border-gray-200 rounded-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                />
              </div>

              {!isTable && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Chart Type</label>
                  <select
                    value={chartType}
                    onChange={(e) => setChartType(e.target.value as ChartConfig['type'])}
                    className="w-full px-3 py-2 text-[13px] text-gray-900 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow cursor-pointer"
                  >
                    <option value="bar">Bar Chart</option>
                    <option value="line">Line Chart</option>
                    <option value="pie">Pie Chart</option>
                    <option value="donut">Donut Chart</option>
                    <option value="area">Area Chart</option>
                    <option value="column">Column Chart</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Data Source</label>
                <select
                  value={selectedTableId}
                  onChange={(e) => handleTableChange(e.target.value)}
                  disabled={!!dragItem.tableId}
                  className="w-full px-3 py-2 text-[13px] text-gray-900 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow cursor-pointer disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                >
                  {dataTables.map((table) => (
                    <option key={table.id} value={table.id}>
                      {table.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Axis Configuration for Charts */}
              {!isTable && selectedTable && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">X-Axis (Categories)</label>
                    <select
                      value={xAxis}
                      onChange={(e) => setXAxis(e.target.value)}
                      className="w-full px-3 py-2 text-[13px] text-gray-900 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow cursor-pointer"
                    >
                      {stringColumns.map((col) => (
                        <option key={col.key} value={col.key}>
                          {col.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Y-Axis (Values)</label>
                    <select
                      value={yAxis}
                      onChange={(e) => setYAxis(e.target.value)}
                      className="w-full px-3 py-2 text-[13px] text-gray-900 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow cursor-pointer"
                    >
                      {numericColumns.map((col) => (
                        <option key={col.key} value={col.key}>
                          {col.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {(chartType === 'bar' || chartType === 'column' || chartType === 'line' || chartType === 'area') &&
                    numericColumns.length > 1 && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                          Data Series (select multiple)
                        </label>
                        <div className="space-y-1.5 max-h-32 overflow-y-auto p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                          {numericColumns.map((col) => (
                            <label key={col.key} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedSeries.includes(col.key)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedSeries([...selectedSeries, col.key]);
                                  } else {
                                    setSelectedSeries(selectedSeries.filter((s) => s !== col.key));
                                  }
                                }}
                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              <span className="text-[13px] text-gray-700">{col.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                </>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-2 px-5 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="flex-1 px-3 py-2 text-[13px] font-medium text-gray-800 bg-gray-100/70 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-3 py-2 text-[13px] font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-xl transition-colors cursor-pointer"
          >
            Add to Dashboard
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

/**
 * DashboardCanvas - Main dashboard display area
 */
export const DashboardCanvas: React.FC<DashboardCanvasProps> = ({
  dashboard,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  viewMode: _viewMode,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onViewModeChange: _onViewModeChange,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onShare: _onShare,
  onFilter,
  onExport,
  isLoading = false,
  onWidgetAdd,
  onWidgetDelete,
  dataTables = [],
}) => {
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const [showSharePopover, setShowSharePopover] = useState(false);
  const [expandedWidget, setExpandedWidget] = useState<DashboardWidget | null>(null);
  const [editingWidget, setEditingWidget] = useState<DashboardWidget | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<MetricConfig | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [pendingDragItem, setPendingDragItem] = useState<DragItem | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    try {
      const data = e.dataTransfer.getData('application/json');
      if (data) {
        const dragItem: DragItem = JSON.parse(data);
        setPendingDragItem(dragItem);
      }
    } catch (error) {
      console.error('Error parsing drag data:', error);
    }
  }, []);

  const handleWidgetConfigSave = useCallback((widget: DashboardWidget) => {
    onWidgetAdd?.(widget);
    setPendingDragItem(null);
  }, [onWidgetAdd]);

  // Separate widgets by type for layout
  const metrics = dashboard.widgets.filter((w) => w.type === 'metric');
  const charts = dashboard.widgets.filter((w) => w.type === 'chart');
  const tables = dashboard.widgets.filter((w) => w.type === 'table');

  return (
    <div className="h-full flex flex-col bg-gray-50/50">
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-4 bg-white border-b border-gray-100">
        <div className="flex items-center gap-3">
          {/* View Mode Toggle
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => onViewModeChange?.('data')}
              className={`px-3 py-1.5 text-[13px] font-medium rounded-md transition-all duration-150 cursor-pointer ${
                viewMode === 'data'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Data
            </button>
            <button
              onClick={() => onViewModeChange?.('dashboard')}
              className={`px-3 py-1.5 text-[13px] font-medium rounded-md transition-all duration-150 cursor-pointer ${
                viewMode === 'dashboard'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Dashboard
            </button>
          </div> */}

          {/* <div className="h-4 w-px bg-gray-200" /> */}

          <h1 className="text-[13px] font-medium text-gray-900">{dashboard.title}</h1>
        </div>

        {/* Actions */}
        <div className="relative flex items-center gap-1.5">
          <button
            onClick={() => {
              setShowFilterPopover(!showFilterPopover);
              setShowSharePopover(false);
            }}
            className="flex items-center gap-1.5 text-[13px] px-2.5 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg text-gray-700 transition-colors duration-150 cursor-pointer"
          >
            <Funnel size={14} weight="duotone" className="text-gray-500" />
            Filter
          </button>
          <button
            onClick={onExport}
            className="flex items-center gap-1.5 text-[13px] px-2.5 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg text-gray-700 transition-colors duration-150 cursor-pointer"
          >
            <Download size={14} weight="duotone" className="text-gray-500" />
            Export
          </button>
          <button
            onClick={() => {
              setShowSharePopover(!showSharePopover);
              setShowFilterPopover(false);
            }}
            className="flex items-center gap-1.5 text-[13px] px-2.5 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg text-gray-700 transition-colors duration-150 cursor-pointer"
          >
            <ShareNetwork size={14} weight="duotone" className="text-gray-500" />
            Share
          </button>

          {/* Filter Popover */}
          <AnimatePresence>
            {showFilterPopover && (
              <FilterPopover
                onClose={() => setShowFilterPopover(false)}
                onApply={(filters) => {
                  console.log('Filters applied:', filters);
                  onFilter?.();
                }}
              />
            )}
          </AnimatePresence>

          {/* Share Popover */}
          <AnimatePresence>
            {showSharePopover && (
              <SharePopover
                onClose={() => setShowSharePopover(false)}
                dashboardTitle={dashboard.title}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Dashboard Content - Drop Zone */}
      <div
        className={`flex-1 overflow-y-auto p-6 transition-colors ${
          isDragOver ? 'bg-indigo-50/50' : ''
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drop Zone Overlay */}
        <AnimatePresence>
          {isDragOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 pointer-events-none z-40 flex items-center justify-center"
              style={{ marginTop: 56 }}
            >
              <div className="absolute inset-0 bg-indigo-500/5 backdrop-blur-[1px]" />
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative bg-white border-2 border-dashed border-indigo-400 rounded-2xl px-8 py-6 shadow-lg"
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                    <Plus size={24} weight="bold" className="text-indigo-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-900">Drop to add widget</p>
                  <p className="text-xs text-gray-500">Configure your widget after dropping</p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                className="w-10 h-10 border-3 border-gray-200 border-t-gray-600 rounded-full mx-auto mb-4"
              />
              <p className="text-sm text-gray-500">Loading dashboard...</p>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            {/* Metrics Row */}
            {metrics.length > 0 && (
              <div className="grid grid-cols-4 gap-4">
                {metrics.map((widget, index) => (
                  <motion.div
                    key={widget.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <MetricCard
                      config={widget.config as MetricConfig}
                      onClick={() => setSelectedMetric(widget.config as MetricConfig)}
                      onDelete={() => onWidgetDelete?.(widget.id)}
                    />
                  </motion.div>
                ))}
              </div>
            )}

            {/* Charts Grid */}
            {charts.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                {charts.map((widget, index) => (
                  <motion.div
                    key={widget.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.05 }}
                  >
                    <ChartWidget
                      widget={widget}
                      onClick={() => setExpandedWidget(widget)}
                      onEdit={() => setEditingWidget(widget)}
                      onExpand={() => setExpandedWidget(widget)}
                      onDelete={() => onWidgetDelete?.(widget.id)}
                    />
                  </motion.div>
                ))}
              </div>
            )}

            {/* Tables */}
            {tables.length > 0 && (
              <div className="space-y-4">
                {tables.map((widget, index) => (
                  <motion.div
                    key={widget.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.05 }}
                  >
                    <TableWidget
                      widget={widget}
                      onClick={() => setExpandedWidget(widget)}
                      onEdit={() => setEditingWidget(widget)}
                      onExpand={() => setExpandedWidget(widget)}
                      onDelete={() => onWidgetDelete?.(widget.id)}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {expandedWidget && (
          <ExpandedWidgetModal
            widget={expandedWidget}
            onClose={() => setExpandedWidget(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingWidget && (
          <EditWidgetModal
            widget={editingWidget}
            onClose={() => setEditingWidget(null)}
            onSave={(config) => {
              console.log('Widget saved:', config);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedMetric && (
          <MetricDetailModal
            config={selectedMetric}
            onClose={() => setSelectedMetric(null)}
          />
        )}
      </AnimatePresence>

      {/* Configure Widget Modal - for newly dropped widgets */}
      <AnimatePresence>
        {pendingDragItem && (
          <ConfigureWidgetModal
            dragItem={pendingDragItem}
            dataTables={dataTables}
            onClose={() => setPendingDragItem(null)}
            onSave={handleWidgetConfigSave}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default DashboardCanvas;
