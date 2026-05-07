import { useCallback, useMemo, memo } from 'react';
import { WidgetShell } from '../WidgetShell';
import { AddToChatButton } from '../../VonIcon';
import { ChartWidget } from '../ChartWidget';
import { CounterWidget } from '../CounterWidget';
import { TextWidget } from '../TextWidget';
import { TableWidget } from '../TableWidget';
import { QueryInfoPopover } from '../QueryInfoPopover';
import { WidgetFiltersPopover } from '../WidgetFiltersPopover';
import { DragPill } from '../DragPill';
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
    filterSlot,
    onAddToChat,
    variables,
    isEditMode,
  }) => {
    const handleDrillDown = useCallback(() => {
      onDrillDown?.(widget.id);
    }, [onDrillDown, widget.id]);

    const drillDownHandler = onDrillDown ? handleDrillDown : undefined;

    const handlePointDrillDown = useCallback(
      (filters: DrillFilters, metricValue?: unknown) => {
        onPointDrillDown?.(widget.id, filters, metricValue);
      },
      [onPointDrillDown, widget.id]
    );

    const handleAddToChat = useCallback(() => {
      onAddToChat?.({ id: widget.id, title: widget.title, type: widget.type });
    }, [onAddToChat, widget.id, widget.title, widget.type]);

    const addToChatHandler = onAddToChat ? handleAddToChat : undefined;

    // Resolve the explicit drillable-columns whitelist for this panel widget.
    // ``panel.drilldown_v2.drillable_columns`` lists the column ids in the
    // panel's main query output that the agent marked as clickable for drill
    // — typically the aggregated metric columns only, never GROUP BY
    // dimensions. When the agent authored it, we use it verbatim. When it's
    // null (omitted) we fall back to "every cell clickable" so legacy
    // dashboards predating this field keep their current drill behaviour.
    const drillableColumns: string[] | null | undefined = widget.drilldown_v2?.drillable_columns;

    // Table cell-click → drilldown_v2 wiring. Mirror of the chart `onPointClick`
    // path above (line 45–50) for table panels: when the user clicks a body
    // cell whose column id is in ``drillable_columns`` (or any cell, when the
    // field is null), build drillFilters by reading every column_map.data_key
    // from the clicked row and fire onPointDrillDown — same shape the chart
    // point handler sends. Without this wire-up, table panels rely solely on
    // the corner drilldown icon (panel-level drill, no row context), which
    // makes 2-D cohort/pivot cells effectively non-drillable even when
    // drilldown_v2 is correctly authored.
    //
    // Resolves drillFilters from the L0 default variant's column_map because
    // drilldown_v2 starts at L0 and that level declares the panel's click axes.
    // `extract_from` is null on table column_map entries (data_key already
    // matches the row column), so we just look up rowData[data_key]. Skip
    // entries with extract_from set (those are chart-axis bridges, not
    // table-row data) and skip data_keys not present in the row to avoid
    // sending `undefined` drill_filter values.
    const handleTableCellClick = useCallback(
      (columnId: string, cellValue: unknown, rowData: Record<string, unknown>) => {
        if (!onPointDrillDown) return;
        // Per-column gate: when the agent declared a drillable_columns
        // whitelist, only those cells fire a drill. null whitelist =
        // back-compat (every cell clickable).
        if (drillableColumns != null && !drillableColumns.includes(columnId)) {
          return;
        }
        const v2 = widget.drilldown_v2;
        const defaultVariant =
          v2?.levels?.[0]?.variants?.find((vt) => vt.is_default) ?? v2?.levels?.[0]?.variants?.[0];
        const columnMap = defaultVariant?.column_map ?? [];
        if (columnMap.length === 0) return;
        const drillFilters: DrillFilters = {};
        for (const cm of columnMap) {
          if (cm.extract_from) continue;
          const value = rowData[cm.data_key];
          // Match the chart `onPointClick` handler in useChartOptions.ts:307
          // — skip null/undefined values rather than emitting them as
          // drill_filters. The backend treats `{week_label: null}` as
          // "filter to rows where week_label IS NULL," not as "filter
          // omitted." A row with a missing dimension value should not
          // narrow the drill to NULL-only rows.
          if (value != null) {
            drillFilters[cm.data_key] = value;
          } else {
            console.warn(
              `[TableWidget] drilldown data_key "${cm.data_key}" resolved to null/undefined on cell click`
            );
          }
        }
        if (Object.keys(drillFilters).length === 0) return;
        // ``cellValue`` is the metric value the user clicked on (e.g. 47
        // for a SUM(arr) cell, 12.5 for a ratio cell). Surface it as the
        // optional metricValue arg so the drill breadcrumb can render it
        // as a parenthesized suffix on the chain segment, matching the
        // chart-click affordance.
        onPointDrillDown(widget.id, drillFilters, cellValue ?? null);
      },
      [onPointDrillDown, widget.id, widget.drilldown_v2, drillableColumns]
    );

    // Gate the cell-click handler on the panel actually having a usable
    // drilldown_v2 column_map. Without this, ANY table panel where the parent
    // wires onPointDrillDown gets the cell-click handler — and the
    // ``clickable-cells`` modifier downstream — even though clicking will
    // return early at the columnMap.length === 0 check above. The user then
    // sees a hover affordance on cells that don't actually drill (e.g. a
    // cohort table whose lineage shape didn't qualify for drilldown_v2).
    //
    // Mirror the same usability check the handler does: at least one
    // non-extract_from column_map entry on the L0 default variant is
    // required for the click to produce drill_filters. Plus, if the agent
    // explicitly authored an empty drillable_columns list ([]), no cell is
    // clickable — drop the hover affordance entirely (only the corner drill
    // icon remains).
    const hasUsableDrilldownV2 = useMemo(() => {
      const v2 = widget.drilldown_v2;
      const defaultVariant =
        v2?.levels?.[0]?.variants?.find((vt) => vt.is_default) ?? v2?.levels?.[0]?.variants?.[0];
      const columnMap = defaultVariant?.column_map ?? [];
      const hasColumnMap = columnMap.some((cm) => !cm.extract_from);
      // Empty whitelist explicitly disables cell clicks. null = back-compat.
      const explicitlyEmpty = Array.isArray(drillableColumns) && drillableColumns.length === 0;
      return hasColumnMap && !explicitlyEmpty;
    }, [widget.drilldown_v2, drillableColumns]);
    const tableCellClickHandler =
      onPointDrillDown && hasUsableDrilldownV2 ? handleTableCellClick : undefined;

    switch (widget.type) {
      case 'chart':
        return (
          <WidgetShell
            title={widget.title}
            subtitle={widget.subtitle}
            onDrillDown={drillDownHandler}
            queryInfo={widget.queryInfo}
            appliedFilters={appliedFilters}
            filterSlot={filterSlot}
            onAddToChat={addToChatHandler}
            isEditMode={isEditMode}
          >
            <ChartWidget
              config={widget.config as ChartWidgetConfig}
              drilldown={widget.drilldown}
              drilldownV2={widget.drilldown_v2}
              onPointClick={onPointDrillDown ? handlePointDrillDown : undefined}
            />
          </WidgetShell>
        );

      case 'counter':
        if (widget.query_failed || (widget.config as CounterWidgetConfig).value === null) {
          return (
            <div
              className="group relative h-full bg-white border border-gray-200 p-4 flex flex-col items-center justify-center cursor-pointer hover:border-gray-300 transition-all"
              onClick={drillDownHandler}
            >
              {isEditMode && widget.title && (
                <div className="absolute top-2.5 left-2.5 z-10 flex items-center h-7">
                  <DragPill label={widget.title} />
                </div>
              )}
              {(filterSlot || appliedFilters || widget.queryInfo || addToChatHandler) && (
                <div className="absolute top-2.5 right-2.5 flex items-center gap-0.5 z-10">
                  {filterSlot
                    ? filterSlot
                    : appliedFilters && <WidgetFiltersPopover filters={appliedFilters} />}
                  {widget.queryInfo && <QueryInfoPopover queryInfo={widget.queryInfo} />}
                  {addToChatHandler && <AddToChatButton onClick={addToChatHandler} />}
                </div>
              )}
              {widget.title && (
                <p className="text-xs font-medium text-gray-500 mb-1.5 truncate max-w-full">
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
            filterSlot={filterSlot}
            onAddToChat={addToChatHandler}
            isEditMode={isEditMode}
          />
        );

      case 'text':
        return (
          <TextWidget
            panelId={widget.id}
            config={widget.config as TextWidgetConfig}
            variables={variables}
            onAddToChat={addToChatHandler}
            isEditMode={isEditMode}
          />
        );

      case 'table':
        return (
          <WidgetShell
            title={widget.title}
            subtitle={widget.subtitle}
            onDrillDown={drillDownHandler}
            queryInfo={widget.queryInfo}
            appliedFilters={appliedFilters}
            filterSlot={filterSlot}
            onAddToChat={addToChatHandler}
            isEditMode={isEditMode}
          >
            <TableWidget
              panelId={widget.id}
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
              onCellClick={tableCellClickHandler}
              drillableColumns={drillableColumns}
            />
          </WidgetShell>
        );

      default:
        return (
          <WidgetShell title={widget.title} onAddToChat={addToChatHandler} isEditMode={isEditMode}>
            <div className="flex items-center justify-center h-full text-sm text-gray-400">
              Unknown widget type
            </div>
          </WidgetShell>
        );
    }
  }
);

export { WidgetRenderer };
