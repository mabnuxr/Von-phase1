import { useEffect, useRef, useState, memo } from 'react';
import { GridLayout, verticalCompactor, type Layout } from 'react-grid-layout';
import { WidgetRenderer } from '../WidgetRenderer';
import { WidgetSkeleton } from '../WidgetSkeleton';
import { WidgetErrorBoundary } from '../WidgetErrorBoundary';
import { DashboardGridConfigContext } from '../DashboardGridConfigContext';
import type { DashboardGridProps } from '../types';
import 'react-grid-layout/css/styles.css';
import './dashboard-grid.css';

/**
 * Dashboard grid. Renders widgets in their configured positions using
 * react-grid-layout. Drag and resize are only enabled in edit mode AND when
 * the drag-and-drop feature flag (`isDragDropEnabled`) is on.
 *
 * In that "drag-drop active" state we layer in:
 * - a faint dotted gridline backdrop sized to the actual snap cells
 * - the orange tab-pill drag handle inside each widget's header
 * - blue circular handles at all four widget corners for resizing
 */
const DashboardGrid: React.FC<DashboardGridProps> = memo(
  ({
    layout,
    widgets,
    gridConfig,
    onTablePageChange,
    loadingTablePanels,
    onDrillDown,
    onPointDrillDown,
    onTableSortChange,
    tableSortStates,
    isEditMode,
    isDragDropEnabled = true,
    isLoading,
    widgetAppliedFilters,
    widgetFilterSlot,
    onAddToChat,
    variablesByWidget,
    onLayoutChange,
  }) => {
    // Drag/drop chrome is only active when both edit mode and the
    // drag-and-drop feature flag are on. Edit mode alone keeps widgets pinned.
    const dragDropActive = !!isEditMode && isDragDropEnabled;

    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(1200);

    useEffect(() => {
      const el = containerRef.current;
      if (!el) return;

      const updateWidth = () => setContainerWidth(el.offsetWidth);
      updateWidth();

      const observer = new ResizeObserver(updateWidth);
      observer.observe(el);
      return () => observer.disconnect();
    }, []);

    const gridLayout: Layout = layout.map((item) => ({
      i: String(item.i),
      x: Number(item.x),
      y: Number(item.y),
      w: Number(item.w),
      h: Number(item.h),
      // Allow drag/resize only when edit mode AND drag-drop are both on.
      // Otherwise widgets stay pinned to their configured position.
      static: !dragDropActive,
      minW: 2,
      minH: 2,
    }));

    // Cell dimensions for the gridline backdrop. Computed from containerWidth
    // and the configured cols/margin/padding so the lines align exactly with
    // react-grid-layout's snap targets.
    const [marginX, marginY] = gridConfig.margin;
    const [padX, padY] = gridConfig.containerPadding;
    const usableWidth = Math.max(containerWidth - padX * 2, 0);
    const colStep = (usableWidth + marginX) / gridConfig.cols;
    const rowStep = gridConfig.rowHeight + marginY;

    return (
      <DashboardGridConfigContext.Provider value={gridConfig}>
        <div
          ref={containerRef}
          className={`w-full pb-12 ${dragDropActive ? 'dashboard-grid-canvas' : ''}`}
          style={
            dragDropActive
              ? ({
                  '--grid-col-step': `${colStep}px`,
                  '--grid-row-step': `${rowStep}px`,
                  '--grid-pad-x': `${padX}px`,
                  '--grid-pad-y': `${padY}px`,
                } as React.CSSProperties)
              : undefined
          }
        >
          <GridLayout
            className="layout "
            layout={gridLayout}
            width={containerWidth}
            gridConfig={{
              cols: gridConfig.cols,
              rowHeight: gridConfig.rowHeight,
              margin: gridConfig.margin,
              containerPadding: gridConfig.containerPadding,
              maxRows: Infinity,
            }}
            dragConfig={{
              enabled: dragDropActive,
              handle: '.widget-drag-handle',
            }}
            resizeConfig={{
              enabled: dragDropActive,
              handles: ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'],
            }}
            compactor={gridConfig.compactType === 'vertical' ? verticalCompactor : undefined}
            onLayoutChange={(next) => onLayoutChange?.(next)}
          >
            {gridLayout.map((item) => {
              const widget = widgets[item.i];
              if (!widget) return <div key={item.i} />;
              return (
                <div key={item.i} className="h-full relative">
                  {isLoading ? (
                    <WidgetSkeleton widget={widget} />
                  ) : (
                    <WidgetErrorBoundary widgetId={widget.id} widgetTitle={widget.title}>
                      <WidgetRenderer
                        widget={widget}
                        onTablePageChange={onTablePageChange}
                        isTableLoading={loadingTablePanels?.has(widget.id)}
                        onDrillDown={onDrillDown}
                        onPointDrillDown={onPointDrillDown}
                        onTableSortChange={onTableSortChange}
                        tableSortState={tableSortStates?.[widget.id]}
                        appliedFilters={widgetAppliedFilters?.[widget.id]}
                        filterSlot={widgetFilterSlot?.(widget.id)}
                        onAddToChat={onAddToChat}
                        variables={variablesByWidget?.[widget.id]}
                        isEditMode={dragDropActive}
                      />
                    </WidgetErrorBoundary>
                  )}
                </div>
              );
            })}
          </GridLayout>
        </div>
      </DashboardGridConfigContext.Provider>
    );
  }
);

export { DashboardGrid };
