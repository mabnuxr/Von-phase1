/**
 * MentionsOverlay
 *
 * Displays the "@" mention dropdown, anchored near the "@" caret position.
 * Purely presentational — data and callbacks come from props.
 */

import React from 'react';
import type { MentionItem } from './types';
import { MentionsList } from './MentionsList';
import { AnchoredPopup } from '../AnchoredPopup';

export interface MentionsOverlayProps {
  /** Whether the mentions dropdown is visible */
  showMentionsList: boolean;
  /** Filtered items to display */
  items: MentionItem[];
  /** Loading state */
  isLoading?: boolean;
  /** Called when user selects a mention */
  onSelect: (item: MentionItem) => void;
  /** Called to dismiss the dropdown */
  onClose: () => void;
  /** Keyboard-highlighted item index */
  highlightedIndex?: number;
  /** Called on mouse hover to sync with keyboard nav */
  onHoverIndex?: (index: number) => void;
  /** Anchor position (caret coordinates) */
  anchorRect?: { left: number; top: number; bottom: number } | null;
}

export const MentionsOverlay: React.FC<MentionsOverlayProps> = ({
  showMentionsList,
  items,
  isLoading = false,
  onSelect,
  highlightedIndex = -1,
  onHoverIndex,
  anchorRect,
}) => {
  if (!showMentionsList) return null;

  return (
    <AnchoredPopup isOpen={showMentionsList} anchorRect={anchorRect ?? undefined} className="z-50">
      {({ maxHeight }) => (
        <MentionsList
          items={items}
          isLoading={isLoading}
          onSelect={onSelect}
          maxHeight={maxHeight}
          highlightedIndex={highlightedIndex}
          onHoverIndex={onHoverIndex}
        />
      )}
    </AnchoredPopup>
  );
};
