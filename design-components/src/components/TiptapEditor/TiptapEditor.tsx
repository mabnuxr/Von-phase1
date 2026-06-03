import React, { useCallback, useEffect, useRef } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Markdown } from 'tiptap-markdown';
import type { TiptapEditorProps } from './types';
import { CustomListItem, MarkdownLink } from './extensions';

// Helper to get markdown from editor with runtime safety check
function getMarkdown(editor: Editor): string {
  const storage = editor.storage as unknown as Record<string, unknown>;
  const markdownStorage = storage?.markdown as { getMarkdown?: () => string } | undefined;

  if (markdownStorage?.getMarkdown) {
    return markdownStorage.getMarkdown();
  }

  return editor.getHTML();
}

/**
 * TiptapEditor - A rich text editor with Slack-like functionality
 *
 * Features:
 * - Bold, italic, underline, strikethrough
 * - Inline code and code blocks
 * - Bulleted and numbered lists
 * - Task lists with checkboxes
 * - Links (auto-detect and manual)
 * - Blockquotes
 * - Headings
 * - Markdown paste support
 * - Keyboard shortcuts (Cmd/Ctrl+B for bold, etc.)
 */
export const TiptapEditor: React.FC<TiptapEditorProps> = ({
  content,
  onChange,
  onSubmit,
  placeholder = 'Type a message...',
  disabled = false,
  editorRef,
  onPasteFiles,
  onEscape,
  additionalExtensions = [],
}) => {
  // Track whether changes originate from the editor (user typing) vs external
  // content prop updates. This prevents the content sync effect from calling
  // setContent after every keystroke, which would destroy suggestion plugin state.
  const isInternalChangeRef = useRef(false);

  // Holds the current placeholder so the Placeholder extension's
  // function-form callback reads the latest value on each decoration
  // pass — Tiptap captures the string form in plugin state at
  // creation, so prop changes are otherwise ignored.
  const placeholderRef = useRef(placeholder);
  useEffect(() => {
    placeholderRef.current = placeholder;
  }, [placeholder]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        codeBlock: {
          HTMLAttributes: {
            class: 'code-block',
          },
        },
        code: {
          HTMLAttributes: {
            class: 'inline-code',
          },
        },
        blockquote: {
          HTMLAttributes: {
            class: 'blockquote',
          },
        },
        bulletList: {
          HTMLAttributes: {
            class: 'bullet-list',
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: 'ordered-list',
          },
        },
        // Disable default listItem to use our custom one with Shift+Enter support
        listItem: false,
      }),
      CustomListItem.configure({
        HTMLAttributes: {
          class: 'list-item',
        },
      }),
      Underline,
      TextStyle,
      Color,
      MarkdownLink.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'editor-link',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
        autolink: true,
      }),
      TaskList.configure({
        HTMLAttributes: {
          class: 'task-list',
        },
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: 'task-item',
        },
      }),
      Placeholder.configure({
        // Function form so the extension re-reads the latest value on
        // every decoration pass — letting callers swap the copy at
        // runtime (e.g. "Close version history to chat" while a
        // sibling panel is open).
        placeholder: () => placeholderRef.current,
        emptyEditorClass: 'is-editor-empty',
        // Show the placeholder even when the editor is non-editable
        // (`disabled` callers use this to surface "why" copy). Default
        // is true, which hides the placeholder the moment we flip
        // editable=false.
        showOnlyWhenEditable: false,
      }),
      Markdown.configure({
        html: true,
        tightLists: true,
        tightListClass: 'tight',
        bulletListMarker: '-',
        linkify: true,
        breaks: true,
        transformPastedText: true,
        transformCopiedText: false,
      }),
      ...additionalExtensions,
    ],
    content,
    editorProps: {
      attributes: {
        class: 'tiptap-editor',
      },
      // Strip <span> tags from pasted HTML that TipTap can't map to its schema.
      // When copying from Streamdown, the browser inlines computed styles on every
      // element, so we identify Streamdown spans by their data-streamdown attribute.
      // Spans with an explicit style but no data-streamdown (e.g. user-pasted
      // colored text) are preserved for the TextStyle/Color extensions.
      transformPastedHTML: (html: string) => {
        try {
          const doc = new DOMParser().parseFromString(html, 'text/html');
          doc.querySelectorAll('span').forEach((span) => {
            span.replaceWith(...Array.from(span.childNodes));
          });
          return doc.body.innerHTML;
        } catch {
          return html;
        }
      },
      handlePaste: (_view, event) => {
        const files = Array.from(event.clipboardData?.files || []);
        if (files.length > 0) {
          event.preventDefault();
          onPasteFiles?.(files);
          return true;
        }
        return false;
      },
      handleKeyDown: (view, event) => {
        if (event.key === 'Escape' && onEscape) {
          const consumed = onEscape();
          if (consumed) {
            event.preventDefault();
            event.stopPropagation();
            return true;
          }
        }

        // When a suggestion plugin (e.g. @mentions) is active, let it handle
        // Enter/Arrow keys first — don't intercept for message submission.
        if (['Enter', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
          const suggestionActive = view.state.plugins.some((plugin) => {
            const state = plugin.getState(view.state);
            return state && typeof state === 'object' && 'active' in state && state.active;
          });
          if (suggestionActive) {
            return false; // Let plugins handle it
          }
        }

        // Handle Enter key for submission (Shift+Enter is handled by CustomListItem extension)
        if (event.key === 'Enter' && !event.shiftKey && onSubmit) {
          event.preventDefault();
          if (!disabled) {
            onSubmit();
          }
          return true;
        }

        // Handle Shift+Enter outside of lists - create new paragraph instead of hard break
        // This allows markdown input rules (like "- " for bullets) to work on the new line
        if (event.key === 'Enter' && event.shiftKey) {
          const { $from } = view.state.selection;
          // Check if we're inside a list item
          let isInList = false;
          for (let d = $from.depth; d > 0; d--) {
            if ($from.node(d).type.name === 'listItem') {
              isInList = true;
              break;
            }
          }
          // If not in a list, create a new paragraph instead of hard break
          if (!isInList) {
            event.preventDefault();
            // Split the current block to create a new paragraph
            const { tr } = view.state;
            const split = tr.split($from.pos);
            view.dispatch(split);
            return true;
          }
        }

        return false;
      },
    },
    onUpdate: ({ editor }) => {
      // Mark that this change is internal (user typing) so the content sync
      // effect doesn't call setContent and destroy suggestion plugin state.
      isInternalChangeRef.current = true;
      const markdown = getMarkdown(editor);
      onChange(markdown);
    },
    editable: !disabled,
  });

  // Update editorRef when editor changes
  useEffect(() => {
    if (editorRef) {
      editorRef.current = editor;
    }
  }, [editor, editorRef]);

  // Update content when controlled value changes (external updates only).
  // Reset the internal-change flag so it doesn't block future external updates,
  // then sync the editor only when the prop differs from what it already shows.
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    isInternalChangeRef.current = false;
    if (content !== getMarkdown(editor)) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Update disabled state
  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      editor.setEditable(!disabled);
    }
  }, [disabled, editor]);

  // Re-render decorations when the placeholder prop changes. The
  // Placeholder extension reads `placeholderRef.current` via its
  // function-form option (configured above), but ProseMirror won't
  // re-run decorations on its own — dispatch an empty transaction
  // so the placeholder text updates in-place.
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    editor.view.dispatch(editor.state.tr);
  }, [placeholder, editor]);

  const handleWrapperClick = useCallback(
    (e: React.MouseEvent) => {
      // Only focus editor if clicking on the wrapper itself, not on the editor content
      // This prevents interfering with text selection (double-click to select word)
      if (e.target === e.currentTarget) {
        editor?.commands.focus('end');
      }
    },
    [editor]
  );

  if (!editor) {
    return null;
  }

  return (
    <div className="tiptap-editor-wrapper w-full" onClick={handleWrapperClick}>
      <EditorContent editor={editor} />
    </div>
  );
};

export default TiptapEditor;
