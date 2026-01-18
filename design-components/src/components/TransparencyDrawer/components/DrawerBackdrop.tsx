import React from 'react';
import { motion } from 'framer-motion';
import type { DrawerBackdropProps } from '../types';

// ============================================================================
// Component
// ============================================================================

/**
 * DrawerBackdrop - Semi-transparent backdrop for drawer overlays
 *
 * Features:
 * - Fade in/out animation
 * - Closes drawer on click
 * - High z-index for proper layering
 */
export const DrawerBackdrop = React.memo<DrawerBackdropProps>(({ onClose }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.2 }}
    className="fixed inset-0 bg-black/20 z-[9998]"
    onClick={onClose}
  />
));

DrawerBackdrop.displayName = 'DrawerBackdrop';
