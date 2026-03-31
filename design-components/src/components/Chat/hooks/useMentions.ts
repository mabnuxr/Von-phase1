import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
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
  /** Dashboard mention to auto-add (e.g. current dashboard context). Updated on dashboard switch. */
  dashboardMention?: MentionItem | null;
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
  /** Mentions selected as preview cards (shown above the editor) */
  selectedMentions: MentionItem[];
  /** Remove a selected mention card by id */
  removeSelectedMention: (id: string) => void;
  /** Clear all selected mentions (e.g. after send) */
  clearSelectedMentions: () => void;
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
 * Remove all mention nodes with a given id from a Tiptap editor.
 */
function removeMentionNodeById(editor: Editor, mentionId: string) {
  const { doc, tr } = editor.state;
  // Collect positions in reverse so deletions don't shift earlier positions
  const positions: { from: number; to: number }[] = [];
  doc.descendants((node, pos) => {
    if (node.type.name === 'mention' && node.attrs.id === mentionId) {
      positions.push({ from: pos, to: pos + node.nodeSize });
    }
  });
  for (let i = positions.length - 1; i >= 0; i--) {
    tr.delete(positions[i].from, positions[i].to);
  }
  if (positions.length > 0) {
    editor.view.dispatch(tr);
  }
}

/**
 * Unified hook for @ mention functionality.
 *
 * Replaces useMentionInputState + useMentionsKeyboardNav by leveraging
 * Tiptap's built-in suggestion plugin for "@" detection, overlay lifecycle,
 * keyboard navigation, and Escape handling.
 *
 * Selected mentions are displayed as preview cards above the editor
 * (like file attachments) rather than inline chips.
 */
export function useMentions({
  enableMentions,
  mentionItems,
  onSelectMention,
  onMentionsActivated,
  dashboardMention,
}: UseMentionsOptions): UseMentionsReturn {
  const [suggestionState, setSuggestionState] =
    useState<MentionSuggestionState>(INITIAL_SUGGESTION_STATE);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [selectedMentions, setSelectedMentions] = useState<MentionItem[]>(() =>
    dashboardMention ? [dashboardMention] : []
  );

  // Tracks whether the user explicitly dismissed the current dashboard's mention chip.
  // Prevents the effect below from re-adding it until the dashboard changes or a send clears it.
  const userDismissedDashboardRef = useRef(false);

  // Sync dashboard mention into selectedMentions on dashboard switch
  const prevDashboardIdRef = useRef(dashboardMention?.id);
  useEffect(() => {
    const prevId = prevDashboardIdRef.current;

    if (!dashboardMention) {
      // Dashboard mention cleared — remove the previous dashboard mention
      prevDashboardIdRef.current = undefined;
      userDismissedDashboardRef.current = false;
      if (prevId) {
        setSelectedMentions((prev) => prev.filter((m) => m.id !== prevId));
      }
      return;
    }

    prevDashboardIdRef.current = dashboardMention.id;

    if (prevId !== dashboardMention.id) {
      // Dashboard changed — replace old with new, reset dismissed flag
      userDismissedDashboardRef.current = false;
      setSelectedMentions((prev) => {
        const withoutOld = prev.filter((m) => m.id !== prevId && m.id !== dashboardMention.id);
        return [dashboardMention, ...withoutOld];
      });
    } else {
      // Same dashboard — only re-add if the user hasn't explicitly dismissed it
      if (!userDismissedDashboardRef.current) {
        setSelectedMentions((prev) => {
          const exists = prev.some((m) => m.id === dashboardMention.id);
          if (!exists) return [dashboardMention, ...prev];
          return prev.map((m) => (m.id === dashboardMention.id ? dashboardMention : m));
        });
      }
    }
  }, [dashboardMention]);

  // Refs for values accessed inside the suggestion bridge callbacks
  // (avoids stale closures since the suggestion config is memoized)
  const highlightedIndexRef = useRef(-1);
  const onMentionsActivatedRef = useRef(onMentionsActivated);
  onMentionsActivatedRef.current = onMentionsActivated;
  const filteredItemsRef = useRef<MentionItem[]>([]);
  const onSelectMentionRef = useRef(onSelectMention);
  onSelectMentionRef.current = onSelectMention;
  const editorRef = useRef<Editor | null>(null);

  // Keep highlightedIndexRef in sync
  highlightedIndexRef.current = highlightedIndex;

  // Filter items by current query, excluding already-selected mentions
  const filteredItems = useMemo(() => {
    const selectedIds = new Set(selectedMentions.map((m) => m.id));
    const available = mentionItems.filter((item) => !selectedIds.has(item.id));
    return filterItems(available, suggestionState.query);
  }, [mentionItems, suggestionState.query, selectedMentions]);
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
    // Use Tiptap's suggestion command to clean up the @query text
    if (suggestionCommandRef.current) {
      suggestionCommandRef.current({
        id: item.id,
        label: item.name,
        mentionType: item.type,
        version: item.version,
      });
      suggestionCommandRef.current = null;
    }

    // Remove the inline mention node that was just inserted — we show it
    // as a preview card above the editor instead.
    if (editorRef.current) {
      // Use requestAnimationFrame to ensure the node is inserted before we remove it
      requestAnimationFrame(() => {
        if (editorRef.current) {
          removeMentionNodeById(editorRef.current, item.id);
        }
      });
    }

    // Add to selected mentions (avoid duplicates)
    setSelectedMentions((prev) => (prev.some((m) => m.id === item.id) ? prev : [...prev, item]));

    onSelectMentionRef.current?.(item);
  }, []);

  const removeSelectedMention = useCallback((id: string) => {
    if (id === prevDashboardIdRef.current) {
      userDismissedDashboardRef.current = true;
    }
    setSelectedMentions((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const clearSelectedMentions = useCallback(() => {
    // Reset dismissed state on send so the context dashboard re-attaches for the next message
    userDismissedDashboardRef.current = false;
    setSelectedMentions([]);
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

    // Extend the suggestion config to capture the command function and editor ref
    const originalRender = suggestion.render!;
    suggestion.render = () => {
      const renderer = originalRender();
      return {
        ...renderer,
        onStart(props: SuggestionProps<MentionItem>) {
          suggestionCommandRef.current = props.command;
          editorRef.current = props.editor;
          renderer.onStart?.(props);
        },
        onUpdate(props: SuggestionProps<MentionItem>) {
          suggestionCommandRef.current = props.command;
          editorRef.current = props.editor;
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
    selectedMentions,
    removeSelectedMention,
    clearSelectedMentions,
  };
}
