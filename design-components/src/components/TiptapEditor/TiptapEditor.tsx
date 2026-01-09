import React, { useCallback, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import ListItem from '@tiptap/extension-list-item';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Markdown } from 'tiptap-markdown';
import type { TiptapEditorProps } from './types';

// Custom ListItem extension with Shift+Enter to create new list item
const CustomListItem = ListItem.extend({
  addKeyboardShortcuts() {
    return {
      'Shift-Enter': () => this.editor.commands.splitListItem(this.name),
      Tab: () => this.editor.commands.sinkListItem(this.name),
      'Shift-Tab': () => this.editor.commands.liftListItem(this.name),
    };
  },
});

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
}) => {
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
      Link.configure({
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
        placeholder,
        emptyEditorClass: 'is-editor-empty',
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
    ],
    content,
    editorProps: {
      attributes: {
        class: 'tiptap-editor',
      },
      handleKeyDown: (_view, event) => {
        // Handle Enter key for submission (Shift+Enter is handled by CustomListItem extension)
        if (event.key === 'Enter' && !event.shiftKey && onSubmit) {
          event.preventDefault();
          if (!disabled) {
            onSubmit();
          }
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
    },
    editable: !disabled,
  });

  // Update editorRef when editor changes
  useEffect(() => {
    if (editorRef) {
      editorRef.current = editor;
    }
  }, [editor, editorRef]);

  // Update content when controlled value changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Update disabled state
  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled);
    }
  }, [disabled, editor]);

  const focusEditor = useCallback(() => {
    editor?.commands.focus('end');
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="tiptap-editor-wrapper w-full" onClick={focusEditor}>
      <EditorContent editor={editor} />
    </div>
  );
};

export default TiptapEditor;
