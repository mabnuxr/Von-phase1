import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DotsSixVertical, PencilSimple, ArrowsOut, DotsThree, Trash } from '@phosphor-icons/react';
import type { WidgetLayoutProps } from './types';

const WidgetLayout: React.FC<WidgetLayoutProps> = ({
  title,
  subtitle,
  onEdit,
  onExpand,
  onDelete,
  children,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="h-full bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {/* Drag Handle */}
          <div className="widget-drag-handle cursor-grab active:cursor-grabbing p-1 -ml-1 text-gray-400 hover:text-gray-600 transition-colors">
            <DotsSixVertical size={16} weight="bold" />
          </div>

          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 truncate">{title}</h3>
            {subtitle && <p className="text-xs text-gray-500 mt-0.5 truncate">{subtitle}</p>}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-0.5 shrink-0">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              title="Edit widget"
            >
              <PencilSimple size={14} weight="duotone" />
            </button>
          )}
          {onExpand && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onExpand();
              }}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              title="Expand widget"
            >
              <ArrowsOut size={14} weight="duotone" />
            </button>
          )}
          {onDelete && (
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                title="More options"
              >
                <DotsThree size={14} weight="bold" />
              </button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {showMenu && (
                  <>
                    {/* Backdrop to close menu */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(false);
                      }}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="absolute right-0 top-full mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1"
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMenu(false);
                          onDelete();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <Trash size={14} weight="duotone" />
                        Delete
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-auto">
        {children}
      </div>
    </div>
  );
};

export { WidgetLayout };
