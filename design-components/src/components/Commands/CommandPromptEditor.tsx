/**
 * CommandPromptEditor
 *
 * Tiptap-based prompt editor for Quick Commands. Mirrors the chat input's
 * @-mention UX: type "@" to open a dashboard picker, selected dashboards
 * surface as preview chips above the editor (the inline mention node is
 * removed after insertion, same as chat).
 *
 * The prompt is persisted as plain text. References are tracked separately
 * (no inline positions stored) — when editing an existing command, existing
 * references are restored as preview chips.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import type { Editor, Extension } from '@tiptap/react';
import type { SuggestionProps } from '@tiptap/suggestion';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { ChartBarIcon, X } from '@phosphor-icons/react';
import {
  MentionChip,
  createMentionSuggestion,
  INITIAL_SUGGESTION_STATE,
} from '../TiptapEditor/extensions';
import type { MentionSuggestionState } from '../TiptapEditor/extensions';
import { MentionsOverlay } from '../Mentions/MentionsOverlay';
import type { MentionItem } from '../Mentions/types';
import { MentionItemType } from '../Mentions/constants';
import type { CommandReference, DashboardOption } from './types';
import './CommandPromptEditor.css';

export interface CommandPromptEditorProps {
  /** Drawer open flag — used to reset editor content when reopened with a different command. */
  isOpen: boolean;
  /** Current prompt text. The editor is seeded from this on open. */
  prompt: string;
  /** Called whenever the prompt text changes (debounced via Tiptap's onUpdate). */
  onPromptChange: (next: string) => void;
  /** Currently tagged references. Rendered as preview chips above the editor. */
  references: CommandReference[];
  /** Called whenever the user adds or removes a tagged reference. */
  onReferencesChange: (next: CommandReference[]) => void;
  /** Dashboards available in the @ picker. When omitted, mentions are disabled. */
  availableDashboards?: DashboardOption[];
  /** When true, disables editing (read-only view of the command). */
  readOnly?: boolean;
  placeholder?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function dashboardToMentionItem(d: DashboardOption): MentionItem {
  return {
    id: d.dashboardId,
    name: d.dashboardName,
    type: MentionItemType.Dashboard,
    version: d.dashboardVersion,
  };
}

function mentionItemToReference(item: MentionItem): CommandReference | null {
  if (item.type !== MentionItemType.Dashboard) return null;
  return {
    refId: `dashboard-${item.id}`,
    type: 'dashboard',
    context: {
      dashboardId: item.id,
      dashboardName: item.name,
      dashboardVersion: item.version,
    },
  };
}

function filterByQuery(items: MentionItem[], query: string): MentionItem[] {
  if (!query) return items;
  const lower = query.toLowerCase().trim();
  return items.filter((item) => item.name.toLowerCase().includes(lower));
}

function removeMentionNodeById(editor: Editor, mentionId: string) {
  const { doc, tr } = editor.state;
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const CommandPromptEditor: React.FC<CommandPromptEditorProps> = ({
  prompt,
  onPromptChange,
  references,
  onReferencesChange,
  availableDashboards,
  readOnly = false,
  placeholder = '',
}) => {
  const enableMentions = availableDashboards !== undefined && !readOnly;

  // Suggestion overlay state mirrors the chat pattern.
  const [suggestionState, setSuggestionState] =
    useState<MentionSuggestionState>(INITIAL_SUGGESTION_STATE);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // Refs used inside Tiptap suggestion callbacks (to avoid stale closures since
  // the extension is memoized once at editor init).
  const editorRef = useRef<Editor | null>(null);
  const suggestionCommandRef = useRef<
    ((props: { id: string; label: string; mentionType: string; version: number }) => void) | null
  >(null);
  const filteredItemsRef = useRef<MentionItem[]>([]);
  const highlightedIndexRef = useRef(-1);
  highlightedIndexRef.current = highlightedIndex;
  const referencesRef = useRef(references);
  referencesRef.current = references;
  const onReferencesChangeRef = useRef(onReferencesChange);
  onReferencesChangeRef.current = onReferencesChange;

  // The full mention pool, derived from available dashboards.
  const mentionPool = useMemo<MentionItem[]>(
    () => (availableDashboards ?? []).map(dashboardToMentionItem),
    [availableDashboards]
  );

  // Items shown in the dropdown — filter by query and exclude already-selected.
  const filteredItems = useMemo<MentionItem[]>(() => {
    const selectedIds = new Set(references.map((r) => r.context.dashboardId));
    const available = mentionPool.filter((item) => !selectedIds.has(item.id));
    return filterByQuery(available, suggestionState.query);
  }, [mentionPool, references, suggestionState.query]);
  filteredItemsRef.current = filteredItems;

  // Reset highlight whenever the query changes (render-phase prev-prop pattern).
  const prevQueryRef = useRef(suggestionState.query);
  if (prevQueryRef.current !== suggestionState.query) {
    prevQueryRef.current = suggestionState.query;
    highlightedIndexRef.current = -1;
    if (highlightedIndex !== -1) setHighlightedIndex(-1);
  }

  const handleSelectMention = useCallback((item: MentionItem) => {
    // Insert via Tiptap's suggestion command so the @query text is replaced cleanly.
    if (suggestionCommandRef.current) {
      suggestionCommandRef.current({
        id: item.id,
        label: item.name,
        mentionType: item.type,
        version: item.version,
      });
      suggestionCommandRef.current = null;
    }
    // Then remove the inline node — chips are surfaced above the editor instead.
    if (editorRef.current) {
      const editor = editorRef.current;
      requestAnimationFrame(() => removeMentionNodeById(editor, item.id));
    }
    const ref = mentionItemToReference(item);
    if (!ref) return;
    if (referencesRef.current.some((r) => r.context.dashboardId === ref.context.dashboardId)) {
      return;
    }
    onReferencesChangeRef.current([...referencesRef.current, ref]);
  }, []);

  const handleCloseMentionsList = useCallback(() => {
    setSuggestionState(INITIAL_SUGGESTION_STATE);
    setHighlightedIndex(-1);
  }, []);

  // Build the mention extension once — its callbacks read live state via refs.
  const mentionExtension = useMemo<Extension | null>(() => {
    if (!enableMentions) return null;

    const suggestion = createMentionSuggestion({
      onStateChange: (state) => {
        setSuggestionState(state);
        if (!state.isOpen) setHighlightedIndex(-1);
      },
      getFilteredItems: () => filteredItemsRef.current,
      getHighlightedIndex: () => highlightedIndexRef.current,
      setHighlightedIndex: (idx) => {
        highlightedIndexRef.current = idx;
        setHighlightedIndex(idx);
      },
      onSelect: handleSelectMention,
    });

    // Capture the suggestion command + editor refs each render cycle.
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
  }, [enableMentions, handleSelectMention]);

  // Tracks whether a content change came from the editor itself (user typing)
  // vs. an external prompt-prop update. The sync effect below skips when the
  // change was internal so it doesn't reset over the user's keystrokes.
  const isInternalChangeRef = useRef(false);

  // Tiptap editor — StarterKit gives us paragraphs, history, and hard breaks.
  // We don't expose toolbar formatting; users typically just type prose here,
  // but inline shortcuts like bold/italic still work for advanced users.
  // Classes go on the ProseMirror element directly — applying styles via the
  // outer EditorContent wrapper does not propagate to the contenteditable.
  const editor = useEditor(
    {
      extensions: [
        StarterKit,
        Placeholder.configure({ placeholder, emptyEditorClass: 'is-editor-empty' }),
        ...(mentionExtension ? [mentionExtension] : []),
      ],
      content: prompt,
      editable: !readOnly,
      editorProps: {
        attributes: {
          class: 'command-prompt-editor',
        },
      },
      onUpdate: ({ editor: ed }) => {
        // Mark this as an internal change so the prompt-sync effect below
        // doesn't reset content right back over the user's keystrokes.
        isInternalChangeRef.current = true;
        onPromptChange(ed.getText());
      },
    },
    // Re-create when mention support toggles (extensions cannot be added later)
    // or when the readOnly state flips.
    [mentionExtension, readOnly]
  );

  // Sync the editor when the `prompt` prop changes externally — covers two
  // cases: the drawer opening for an existing command (form.prompt populates
  // after mount) and any other parent-driven prompt update. User keystrokes
  // set the internal-change flag in onUpdate so they don't trigger a reset.
  useEffect(() => {
    if (!editor) return;
    if (isInternalChangeRef.current) {
      isInternalChangeRef.current = false;
      return;
    }
    if (editor.getText() !== prompt) {
      editor.commands.setContent(prompt, { emitUpdate: false });
    }
  }, [editor, prompt]);

  const removeReference = useCallback((id: string) => {
    onReferencesChangeRef.current(
      referencesRef.current.filter((r) => r.context.dashboardId !== id)
    );
  }, []);

  return (
    <div className="space-y-2">
      {references.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {references.map((r) => (
            <span
              key={r.context.dashboardId}
              title={r.context.dashboardName}
              className="inline-flex items-center gap-1.5 max-w-[240px] px-2.5 py-1 rounded-xl border border-gray-200/60 bg-white shadow-xs text-[13px] text-gray-700"
            >
              <ChartBarIcon size={13} weight="regular" className="text-gray-500 shrink-0" />
              <span className="truncate">{r.context.dashboardName}</span>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => removeReference(r.context.dashboardId)}
                  className="ml-0.5 p-0.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                  aria-label={`Remove ${r.context.dashboardName}`}
                >
                  <X size={11} weight="bold" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}
      <div
        className={`w-full px-3 py-2 text-sm border border-gray-100 rounded-lg transition-all ${
          readOnly
            ? 'bg-gray-50 text-gray-600 cursor-default'
            : 'focus-within:ring-1 focus-within:ring-gray-300 focus-within:border-gray-300'
        }`}
        style={{ minHeight: 180, maxHeight: 360, overflowY: 'auto' }}
      >
        <EditorContent editor={editor} />
      </div>
      <MentionsOverlay
        showMentionsList={suggestionState.isOpen && enableMentions}
        items={filteredItems}
        onSelect={handleSelectMention}
        onClose={handleCloseMentionsList}
        highlightedIndex={highlightedIndex}
        onHoverIndex={setHighlightedIndex}
        anchorRect={suggestionState.anchorRect}
      />
    </div>
  );
};

export default CommandPromptEditor;
