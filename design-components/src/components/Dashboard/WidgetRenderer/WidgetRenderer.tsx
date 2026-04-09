import { useCallback, memo } from 'react';
import { WidgetShell } from '../WidgetShell';
import { ChartWidget } from '../ChartWidget';
import { CounterWidget } from '../CounterWidget';
import { TextWidget } from '../TextWidget';
import { TableWidget } from '../TableWidget';
import { QueryInfoPopover } from '../QueryInfoPopover';
import { WidgetFiltersPopover } from '../WidgetFiltersPopover';
import type {
  WidgetRendererProps,
  ChartWidgetConfig,
  CounterWidgetConfig,
  TableWidgetConfig,
  TextWidgetConfig,
  DrillFilters,
} from '../types';

/**
 * Routes a widget config to the correct atomic widget component,
 * wrapped in a WidgetShell for consistent card styling.
 *
 * Text widgets render without a shell since they ARE the header content.
 */
const WidgetRenderer: React.FC<WidgetRendererProps> = memo(
  ({
    widget,
    onTablePageChange,
    isTableLoading,
    onDrillDown,
    onPointDrillDown,
    onTableSortChange,
    tableSortState,
    appliedFilters,
  }) => {
    const handleDrillDown = useCallback(() => {
      onDrillDown?.(widget.id);
    }, [onDrillDown, widget.id]);

    const drillDownHandler = onDrillDown ? handleDrillDown : undefined;

    const handlePointDrillDown = useCallback(
      (filters: DrillFilters) => {
        onPointDrillDown?.(widget.id, filters);
      },
      [onPointDrillDown, widget.id]
    );

    switch (widget.type) {
      case 'chart':
        return (
          <WidgetShell
            title={widget.title}
            subtitle={widget.subtitle}
            onDrillDown={drillDownHandler}
            queryInfo={widget.queryInfo}
            appliedFilters={appliedFilters}
          >
            <ChartWidget
              config={widget.config as ChartWidgetConfig}
              drilldown={widget.drilldown}
              onPointClick={onPointDrillDown ? handlePointDrillDown : undefined}
            />
          </WidgetShell>
        );

      case 'counter':
        if (widget.query_failed || (widget.config as CounterWidgetConfig).value === null) {
          return (
            <div
              className="group relative h-full bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col items-center justify-center cursor-pointer hover:border-gray-200 hover:shadow-md transition-all"
              onClick={drillDownHandler}
            >
              {(appliedFilters || widget.queryInfo) && (
                <div className="absolute top-2.5 right-2.5 flex items-center gap-0.5 z-10">
                  {appliedFilters && <WidgetFiltersPopover filters={appliedFilters} />}
                  {widget.queryInfo && <QueryInfoPopover queryInfo={widget.queryInfo} />}
                </div>
              )}
              {widget.title && (
                <p className="text-xs font-medium text-gray-500 mb-1.5 truncate max-w-full tracking-wide uppercase">
                  {widget.title}
                </p>
              )}
              <p className="text-2xl font-bold text-gray-300 tabular-nums">—</p>
            </div>
          );
        }
        return (
          <CounterWidget
            config={widget.config as CounterWidgetConfig}
            title={widget.title}
            subtitle={widget.subtitle}
            onDrillDown={drillDownHandler}
            queryInfo={widget.queryInfo}
            appliedFilters={appliedFilters}
          />
        );

      case 'text':
        return (
          <div className="h-full">
            <TextWidget config={widget.config as TextWidgetConfig} />
          </div>
        );

      case 'table':
        return (
          <WidgetShell
            title={widget.title}
            subtitle={widget.subtitle}
            onDrillDown={drillDownHandler}
            queryInfo={widget.queryInfo}
            appliedFilters={appliedFilters}
          >
            <TableWidget
              config={widget.config as TableWidgetConfig}
              onPageChange={
                onTablePageChange ? (page: number) => onTablePageChange(widget.id, page) : undefined
              }
              isLoading={isTableLoading}
              onSortChange={
                onTableSortChange
                  ? (columnId: string, order: 'asc' | 'desc' | null) =>
                      onTableSortChange(widget.id, columnId, order)
                  : undefined
              }
              sortState={tableSortState}
            />
          </WidgetShell>
        );

      default:
        return (
          <WidgetShell title={widget.title}>
            <div className="flex items-center justify-center h-full text-sm text-gray-400">
              Unknown widget type
            </div>
          </WidgetShell>
        );
    }
  }
);

export { WidgetRenderer };
