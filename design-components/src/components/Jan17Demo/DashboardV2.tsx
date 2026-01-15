import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DotsThreeIcon,
  PencilSimpleIcon,
  TrashIcon,
  TableIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  FunnelIcon,
  DownloadIcon,
  ArrowsClockwiseIcon,
  PaperPlaneTiltIcon,
} from '@phosphor-icons/react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { SecondaryIconButton } from '../forms/buttons';
import { ContextMenu, type ContextMenuItem } from '../popups';

// ============================================================================
// Types
// ============================================================================

export interface KPICardData {
  id: string;
  title: string;
  value: string;
  change?: string;
  changeDirection?: 'up' | 'down' | 'neutral';
  subtitle?: string;
}

export interface ChartData {
  id: string;
  title: string;
  type: 'bar' | 'pie';
  data: unknown;
}

export interface TableColumn {
  id: string;
  label: string;
  type?: 'string' | 'number' | 'currency' | 'date';
}

export interface TableData {
  id: string;
  title: string;
  columns: TableColumn[];
  rows: Record<string, unknown>[];
}

export interface DashboardV2Props {
  name: string;
  kpiCards: KPICardData[];
  barChart?: ChartData;
  pieChart?: ChartData;
  table?: TableData;
  isBuilding?: boolean;
  buildProgress?: number;
  visibleWidgets?: string[];
  onWidgetDrillDown?: (widgetId: string) => void;
  onWidgetEdit?: (widgetId: string) => void;
  onWidgetDelete?: (widgetId: string) => void;
  /** Callback when filter button is clicked */
  onFilterClick?: (buttonRect: DOMRect) => void;
  /** Callback when export button is clicked */
  onExportClick?: () => void;
  /** Callback when refresh button is clicked */
  onRefreshClick?: () => void;
  /** Callback when share button is clicked */
  onShareClick?: (buttonRect: DOMRect) => void;
  /** Callback when edit button is clicked (enters edit mode) */
  onEditClick?: () => void;
  /** Callback when dashboard name is changed */
  onNameChange?: (newName: string) => void;
  /** Whether the dashboard is in edit mode */
  isEditMode?: boolean;
}

// ============================================================================
// Context Menu Items
// ============================================================================

const getWidgetContextMenuItems = (): ContextMenuItem[] => [
  { id: 'edit', label: 'Edit', icon: <PencilSimpleIcon size={14} /> },
  { id: 'delete', label: 'Delete', icon: <TrashIcon size={14} />, variant: 'danger' },
];

// ============================================================================
// KPI Card Component
// ============================================================================

interface KPICardProps {
  data: KPICardData;
  isAnimating?: boolean;
  onDrillDown?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
}

const KPICard: React.FC<KPICardProps> = ({ data, isAnimating, onDrillDown, onContextMenu }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={isAnimating ? { opacity: 0, y: 20 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="relative bg-white rounded-xl border border-gray-100 p-4 cursor-pointer hover:border-gray-200 transition-colors"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Actions */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-2 right-2 flex items-center gap-1"
          >
            <SecondaryIconButton
              icon={<TableIcon size={14} />}
              onClick={(e) => {
                e.stopPropagation();
                onDrillDown?.();
              }}
              title="View data"
              size="small"
            />
            <SecondaryIconButton
              icon={<DotsThreeIcon size={14} weight="bold" />}
              onClick={(e) => {
                e.stopPropagation();
                onContextMenu?.(e);
              }}
              title="More options"
              size="small"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-xs text-gray-500 mb-1">{data.title}</p>
      <p className="text-2xl font-semibold text-gray-900 tabular-nums">{data.value}</p>
      {data.change && (
        <div className="flex items-center gap-1 mt-1">
          {data.changeDirection === 'up' && <ArrowUpIcon size={12} className="text-emerald-600" />}
          {data.changeDirection === 'down' && <ArrowDownIcon size={12} className="text-red-600" />}
          <span
            className={`text-xs font-medium ${
              data.changeDirection === 'up'
                ? 'text-emerald-600'
                : data.changeDirection === 'down'
                  ? 'text-red-600'
                  : 'text-gray-500'
            }`}
          >
            {data.change}
          </span>
          {data.subtitle && <span className="text-xs text-gray-500">{data.subtitle}</span>}
        </div>
      )}
    </motion.div>
  );
};

// ============================================================================
// Chart Widget Component
// ============================================================================

interface ChartWidgetProps {
  data: ChartData;
  isAnimating?: boolean;
  onDrillDown?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
}

const ChartWidget: React.FC<ChartWidgetProps> = ({ data, isAnimating, onDrillDown, onContextMenu }) => {
  const [isHovered, setIsHovered] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  const chartOptions: Highcharts.Options = useMemo(() => {
    const baseOptions: Highcharts.Options = {
      chart: {
        backgroundColor: 'transparent',
        style: { fontFamily: 'inherit' },
        spacing: [10, 10, 10, 10],
      },
      title: { text: undefined },
      credits: { enabled: false },
      legend: {
        enabled: true,
        align: 'center',
        verticalAlign: 'bottom',
        itemStyle: { fontSize: '11px', fontWeight: '400', color: '#6b7280' },
      },
      tooltip: {
        backgroundColor: '#1f2937',
        borderColor: '#374151',
        borderRadius: 8,
        style: { color: '#fff', fontSize: '11px' },
      },
    };

    if (data.type === 'bar') {
      const barData = data.data as { categories: string[]; series: { name: string; data: number[] }[] };
      return {
        ...baseOptions,
        chart: { ...baseOptions.chart, type: 'column' },
        xAxis: {
          categories: barData.categories,
          labels: { style: { fontSize: '10px', color: '#6b7280' } },
          lineColor: '#e5e7eb',
          tickColor: '#e5e7eb',
        },
        yAxis: {
          title: { text: undefined },
          labels: { style: { fontSize: '10px', color: '#6b7280' } },
          gridLineColor: '#f3f4f6',
        },
        plotOptions: {
          column: {
            borderRadius: 4,
            borderWidth: 0,
            groupPadding: 0.2,
            pointPadding: 0.1,
          },
        },
        colors: ['#4f46e5', '#818cf8'],
        series: barData.series as Highcharts.SeriesOptionsType[],
      };
    }

    if (data.type === 'pie') {
      const pieData = data.data as { name: string; y: number; color?: string }[];
      return {
        ...baseOptions,
        chart: { ...baseOptions.chart, type: 'pie' },
        plotOptions: {
          pie: {
            innerSize: '50%',
            borderWidth: 0,
            dataLabels: {
              enabled: true,
              format: '{point.name}: {point.percentage:.0f}%',
              style: { fontSize: '10px', fontWeight: '400', color: '#374151' },
            },
          },
        },
        series: [
          {
            type: 'pie',
            name: 'Distribution',
            data: pieData,
          },
        ],
      };
    }

    return baseOptions;
  }, [data]);

  return (
    <motion.div
      initial={isAnimating ? { opacity: 0, y: 20 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="relative bg-white rounded-xl border border-gray-100 overflow-hidden cursor-pointer hover:border-gray-200 transition-colors"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="text-[13px] font-medium text-gray-900">{data.title}</span>
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1"
            >
              <SecondaryIconButton
                icon={<TableIcon size={14} />}
                onClick={(e) => {
                  e.stopPropagation();
                  onDrillDown?.();
                }}
                title="View data"
                size="small"
              />
              <SecondaryIconButton
                icon={<DotsThreeIcon size={14} weight="bold" />}
                onClick={(e) => {
                  e.stopPropagation();
                  onContextMenu?.(e);
                }}
                title="More options"
                size="small"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Chart */}
      <div ref={chartRef} className="p-4 h-64">
        <HighchartsReact
          highcharts={Highcharts}
          options={chartOptions}
          containerProps={{ style: { height: '100%', width: '100%' } }}
        />
      </div>
    </motion.div>
  );
};

// ============================================================================
// Table Widget Component
// ============================================================================

interface TableWidgetProps {
  data: TableData;
  isAnimating?: boolean;
  onDrillDown?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
}

const TableWidget: React.FC<TableWidgetProps> = ({ data, isAnimating, onDrillDown, onContextMenu }) => {
  const [isHovered, setIsHovered] = useState(false);

  const formatValue = (value: unknown, type?: string): string => {
    if (value === null || value === undefined) return '—';
    if (type === 'currency' && typeof value === 'number') {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    }
    if (type === 'date' && typeof value === 'string') {
      return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    return String(value);
  };

  return (
    <motion.div
      initial={isAnimating ? { opacity: 0, y: 20 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="relative bg-white rounded-xl border border-gray-100 overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="text-[13px] font-medium text-gray-900">{data.title}</span>
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1"
            >
              <SecondaryIconButton
                icon={<TableIcon size={14} />}
                onClick={(e) => {
                  e.stopPropagation();
                  onDrillDown?.();
                }}
                title="View full data"
                size="small"
              />
              <SecondaryIconButton
                icon={<DotsThreeIcon size={14} weight="bold" />}
                onClick={(e) => {
                  e.stopPropagation();
                  onContextMenu?.(e);
                }}
                title="More options"
                size="small"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Table */}
      <div className="overflow-x-auto max-h-80">
        <table className="w-full text-[13px]">
          <thead className="sticky top-0 bg-gray-50">
            <tr>
              {data.columns.map((col) => (
                <th
                  key={col.id}
                  className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.rows.slice(0, 10).map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50 transition-colors">
                {data.columns.map((col) => (
                  <td
                    key={col.id}
                    className={`px-4 py-2 text-gray-900 ${col.type === 'currency' || col.type === 'number' ? 'tabular-nums' : ''}`}
                  >
                    {formatValue(row[col.id], col.type)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {data.rows.length > 10 && (
          <div className="px-4 py-2 text-xs text-gray-500 border-t border-gray-100">
            Showing 10 of {data.rows.length} rows
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const DashboardV2: React.FC<DashboardV2Props> = ({
  name,
  kpiCards,
  barChart,
  pieChart,
  table,
  isBuilding = false,
  visibleWidgets = [],
  onWidgetDrillDown,
  onWidgetEdit,
  onWidgetDelete,
  onFilterClick,
  onExportClick,
  onRefreshClick,
  onShareClick,
  onEditClick,
  onNameChange,
  isEditMode = false,
}) => {
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const shareButtonRef = useRef<HTMLDivElement>(null);
  const editButtonRef = useRef<HTMLDivElement>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(name);

  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { top: number; left: number };
    widgetId: string | null;
  }>({ isOpen: false, position: { top: 0, left: 0 }, widgetId: null });

  const handleContextMenu = (e: React.MouseEvent, widgetId: string) => {
    e.preventDefault();
    setContextMenu({
      isOpen: true,
      position: { top: e.clientY, left: e.clientX },
      widgetId,
    });
  };

  const handleContextMenuAction = (actionId: string) => {
    if (!contextMenu.widgetId) return;
    if (actionId === 'edit') {
      onWidgetEdit?.(contextMenu.widgetId);
    } else if (actionId === 'delete') {
      onWidgetDelete?.(contextMenu.widgetId);
    }
    setContextMenu({ ...contextMenu, isOpen: false });
  };

  const isWidgetVisible = (widgetId: string) => {
    if (!isBuilding) return true;
    return visibleWidgets.includes(widgetId);
  };

  return (
    <div className="px-2 h-full w-full bg-white rounded-xl border border-gray-100 shadow-xs flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
        {/* Dashboard Name - Editable */}
        {isEditingName ? (
          <input
            type="text"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onBlur={() => {
              setIsEditingName(false);
              if (editedName.trim() && editedName !== name) {
                onNameChange?.(editedName.trim());
              } else {
                setEditedName(name);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setIsEditingName(false);
                if (editedName.trim() && editedName !== name) {
                  onNameChange?.(editedName.trim());
                }
              }
              if (e.key === 'Escape') {
                setIsEditingName(false);
                setEditedName(name);
              }
            }}
            autoFocus
            className="text-[13px] font-medium text-gray-900 bg-transparent border-b border-indigo-500 outline-none px-0 py-0"
          />
        ) : (
          <span
            className={`text-[13px] font-medium text-gray-900 ${onNameChange ? 'cursor-pointer hover:text-indigo-600 transition-colors' : ''}`}
            onClick={() => {
              if (onNameChange) {
                setIsEditingName(true);
              }
            }}
            title={onNameChange ? 'Click to edit name' : undefined}
          >
            {name}
          </span>
        )}
        <div className="flex items-center gap-2">
          {/* Filter Button */}
          {onFilterClick && (
            <button
              ref={filterButtonRef}
              onClick={() => {
                if (filterButtonRef.current) {
                  onFilterClick(filterButtonRef.current.getBoundingClientRect());
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-gray-700 bg-white border border-gray-100 rounded-lg hover:bg-gray-50 hover:border-gray-200 transition-colors cursor-pointer"
              title="Filter dashboard"
            >
              <FunnelIcon size={14} weight="regular" />
              <span>Filter</span>
            </button>
          )}

          {/* Refresh Button */}
          {onRefreshClick && (
            <SecondaryIconButton
              icon={<ArrowsClockwiseIcon size={14} />}
              onClick={onRefreshClick}
              title="Refresh now • Refreshes automatically daily"
            />
          )}

          {/* Export Button */}
          {onExportClick && (
            <SecondaryIconButton
              icon={<DownloadIcon size={14} />}
              onClick={onExportClick}
              title="Export as PDF"
            />
          )}

          {/* Edit Button */}
          {onEditClick && (
            <div ref={editButtonRef}>
              <SecondaryIconButton
                icon={<PencilSimpleIcon size={14} />}
                onClick={onEditClick}
                title="Edit dashboard"
              />
            </div>
          )}

          {/* Separator */}
          {onShareClick && <div className="h-6 w-px bg-gray-200" />}

          {/* Share Button */}
          {onShareClick && (
            <div ref={shareButtonRef}>
              <SecondaryIconButton
                icon={<PaperPlaneTiltIcon size={14} />}
                onClick={() => {
                  if (shareButtonRef.current) {
                    onShareClick(shareButtonRef.current.getBoundingClientRect());
                  }
                }}
                title="Share dashboard"
              />
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {/* KPI Cards Row */}
          <div className="grid grid-cols-3 gap-4">
            {kpiCards.map((kpi) => (
              <AnimatePresence key={kpi.id}>
                {isWidgetVisible(kpi.id) && (
                  <KPICard
                    data={kpi}
                    isAnimating={isBuilding}
                    onDrillDown={() => onWidgetDrillDown?.(kpi.id)}
                    onContextMenu={(e) => handleContextMenu(e, kpi.id)}
                  />
                )}
              </AnimatePresence>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-2 gap-4">
            {barChart && (
              <AnimatePresence>
                {isWidgetVisible(barChart.id) && (
                  <ChartWidget
                    data={barChart}
                    isAnimating={isBuilding}
                    onDrillDown={() => onWidgetDrillDown?.(barChart.id)}
                    onContextMenu={(e) => handleContextMenu(e, barChart.id)}
                  />
                )}
              </AnimatePresence>
            )}
            {pieChart && (
              <AnimatePresence>
                {isWidgetVisible(pieChart.id) && (
                  <ChartWidget
                    data={pieChart}
                    isAnimating={isBuilding}
                    onDrillDown={() => onWidgetDrillDown?.(pieChart.id)}
                    onContextMenu={(e) => handleContextMenu(e, pieChart.id)}
                  />
                )}
              </AnimatePresence>
            )}
          </div>

          {/* Table */}
          {table && (
            <AnimatePresence>
              {isWidgetVisible(table.id) && (
                <TableWidget
                  data={table}
                  isAnimating={isBuilding}
                  onDrillDown={() => onWidgetDrillDown?.(table.id)}
                  onContextMenu={(e) => handleContextMenu(e, table.id)}
                />
              )}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Context Menu */}
      <ContextMenu
        isOpen={contextMenu.isOpen}
        onClose={() => setContextMenu({ ...contextMenu, isOpen: false })}
        items={getWidgetContextMenuItems()}
        fixedPosition={contextMenu.position}
        width={128}
        onItemClick={(item) => handleContextMenuAction(item.id)}
      />
    </div>
  );
};

export default DashboardV2;
