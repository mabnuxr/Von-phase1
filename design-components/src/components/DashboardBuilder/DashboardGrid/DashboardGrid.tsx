import GridLayout from 'react-grid-layout';
import type { LayoutItem } from 'react-grid-layout';
import type { DashboardGridProps } from './types';
import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Widget } from './Widget';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

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
  const { layout, widgets } = dashboardData;

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
        layout={layout}
        // @ts-expect-error-next-line--- incorrect types of react-grid-layout
        cols={12}
        rowHeight={30}
        width={containerWidth}
        onLayoutChange={onLayoutChange}
        draggableHandle=".widget-drag-handle"
        isResizable={true}
        isDraggable={true}
        margin={[16, 16]}
        containerPadding={[0, 0]}
        useCSSTransforms={true}
      >
        {layout.map((item: LayoutItem, index: number) => (
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
