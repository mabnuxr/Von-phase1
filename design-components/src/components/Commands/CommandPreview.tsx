/**
 * CommandPreview component
 * Renders the command chip and an expandable section showing the command prompt.
 * Does NOT own chat-uploaded files or user message text — those are rendered by
 * the parent so they remain consistent with the no-command path.
 *
 * Layout (top to bottom):
 *   1. CommandChip — always visible, click to toggle expanded
 *   2. [Expanded] Command prompt text
 *   3. [Expanded] Separator — only when hasContentBelow is true
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Command } from './types';
import { CommandChip } from './CommandChip';
import { TiptapViewer } from '../TiptapEditor';
import { useVisibilityToggle } from '../../hooks';

export interface CommandPreviewProps {
  command: Command;
}

export const CommandPreview: React.FC<CommandPreviewProps> = ({ command }) => {
  const { isVisible: isExpanded, toggleVisibility: onToggle } = useVisibilityToggle();

  return (
    <div>
      <CommandChip command={command} onClick={onToggle} isExpanded={isExpanded} />

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1, transition: { duration: 0.2, ease: 'easeOut' } }}
            exit={{ height: 0, opacity: 0, transition: { duration: 0.25, ease: 'easeIn' } }}
            className="overflow-hidden"
          >
            <div className="mt-1.5 text-sm text-gray-700 line-clamp-4">
              <TiptapViewer content={command.prompt} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-1.5 border-t border-gray-200/60" />
    </div>
  );
};
