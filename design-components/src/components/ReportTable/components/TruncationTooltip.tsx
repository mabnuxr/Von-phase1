import { createPortal } from 'react-dom';

export interface TruncationTooltipState {
  text: string;
  top: number;
  left: number;
  width: number;
}

interface TruncationTooltipProps {
  state: TruncationTooltipState | null;
}

/**
 * Tiny portal-based tooltip — same visual style as the existing
 * TruncateWithText utility. Lives at the body root so the tooltip never
 * clips under the table or its parent's `overflow: hidden`.
 */
export function TruncationTooltip({ state }: TruncationTooltipProps) {
  if (!state) return null;

  return createPortal(
    <div
      role="tooltip"
      className="fixed z-[10000] px-2 py-1 text-xs text-white bg-gray-900 rounded-lg shadow-lg pointer-events-none break-words"
      style={{
        top: state.top,
        left: state.left,
        maxWidth: Math.max(state.width, 280),
        transform: 'translateY(-100%)',
      }}
    >
      {state.text}
    </div>,
    document.body
  );
}
