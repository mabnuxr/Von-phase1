import { useRef, useEffect, useState } from 'react';
import { GridLayout, verticalCompactor, type Layout } from 'react-grid-layout';
import { WidgetRenderer } from '../WidgetRenderer';
import { WidgetErrorBoundary } from '../WidgetErrorBoundary';
import type { DashboardGridProps } from '../types';
import 'react-grid-layout/css/styles.css';

/**
 * Dashboard grid. Renders widgets in their configured positions
 * using react-grid-layout with drag and resize disabled.
 *
 * When `isEditMode` is true, widgets get a dashed border treatment
 * to indicate they are editable.
 */
const DashboardGrid: React.FC<DashboardGridProps> = ({
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
}) => {
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
    static: true,
  }));

  return (
    <div ref={containerRef} className="w-full pb-12">
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
        dragConfig={{ enabled: false }}
        resizeConfig={{ enabled: false }}
        compactor={gridConfig.compactType === 'vertical' ? verticalCompactor : undefined}
      >
        {gridLayout.map((item) => {
          const widget = widgets[item.i];
          if (!widget) return <div key={item.i} />;
          return (
            <div
              key={item.i}
              className={`h-full ${
                isEditMode
                  ? 'rounded-[18px] border-2 border-dashed border-gray-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.10)]'
                  : ''
              }`}
            >
              <WidgetErrorBoundary widgetId={widget.id} widgetTitle={widget.title}>
                <WidgetRenderer
                  widget={widget}
                  onTablePageChange={onTablePageChange}
                  isTableLoading={loadingTablePanels?.has(widget.id)}
                  onDrillDown={onDrillDown}
                  onPointDrillDown={onPointDrillDown}
                  onTableSortChange={onTableSortChange}
                  tableSortState={tableSortStates?.[widget.id]}
                />
              </WidgetErrorBoundary>
            </div>
          );
        })}
      </GridLayout>
    </div>
  );
};

export { DashboardGrid };
