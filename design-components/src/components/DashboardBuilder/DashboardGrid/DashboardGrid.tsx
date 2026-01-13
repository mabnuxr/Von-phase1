import {
  GridLayout,
  verticalCompactor,
  type LayoutItem,
  type Layout,
  type GridLayoutProps,
} from 'react-grid-layout';
import type { DashboardGridProps } from './types';
import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Widget } from './Widget';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

type EventCallback = NonNullable<GridLayoutProps['onResizeStart']>;

const GRID_COLS = 12;

// Find widgets that are in the same row (overlapping Y positions)
const getWidgetsInSameRow = (
  layout: Layout,
  targetItem: LayoutItem
): LayoutItem[] => {
  return layout.filter((item) => {
    if (item.i === targetItem.i) return false;
    // Check if items overlap vertically (same row)
    const targetTop = targetItem.y;
    const targetBottom = targetItem.y + targetItem.h;
    const itemTop = item.y;
    const itemBottom = item.y + item.h;
    return targetTop < itemBottom && targetBottom > itemTop;
  });
};

// Adjust adjacent widgets when one is resized
const adjustAdjacentWidgets = (
  layout: Layout,
  resizedItem: LayoutItem,
  oldItem: LayoutItem
): Layout => {
  const rowWidgets = getWidgetsInSameRow(layout, resizedItem);
  if (rowWidgets.length === 0) return layout;

  const widthDelta = resizedItem.w - oldItem.w;
  if (widthDelta === 0) return layout;

  // Sort widgets by x position
  const sortedRowWidgets = [...rowWidgets].sort((a, b) => a.x - b.x);

  // Find widgets to the right of the resized item
  const widgetsToRight = sortedRowWidgets.filter(
    (item) => item.x >= resizedItem.x + oldItem.w
  );

  // Find widgets to the left of the resized item
  const widgetsToLeft = sortedRowWidgets.filter(
    (item) => item.x + item.w <= resizedItem.x
  );

  const newLayout = layout.map((item) => {
    if (item.i === resizedItem.i) return resizedItem;

    // If resizing to the right, adjust widgets on the right
    if (widthDelta > 0 && widgetsToRight.some((w) => w.i === item.i)) {
      const newX = item.x + widthDelta;
      const maxX = GRID_COLS - item.w;

      // If widget would go off grid, shrink it instead
      if (newX > maxX) {
        const overflow = newX - maxX;
        const newWidth = Math.max(1, item.w - overflow);
        return { ...item, x: GRID_COLS - newWidth, w: newWidth };
      }

      // Check if total width exceeds grid
      const totalWidth =
        resizedItem.w +
        widgetsToRight.reduce((sum, w) => sum + w.w, 0) +
        widgetsToLeft.reduce((sum, w) => sum + w.w, 0);

      if (totalWidth > GRID_COLS) {
        // Proportionally shrink widgets to the right
        const excessWidth = totalWidth - GRID_COLS;
        const shrinkPerWidget = Math.ceil(excessWidth / widgetsToRight.length);
        const newWidth = Math.max(1, item.w - shrinkPerWidget);
        return { ...item, x: item.x + widthDelta, w: newWidth };
      }

      return { ...item, x: newX };
    }

    // If resizing to the left (shrinking), widgets on right can expand or shift left
    if (widthDelta < 0 && widgetsToRight.some((w) => w.i === item.i)) {
      return { ...item, x: item.x + widthDelta };
    }

    return item;
  });

  return newLayout;
};

const DashboardGrid = ({
  dashboardData,
  loading,
  onLayoutChange,
  onWidgetEdit,
  onWidgetExpand,
  onWidgetDelete,
  width,
}: DashboardGridProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(width || 1200);
  const [internalLayout, setInternalLayout] = useState<Layout>(
    dashboardData.layout
  );
  const resizeStartRef = useRef<LayoutItem | null>(null);
  const { widgets } = dashboardData;

  // Sync internal layout with props
  useEffect(() => {
    setInternalLayout(dashboardData.layout);
  }, [dashboardData.layout]);

  useEffect(() => {
    if (width) {
      setContainerWidth(width);
      return;
    }

    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, [width]);

  if (loading) {
    return (
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
    );
  }

  const handleResizeStart: EventCallback = (
    _layout,
    oldItem
  ) => {
    resizeStartRef.current = oldItem;
  };

  const handleResize: EventCallback = (
    layout,
    _oldItem,
    newItem
  ) => {
    if (!resizeStartRef.current || !newItem) return;

    const adjustedLayout = adjustAdjacentWidgets(
      layout,
      newItem,
      resizeStartRef.current
    );
    setInternalLayout(adjustedLayout);
  };

  const handleResizeStop: EventCallback = (
    layout,
    _oldItem,
    newItem
  ) => {
    if (!resizeStartRef.current || !newItem) return;

    const adjustedLayout = adjustAdjacentWidgets(
      layout,
      newItem,
      resizeStartRef.current
    );
    resizeStartRef.current = null;
    setInternalLayout(adjustedLayout);
    onLayoutChange(adjustedLayout);
  };

  const handleLayoutChange = (newLayout: Layout) => {
    // Only update if not during resize (resize handlers manage their own updates)
    if (!resizeStartRef.current) {
      setInternalLayout(newLayout);
      onLayoutChange(newLayout);
    }
  };

  return (
    <motion.div
      className="h-full w-full"
      ref={containerRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <GridLayout
        className="layout"
        layout={internalLayout}
        width={containerWidth}
        gridConfig={{
          cols: GRID_COLS,
          rowHeight: 80,
          margin: [8, 8] as const,
          containerPadding: [0, 0] as const,
          maxRows: Infinity,
        }}
        dragConfig={{
          enabled: true,
          handle: '.widget-drag-handle',
          bounded: false,
          threshold: 3,
        }}
        resizeConfig={{
          enabled: true,
          handles: ['se'],
        }}
        compactor={verticalCompactor}
        onLayoutChange={handleLayoutChange}
        onResizeStart={handleResizeStart}
        onResize={handleResize}
        onResizeStop={handleResizeStop}
      >
        {internalLayout.map((item: LayoutItem, index: number) => (
          <div key={item.i} className="h-full">
            <motion.div
              className="h-full"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Widget
                widget={widgets[item.i]}
                onEdit={onWidgetEdit ? () => onWidgetEdit(item.i) : undefined}
                onExpand={onWidgetExpand ? () => onWidgetExpand(item.i) : undefined}
                onDelete={onWidgetDelete ? () => onWidgetDelete(item.i) : undefined}
              />
            </motion.div>
          </div>
        ))}
      </GridLayout>
    </motion.div>
  );
};

export { DashboardGrid };
