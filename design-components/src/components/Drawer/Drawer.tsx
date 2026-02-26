/**
 * Drawer — reusable right-side slide-in panel primitive.
 *
 * Handles: portal rendering, animated backdrop, slide-in panel, and the
 * white rounded container.  Consumers own every pixel inside via `children`.
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  /** Panel width in pixels. Defaults to 480. */
  width?: number;
  /**
   * Whether to render a semi-transparent backdrop behind the panel.
   * Defaults to true. The backdrop closes the drawer on click.
   */
  showBackdrop?: boolean;
  /**
   * CSS z-index applied to the slide panel.
   * When showBackdrop is true, the backdrop uses zIndex - 5.
   * Defaults to 60.
   */
  zIndex?: number;
  /** Content rendered inside the white rounded-xl container. */
  children: React.ReactNode;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  width = 480,
  showBackdrop = true,
  zIndex = 60,
  children,
}) => {
  return ReactDOM.createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          {showBackdrop && (
            <motion.div
              className="fixed inset-0 bg-black/15"
              style={{ zIndex: zIndex - 5 }}
              onClick={onClose}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
          )}

          {/* Panel */}
          <motion.div
            className="fixed top-0 right-0 h-full p-2"
            style={{ width, maxWidth: '90vw', zIndex }}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            <div className="h-full flex flex-col bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default Drawer;
