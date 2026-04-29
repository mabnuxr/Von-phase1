import { useEffect, useRef } from "react";
import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "tiptap-markdown";
import {
  TextB,
  TextItalic,
  TextStrikethrough,
  TextUnderline,
  ListBullets,
  ListNumbers,
  Quotes,
  Code,
  Table as TableIcon,
  Minus,
  TextHOne,
  TextHTwo,
} from "@phosphor-icons/react";
import "./OrgContextEditor.css";

interface OrgContextEditorProps {
  content: string;
  onChange: (content: string) => void;
  isEditing: boolean;
  placeholder?: string;
  contentKey?: string;
}

// Type extension for markdown storage
declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    markdown: {
      getMarkdown: () => ReturnType;
    };
  }
}

// Interface for markdown storage
interface MarkdownStorage {
  markdown: {
    getMarkdown: () => string;
  };
}

// Helper to get markdown from editor
function getMarkdown(editor: Editor): string {
  return (editor.storage as unknown as MarkdownStorage).markdown.getMarkdown();
}

export function OrgContextEditor({
  content,
  onChange,
  isEditing,
  placeholder = "Start typing...",
  contentKey,
}: OrgContextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "tiptap-link",
        },
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({
        placeholder: placeholder,
      }),
      Markdown.configure({
        html: true,
        transformPastedText: true,
        transformCopiedText: true,
      }),
    ],
    content: content,
    editable: isEditing,
    onUpdate: ({ editor }) => {
      // Get markdown content from the editor
      const markdown = getMarkdown(editor);
      onChange(markdown);
    },
    editorProps: {
      attributes: {
        class: "tiptap-editor min-h-[200px] focus:outline-none px-4 py-2",
      },
    },
  });

  // Force-reset editor content whenever `contentKey` changes. This routes
  // the initial value through tiptap-markdown's parser, which the initial
  // `useEditor({ content })` call does not reliably do.
  const lastAppliedContentKey = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!editor) return;
    const keyChanged =
      contentKey !== undefined && contentKey !== lastAppliedContentKey.current;
    if (keyChanged) {
      lastAppliedContentKey.current = contentKey;
      // Place the caret at the start so the toolbar doesn't light up with
      // whatever node happens to be at the end of the document (often a list).
      editor.chain().setContent(content).setTextSelection(0).run();
      return;
    }
    // Otherwise keep the editor in sync with external `content` updates
    // without fighting the user's caret while they're typing.
    if (content !== getMarkdown(editor)) {
      editor.commands.setContent(content);
    }
  }, [content, contentKey, editor]);

  // Update editable state when isEditing changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(isEditing);
    }
  }, [isEditing, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-col h-full org-context-editor">
      {isEditing && (
        <div className="tiptap-toolbar">
          <div className="toolbar-group">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={editor.isActive("bold") ? "is-active" : ""}
              type="button"
              title="Bold (Ctrl+B)"
            >
              <TextB size={16} weight="regular" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={editor.isActive("italic") ? "is-active" : ""}
              type="button"
              title="Italic (Ctrl+I)"
            >
              <TextItalic size={16} weight="regular" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={editor.isActive("underline") ? "is-active" : ""}
              type="button"
              title="Underline (Ctrl+U)"
            >
              <TextUnderline size={16} weight="regular" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={editor.isActive("strike") ? "is-active" : ""}
              type="button"
              title="Strikethrough"
            >
              <TextStrikethrough size={16} weight="regular" />
            </button>
          </div>

          <div className="toolbar-divider" />

          <div className="toolbar-group">
            <button
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 1 }).run()
              }
              className={
                editor.isActive("heading", { level: 1 }) ? "is-active" : ""
              }
              type="button"
              title="Heading 1"
            >
              <TextHOne size={16} weight="regular" />
            </button>
            <button
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
              className={
                editor.isActive("heading", { level: 2 }) ? "is-active" : ""
              }
              type="button"
              title="Heading 2"
            >
              <TextHTwo size={16} weight="regular" />
            </button>
          </div>

          <div className="toolbar-divider" />

          <div className="toolbar-group">
            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={editor.isActive("bulletList") ? "is-active" : ""}
              type="button"
              title="Bullet List"
            >
              <ListBullets size={16} weight="regular" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={editor.isActive("orderedList") ? "is-active" : ""}
              type="button"
              title="Numbered List"
            >
              <ListNumbers size={16} weight="regular" />
            </button>
          </div>

          <div className="toolbar-divider" />

          <div className="toolbar-group">
            <button
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={editor.isActive("blockquote") ? "is-active" : ""}
              type="button"
              title="Blockquote"
            >
              <Quotes size={16} weight="regular" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              className={editor.isActive("codeBlock") ? "is-active" : ""}
              type="button"
              title="Code Block"
            >
              <Code size={16} weight="regular" />
            </button>
          </div>

          <div className="toolbar-divider" />

          <div className="toolbar-group">
            <button
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                  .run()
              }
              type="button"
              title="Insert Table"
            >
              <TableIcon size={16} weight="regular" />
            </button>
            <button
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              type="button"
              title="Horizontal Rule"
            >
              <Minus size={16} weight="regular" />
            </button>
          </div>
        </div>
      )}

      <div className="tiptap-editor-wrapper">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

export default OrgContextEditor;
