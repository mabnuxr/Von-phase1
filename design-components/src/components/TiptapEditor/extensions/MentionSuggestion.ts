import type {
  SuggestionOptions,
  SuggestionProps,
  SuggestionKeyDownProps,
} from '@tiptap/suggestion';
import type { MentionItem } from '../../Mentions/types';

/**
 * State exposed to React for rendering the MentionsOverlay.
 */
export interface MentionSuggestionState {
  isOpen: boolean;
  query: string;
  /** Anchor rect for AnchoredPopup positioning */
  anchorRect: { left: number; top: number; bottom: number } | null;
}

export const INITIAL_SUGGESTION_STATE: MentionSuggestionState = {
  isOpen: false,
  query: '',
  anchorRect: null,
};

export interface CreateMentionSuggestionOptions {
  /** Called whenever suggestion state changes — drives React re-renders */
  onStateChange: (state: MentionSuggestionState) => void;
  /** Returns the current filtered items for keyboard navigation */
  getFilteredItems: () => MentionItem[];
  /** Returns the current highlighted index */
  getHighlightedIndex: () => number;
  /** Sets the highlighted index (for arrow key nav) */
  setHighlightedIndex: (index: number) => void;
  /** Called when a mention is selected via Enter key */
  onSelect: (item: MentionItem) => void;
}

/**
 * Creates a Tiptap suggestion config that bridges to React state.
 *
 * Instead of rendering its own DOM, it updates external state which
 * the existing MentionsOverlay component consumes.
 */
export function createMentionSuggestion(
  options: CreateMentionSuggestionOptions
): Partial<SuggestionOptions<MentionItem>> {
  const { onStateChange, getFilteredItems, getHighlightedIndex, setHighlightedIndex, onSelect } =
    options;

  return {
    char: '@',
    allowSpaces: false,

    // The items callback is required by the suggestion plugin but we handle
    // filtering externally via the hook. Return empty — the overlay reads
    // filteredItems from the hook state directly.
    items: () => [],

    render: () => {
      return {
        onStart(props: SuggestionProps<MentionItem>) {
          const rect = props.clientRect?.();
          onStateChange({
            isOpen: true,
            query: props.query,
            anchorRect: rect ? { left: rect.left, top: rect.top, bottom: rect.bottom } : null,
          });
        },

        onUpdate(props: SuggestionProps<MentionItem>) {
          const rect = props.clientRect?.();
          onStateChange({
            isOpen: true,
            query: props.query,
            anchorRect: rect ? { left: rect.left, top: rect.top, bottom: rect.bottom } : null,
          });
        },

        onKeyDown(props: SuggestionKeyDownProps) {
          const { event } = props;
          const items = getFilteredItems();

          if (items.length === 0) return false;

          if (event.key === 'ArrowDown') {
            const idx = getHighlightedIndex();
            const next = idx < 0 ? 0 : idx < items.length - 1 ? idx + 1 : -1;
            setHighlightedIndex(next);
            return true;
          }

          if (event.key === 'ArrowUp') {
            const idx = getHighlightedIndex();
            const next = idx <= 0 ? -1 : idx - 1;
            setHighlightedIndex(next);
            return true;
          }

          if (event.key === 'Enter') {
            const idx = getHighlightedIndex();
            if (idx >= 0 && items[idx]) {
              onSelect(items[idx]);
              return true;
            }
            return false;
          }

          // Escape is handled automatically by the suggestion plugin (calls onExit)
          if (event.key === 'Escape') {
            return true;
          }

          return false;
        },

        onExit() {
          onStateChange(INITIAL_SUGGESTION_STATE);
          setHighlightedIndex(-1);
        },
      };
    },
  };
}
