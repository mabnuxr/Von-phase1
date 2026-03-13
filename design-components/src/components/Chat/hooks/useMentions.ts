import { useState, useCallback, useMemo, useRef } from 'react';
import type { Editor, Extension, JSONContent } from '@tiptap/react';
import type { SuggestionProps } from '@tiptap/suggestion';
import type { MentionItem } from '../../Mentions/types';
import {
  MentionChip,
  createMentionSuggestion,
  INITIAL_SUGGESTION_STATE,
} from '../../TiptapEditor/extensions';
import type { MentionSuggestionState } from '../../TiptapEditor/extensions';

export interface UseMentionsOptions {
  enableMentions: boolean;
  mentionItems: MentionItem[];
  isLoadingMentions: boolean;
  onSelectMention?: (item: MentionItem) => void;
  /** Called when the user first types "@" — use to lazy-load mention items */
  onMentionsActivated?: () => void;
}

export interface UseMentionsReturn {
  /** Tiptap extension to inject via additionalExtensions */
  mentionExtension: Extension | null;
  /** State for rendering MentionsOverlay */
  suggestionState: MentionSuggestionState;
  /** Filtered items based on current query */
  filteredItems: MentionItem[];
  /** Keyboard-highlighted index */
  highlightedIndex: number;
  /** Set highlighted index (for mouse hover sync) */
  setHighlightedIndex: (index: number) => void;
  /** Handle mention selection from overlay click */
  handleSelectMention: (item: MentionItem) => void;
  /** Handle overlay close (Escape / click outside) */
  handleCloseMentionsList: () => void;
  /** Extract all mentions from editor doc at send time */
  extractMentions: (editor: Editor | null) => MentionItem[];
}

/**
 * Case-insensitive substring match on item name.
 */
function filterItems(items: MentionItem[], search: string): MentionItem[] {
  if (!search) return items;
  const lower = search.toLowerCase().trim();
  return items.filter((item) => item.name.toLowerCase().includes(lower));
}

/**
 * Unified hook for @ mention functionality.
 *
 * Replaces useMentionInputState + useMentionsKeyboardNav by leveraging
 * Tiptap's built-in suggestion plugin for "@" detection, overlay lifecycle,
 * keyboard navigation, and Escape handling.
 *
 * The existing MentionsOverlay component is reused as the dropdown UI.
 */
export function useMentions({
  enableMentions,
  mentionItems,
  onSelectMention,
  onMentionsActivated,
}: UseMentionsOptions): UseMentionsReturn {
  const [suggestionState, setSuggestionState] =
    useState<MentionSuggestionState>(INITIAL_SUGGESTION_STATE);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // Refs for values accessed inside the suggestion bridge callbacks
  // (avoids stale closures since the suggestion config is memoized)
  const highlightedIndexRef = useRef(-1);
  const onMentionsActivatedRef = useRef(onMentionsActivated);
  onMentionsActivatedRef.current = onMentionsActivated;
  const filteredItemsRef = useRef<MentionItem[]>([]);
  const onSelectMentionRef = useRef(onSelectMention);
  onSelectMentionRef.current = onSelectMention;

  // Keep highlightedIndexRef in sync
  highlightedIndexRef.current = highlightedIndex;

  // Filter items by current query
  const filteredItems = useMemo(
    () => filterItems(mentionItems, suggestionState.query),
    [mentionItems, suggestionState.query]
  );
  filteredItemsRef.current = filteredItems;

  // Reset highlight when query changes
  const prevQueryRef = useRef(suggestionState.query);
  if (prevQueryRef.current !== suggestionState.query) {
    prevQueryRef.current = suggestionState.query;
    highlightedIndexRef.current = -1;
    setHighlightedIndex(-1);
  }

  // Command ref used by the suggestion bridge to insert mention into editor.
  // Stored via the onSelect callback from Tiptap's suggestion plugin.
  const suggestionCommandRef = useRef<
    ((props: { id: string; label: string; mentionType: string; version: number }) => void) | null
  >(null);

  const handleOverlaySelect = useCallback((item: MentionItem) => {
    // Use Tiptap's suggestion command if available (inserts node into editor)
    if (suggestionCommandRef.current) {
      suggestionCommandRef.current({
        id: item.id,
        label: item.name,
        mentionType: item.type,
        version: item.version,
      });
      suggestionCommandRef.current = null;
    }
    onSelectMentionRef.current?.(item);
  }, []);

  const handleCloseMentionsList = useCallback(() => {
    setSuggestionState(INITIAL_SUGGESTION_STATE);
    setHighlightedIndex(-1);
  }, []);

  // Build the Tiptap extension with suggestion config
  const mentionExtension = useMemo(() => {
    if (!enableMentions) return null;

    const suggestion = createMentionSuggestion({
      onStateChange: (state) => {
        if (state.isOpen) {
          onMentionsActivatedRef.current?.();
        }
        setSuggestionState(state);
        if (!state.isOpen) {
          setHighlightedIndex(-1);
        }
      },
      getFilteredItems: () => filteredItemsRef.current,
      getHighlightedIndex: () => highlightedIndexRef.current,
      setHighlightedIndex: (idx) => {
        highlightedIndexRef.current = idx;
        setHighlightedIndex(idx);
      },
      onSelect: handleOverlaySelect,
    });

    // Extend the suggestion config to capture the command function
    const originalRender = suggestion.render!;
    suggestion.render = () => {
      const renderer = originalRender();
      return {
        ...renderer,
        onStart(props: SuggestionProps<MentionItem>) {
          suggestionCommandRef.current = props.command;
          renderer.onStart?.(props);
        },
        onUpdate(props: SuggestionProps<MentionItem>) {
          suggestionCommandRef.current = props.command;
          renderer.onUpdate?.(props);
        },
      };
    };
    return MentionChip.configure({
      HTMLAttributes: { class: 'mention-chip' },
      renderText({ node }: { node: { attrs: { label?: string } } }) {
        return `@${node.attrs.label ?? ''}`;
      },
      suggestion,
    }) as Extension;
  }, [enableMentions, handleOverlaySelect]);

  const extractMentions = useCallback((editor: Editor | null): MentionItem[] => {
    if (!editor) return [];
    const json = editor.getJSON();
    const mentions: MentionItem[] = [];
    const queue: JSONContent[] = json.content ? [...json.content] : [];
    while (queue.length > 0) {
      const node = queue.shift()!;
      if (node.type === 'mention' && node.attrs) {
        mentions.push({
          id: node.attrs.id,
          name: node.attrs.label,
          type: node.attrs.mentionType,
          version: node.attrs.version,
        });
      }
      if (node.content) {
        queue.push(...node.content);
      }
    }
    return mentions;
  }, []);

  return {
    mentionExtension,
    suggestionState,
    filteredItems,
    highlightedIndex,
    setHighlightedIndex,
    handleSelectMention: handleOverlaySelect,
    handleCloseMentionsList,
    extractMentions,
  };
}
