/**
 * Accordion — reusable collapsible section with an animated body.
 *
 * Renders a header row (title + optional summary badge + caret) and animates
 * the content in/out when toggled.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CaretRight } from '@phosphor-icons/react';

export interface AccordionProps {
  title: string;
  /** Short descriptive text shown next to the title when collapsed (e.g. "3 files"). */
  summary?: React.ReactNode;
  children: React.ReactNode;
  /** Whether the accordion starts open. Defaults to false. */
  defaultOpen?: boolean;
}

export const Accordion: React.FC<AccordionProps> = ({
  title,
  summary,
  children,
  defaultOpen = false,
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between w-full px-3 py-2.5 cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-800/80">{title}</span>
          {summary && <span className="text-xs text-gray-400">{summary}</span>}
        </div>
        <CaretRight
          size={12}
          className={`text-gray-400 transition-transform duration-150 ${open ? 'rotate-90' : ''}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Accordion;
