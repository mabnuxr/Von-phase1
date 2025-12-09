import { useEditor, EditorContent, ReactRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import Placeholder from "@tiptap/extension-placeholder";
import Mention from "@tiptap/extension-mention";
import type { SuggestionProps, SuggestionKeyDownProps } from "@tiptap/suggestion";
import { useState, useCallback, forwardRef, useImperativeHandle } from "react";
import { useOpportunityFields } from "../hooks/useSalesforceOpportunityFields";
import {
  TextBolderIcon,
  TextItalicIcon,
  TextUnderlineIcon,
  ListBulletsIcon,
  ListNumbersIcon,
  TableIcon,
  TextHOneIcon,
  TextHTwoIcon,
  TextHThreeIcon,
  CodeIcon,
  QuotesIcon,
} from "@phosphor-icons/react";

interface MentionListProps {
  items: string[];
  command: (props: { id: string }) => void;
  selectedIndex: number;
}

// Mention list component for Salesforce fields
const MentionList = forwardRef<
  { onKeyDown: (props: SuggestionKeyDownProps) => boolean },
  MentionListProps
>((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(props.selectedIndex || 0);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command({ id: item });
    }
  };

  const upHandler = () => {
    setSelectedIndex(
      (selectedIndex + props.items.length - 1) % props.items.length,
    );
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: SuggestionKeyDownProps) => {
      if (event.key === "ArrowUp") {
        upHandler();
        return true;
      }

      if (event.key === "ArrowDown") {
        downHandler();
        return true;
      }

      if (event.key === "Enter") {
        enterHandler();
        return true;
      }

      return false;
    },
  }));

  if (props.items.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 text-sm text-gray-500">
        No Salesforce fields found
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden max-h-60 overflow-y-auto">
      {props.items.map((item, index) => (
        <button
          key={item}
          onClick={() => selectItem(index)}
          className={`w-full text-left px-3 py-2 text-sm cursor-pointer transition-colors ${
            index === selectedIndex
              ? "bg-indigo-50 text-indigo-700"
              : "text-gray-700 hover:bg-gray-50"
          }`}
        >
          <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono">
            {item}
          </code>
        </button>
      ))}
    </div>
  );
});

MentionList.displayName = "MentionList";

interface OrgContextEditorProps {
  content: string;
  onChange: (content: string) => void;
  isEditing: boolean;
  placeholder?: string;
}

export function OrgContextEditor({
  content,
  onChange,
  isEditing,
  placeholder = "Start typing...",
}: OrgContextEditorProps) {
  const { data: salesforceFields = [] } = useOpportunityFields();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
      Placeholder.configure({
        placeholder,
      }),
      Mention.configure({
        HTMLAttributes: {
          class:
            "mention-chip bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded text-sm font-mono inline-flex items-center",
        },
        suggestion: {
          char: "@",
          items: ({ query }: { query: string }) => {
            return salesforceFields
              .filter((field) =>
                field.toLowerCase().includes(query.toLowerCase()),
              )
              .slice(0, 10);
          },
          render: () => {
            let component: ReactRenderer<
              { onKeyDown: (props: SuggestionKeyDownProps) => boolean },
              MentionListProps
            > | null = null;
            let popup: HTMLElement | null = null;

            return {
              onStart: (props: SuggestionProps<string>) => {
                popup = document.createElement("div");
                popup.className = "mention-popup";
                popup.style.position = "absolute";
                popup.style.zIndex = "1000";

                const rect = props.clientRect?.();
                if (rect) {
                  popup.style.left = `${rect.left}px`;
                  popup.style.top = `${rect.bottom + 4}px`;
                }

                document.body.appendChild(popup);

                component = new ReactRenderer(MentionList, {
                  props: {
                    items: props.items,
                    command: props.command,
                    selectedIndex: 0,
                  },
                  editor: props.editor,
                });

                popup.appendChild(component.element);
              },

              onUpdate: (props: SuggestionProps<string>) => {
                if (component) {
                  component.updateProps({
                    items: props.items,
                    command: props.command,
                  });
                }

                if (popup) {
                  const rect = props.clientRect?.();
                  if (rect) {
                    popup.style.left = `${rect.left}px`;
                    popup.style.top = `${rect.bottom + 4}px`;
                  }
                }
              },

              onKeyDown: (props: SuggestionKeyDownProps) => {
                if (props.event.key === "Escape") {
                  if (popup) {
                    popup.remove();
                    popup = null;
                  }
                  if (component) {
                    component.destroy();
                    component = null;
                  }
                  return true;
                }

                return component?.ref?.onKeyDown(props) ?? false;
              },

              onExit: () => {
                if (popup) {
                  popup.remove();
                  popup = null;
                }
                if (component) {
                  component.destroy();
                  component = null;
                }
              },
            };
          },
        },
      }),
    ],
    content: content || "",
    editable: isEditing,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: `prose prose-sm max-w-none focus:outline-none min-h-[200px] ${
          isEditing ? "cursor-text" : "cursor-default"
        }`,
      },
    },
  });

  // Update editable state when isEditing changes
  if (editor && editor.isEditable !== isEditing) {
    editor.setEditable(isEditing);
  }

  // Update content when it changes externally
  if (editor && content !== editor.getHTML() && !editor.isFocused) {
    editor.commands.setContent(content || "");
  }

  const ToolbarButton = useCallback(
    ({
      onClick,
      active,
      disabled,
      children,
      title,
    }: {
      onClick: () => void;
      active?: boolean;
      disabled?: boolean;
      children: React.ReactNode;
      title: string;
    }) => (
      <button
        onClick={onClick}
        disabled={disabled}
        title={title}
        className={`p-1.5 rounded transition-colors cursor-pointer ${
          active
            ? "bg-gray-200 text-gray-900"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        {children}
      </button>
    ),
    [],
  );

  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar - only shown in edit mode */}
      {isEditing && (
        <div className="flex items-center gap-0.5 px-3 py-2 border-b border-gray-200 bg-gray-50 flex-wrap">
          {/* Headings */}
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            active={editor.isActive("heading", { level: 1 })}
            title="Heading 1"
          >
            <TextHOneIcon size={18} weight="bold" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            active={editor.isActive("heading", { level: 2 })}
            title="Heading 2"
          >
            <TextHTwoIcon size={18} weight="bold" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            active={editor.isActive("heading", { level: 3 })}
            title="Heading 3"
          >
            <TextHThreeIcon size={18} weight="bold" />
          </ToolbarButton>

          <div className="w-px h-5 bg-gray-300 mx-1" />

          {/* Text formatting */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive("bold")}
            title="Bold"
          >
            <TextBolderIcon size={18} weight="bold" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive("italic")}
            title="Italic"
          >
            <TextItalicIcon size={18} weight="bold" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            active={editor.isActive("underline")}
            title="Underline"
          >
            <TextUnderlineIcon size={18} weight="bold" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            active={editor.isActive("code")}
            title="Code"
          >
            <CodeIcon size={18} weight="bold" />
          </ToolbarButton>

          <div className="w-px h-5 bg-gray-300 mx-1" />

          {/* Lists */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive("bulletList")}
            title="Bullet List"
          >
            <ListBulletsIcon size={18} weight="bold" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive("orderedList")}
            title="Numbered List"
          >
            <ListNumbersIcon size={18} weight="bold" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive("blockquote")}
            title="Quote"
          >
            <QuotesIcon size={18} weight="bold" />
          </ToolbarButton>

          <div className="w-px h-5 bg-gray-300 mx-1" />

          {/* Table */}
          <ToolbarButton
            onClick={() =>
              editor
                .chain()
                .focus()
                .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                .run()
            }
            title="Insert Table"
          >
            <TableIcon size={18} weight="bold" />
          </ToolbarButton>

          {/* Mention hint */}
          <div className="ml-auto text-xs text-gray-400">
            Type <code className="bg-gray-200 px-1 rounded">@</code> to mention
            a Salesforce field
          </div>
        </div>
      )}

      {/* Editor content */}
      <div
        className={`flex-1 overflow-y-auto px-4 py-4 bg-white`}
      >
        <EditorContent editor={editor} />
      </div>

      {/* Styles for TipTap */}
      <style>{`
        .ProseMirror {
          min-height: 200px;
          font-size: 0.8125rem;
          line-height: 1.5;
        }

        .ProseMirror p {
          margin: 0.375rem 0;
        }

        .ProseMirror p.is-editor-empty:first-child::before {
          color: #adb5bd;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }

        .ProseMirror table {
          border-collapse: collapse;
          margin: 0.75rem 0;
          overflow: hidden;
          table-layout: fixed;
          width: 100%;
          font-size: 0.75rem;
        }

        .ProseMirror td,
        .ProseMirror th {
          border: 1px solid #e5e7eb;
          box-sizing: border-box;
          min-width: 1em;
          padding: 0.375rem 0.5rem;
          position: relative;
          vertical-align: top;
        }

        .ProseMirror th {
          background-color: #f9fafb;
          font-weight: 600;
          text-align: left;
        }

        .ProseMirror .selectedCell:after {
          background: rgba(99, 102, 241, 0.1);
          content: "";
          left: 0;
          right: 0;
          top: 0;
          bottom: 0;
          pointer-events: none;
          position: absolute;
          z-index: 2;
        }

        .ProseMirror h1 {
          font-size: 1.125rem;
          font-weight: 700;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
        }

        .ProseMirror h2 {
          font-size: 1rem;
          font-weight: 600;
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
        }

        .ProseMirror h3 {
          font-size: 0.9375rem;
          font-weight: 600;
          margin-top: 0.75rem;
          margin-bottom: 0.375rem;
        }

        .ProseMirror ul,
        .ProseMirror ol {
          padding-left: 1.25rem;
          margin: 0.375rem 0;
        }

        .ProseMirror li {
          margin: 0.125rem 0;
        }

        .ProseMirror blockquote {
          border-left: 2px solid #e5e7eb;
          margin: 0.5rem 0;
          padding-left: 0.75rem;
          color: #6b7280;
          font-size: 0.8125rem;
        }

        .ProseMirror code {
          background-color: #f3f4f6;
          border-radius: 0.25rem;
          color: #111827;
          font-family: monospace;
          font-size: 0.75rem;
          padding: 0.125rem 0.25rem;
        }

        .ProseMirror pre {
          background-color: #1f2937;
          border-radius: 0.375rem;
          color: #f9fafb;
          font-family: monospace;
          padding: 0.75rem;
          margin: 0.5rem 0;
          font-size: 0.75rem;
        }

        .ProseMirror pre code {
          background: none;
          color: inherit;
          font-size: 0.75rem;
          padding: 0;
        }

        .mention-chip {
          background-color: #e0e7ff;
          color: #3730a3;
          padding: 0.0625rem 0.25rem;
          border-radius: 0.1875rem;
          font-size: 0.75rem;
          font-family: monospace;
          display: inline;
        }
      `}</style>
    </div>
  );
}

export default OrgContextEditor;
