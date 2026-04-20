import { useState, useCallback, useMemo, useRef } from 'react';
import type { Editor, Extension, JSONContent } from '@tiptap/react';
import type { SuggestionProps } from '@tiptap/suggestion';
import type { MentionItem } from '../../Mentions/types';
import { MentionItemType } from '../../Mentions/constants';
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
  /**
   * Widget mentions added by the user (e.g. via the Add-to-Chat widget icon).
   * Parent owns the list; this hook derives selectedMentions from it directly.
   */
  widgetMentions?: MentionItem[];
  /**
   * Called when a widget chip is removed via its X button. Parent is expected
   * to drop the widget from its source list, which removes it from the derived
   * selectedMentions on the next render.
   */
  onWidgetMentionRemoved?: (args: { id: string }) => void;
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
  /** Whether a dashboard mention is already selected (limit: 1 per message) */
  isDashboardLimitReached: boolean;
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
  widgetMentions,
  onWidgetMentionRemoved,
}: UseMentionsOptions): UseMentionsReturn {
  const [suggestionState, setSuggestionState] =
    useState<MentionSuggestionState>(INITIAL_SUGGESTION_STATE);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // Mentions added by the user via the @ overlay. Dashboard and widget chips
  // are not stored here — they're owned by the parent and derived into
  // selectedMentions below.
  const [userMentions, setUserMentions] = useState<MentionItem[]>([]);

  // The dashboard id the user explicitly dismissed (X button). Reset when the
  // dashboard switches or the mention list is cleared after send.
  const [dismissedDashboardId, setDismissedDashboardId] = useState<string | null>(null);

  // Reset dismissal when the dashboard itself changes — render-phase state
  // update, per React docs on storing previous prop values.
  const prevDashboardIdRef = useRef<string | undefined>(dashboardMention?.id);
  if (prevDashboardIdRef.current !== dashboardMention?.id) {
    prevDashboardIdRef.current = dashboardMention?.id;
    if (dismissedDashboardId !== null) setDismissedDashboardId(null);
  }

  // selectedMentions is derived from external state (dashboard + widgets) and
  // local @-mention state. No reconciliation effect, no array diffing.
  const selectedMentions = useMemo(() => {
    const result: MentionItem[] = [];
    if (dashboardMention && dashboardMention.id !== dismissedDashboardId) {
      result.push(dashboardMention);
    }
    if (widgetMentions?.length) {
      for (const m of widgetMentions) {
        if (m.id !== dashboardMention?.id) result.push(m);
      }
    }
    for (const m of userMentions) {
      if (result.some((existing) => existing.id === m.id)) continue;
      result.push(m);
    }
    return result;
  }, [dashboardMention, dismissedDashboardId, widgetMentions, userMentions]);

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

  // A dashboard mention is already selected — block further dashboard selections
  const isDashboardLimitReached = selectedMentions.some(
    (m) => m.type === MentionItemType.Dashboard
  );

  // Filter items by current query, excluding already-selected mentions.
  // When a dashboard is currently in the viewport (dashboardMention), prioritize it first.
  const filteredItems = useMemo(() => {
    let items: MentionItem[];
    if (isDashboardLimitReached) {
      // When limit is reached, show all items (they'll render disabled)
      items = filterItems(mentionItems, suggestionState.query);
    } else {
      const selectedIds = new Set(selectedMentions.map((m) => m.id));
      const available = mentionItems.filter((item) => !selectedIds.has(item.id));
      items = filterItems(available, suggestionState.query);
    }

    // Mark and move the currently open dashboard to the top of the list
    if (dashboardMention) {
      const currentId = dashboardMention.id;
      const current = items
        .filter((item) => item.id === currentId)
        .map((item) => ({ ...item, isCurrent: true }));
      const rest = items.filter((item) => item.id !== currentId);
      items = [...current, ...rest];
    }

    return items;
  }, [
    mentionItems,
    suggestionState.query,
    selectedMentions,
    isDashboardLimitReached,
    dashboardMention,
  ]);
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

  const isDashboardLimitReachedRef = useRef(isDashboardLimitReached);
  isDashboardLimitReachedRef.current = isDashboardLimitReached;

  const handleOverlaySelect = useCallback((item: MentionItem) => {
    // Block selection when dashboard limit is reached
    if (isDashboardLimitReachedRef.current) return;

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

    // Add to user-mention list (avoid duplicates)
    setUserMentions((prev) => (prev.some((m) => m.id === item.id) ? prev : [...prev, item]));

    onSelectMentionRef.current?.(item);
  }, []);

  const onWidgetMentionRemovedRef = useRef(onWidgetMentionRemoved);
  onWidgetMentionRemovedRef.current = onWidgetMentionRemoved;

  // Keep refs synced so removeSelectedMention can route dismissals without
  // depending on changing prop identities.
  const dashboardMentionIdRef = useRef(dashboardMention?.id);
  dashboardMentionIdRef.current = dashboardMention?.id;
  const widgetMentionsRef = useRef(widgetMentions);
  widgetMentionsRef.current = widgetMentions;

  const removeSelectedMention = useCallback((id: string) => {
    if (dashboardMentionIdRef.current === id) {
      setDismissedDashboardId(id);
      return;
    }
    if (widgetMentionsRef.current?.some((m) => m.id === id)) {
      onWidgetMentionRemovedRef.current?.({ id });
      return;
    }
    setUserMentions((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const clearSelectedMentions = useCallback(() => {
    setDismissedDashboardId(null);
    setUserMentions([]);
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
    isDashboardLimitReached,
  };
}
