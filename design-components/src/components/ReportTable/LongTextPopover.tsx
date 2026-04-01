import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { CopyIcon, CheckIcon, XIcon } from '@phosphor-icons/react';

export interface ExpandPopoverState {
  text: string;
  rect: DOMRect;
}

interface LongTextPopoverProps {
  text: string;
  anchorRect: DOMRect;
  onClose: () => void;
}

export function LongTextPopover({ text, anchorRect, onClose }: LongTextPopoverProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const popoverWidth = Math.max(anchorRect.width, 280);
  const left = Math.min(anchorRect.left, window.innerWidth - popoverWidth - 16);
  const top = anchorRect.bottom + 2;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[9999]" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: -4, scaleY: 0.96 }}
        animate={{ opacity: 1, y: 0, scaleY: 1 }}
        exit={{ opacity: 0, y: -4, scaleY: 0.96 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        style={{
          position: 'fixed',
          top,
          left,
          width: popoverWidth,
          transformOrigin: 'top center',
          zIndex: 10000,
        }}
        className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden"
      >
        <div className="px-4 py-3 max-h-56 overflow-y-auto settings-scrollbar">
          <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap break-words">
            {text}
          </p>
        </div>
        <div className="flex items-center justify-end gap-0.5 px-2.5 py-1.5 border-t border-gray-100">
          <button
            onClick={handleCopy}
            className="flex items-center justify-center w-6 h-6 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            title={copied ? 'Copied!' : 'Copy'}
          >
            {copied ? (
              <CheckIcon size={13} weight="bold" className="text-emerald-600" />
            ) : (
              <CopyIcon size={13} />
            )}
          </button>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-6 h-6 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            title="Close"
          >
            <XIcon size={13} />
          </button>
        </div>
      </motion.div>
    </>,
    document.body
  );
}
