import { useRef } from "react";
import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  tablePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
  markdownShortcutPlugin,
  BoldItalicUnderlineToggles,
  InsertTable,
  ListsToggle,
  linkPlugin,
  linkDialogPlugin,
  CreateLink,
  type MDXEditorMethods,
} from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";
import { MEMORY_CONTEXT_LIMITS } from "../types/memoryContext";

interface OrgContextEditorProps {
  content: string;
  onChange: (content: string) => void;
  isEditing: boolean;
  placeholder?: string;
  contentKey?: string;
}

// Escape angle brackets to prevent MDX from treating them as JSX tags
function escapeAngleBrackets(text: string): string {
  return text.replace(/</g, "\\<").replace(/>/g, "\\>");
}

// Unescape angle brackets when returning content
function unescapeAngleBrackets(text: string): string {
  return text.replace(/\\</g, "<").replace(/\\>/g, ">");
}

export function OrgContextEditor({
  content,
  onChange,
  isEditing,
  placeholder = "Start typing...",
  contentKey,
}: OrgContextEditorProps) {
  const editorRef = useRef<MDXEditorMethods>(null);

  // Escape content for MDXEditor display
  const escapedContent = escapeAngleBrackets(content || "");

  // Handle onChange to unescape before passing back, with character limit enforcement
  const handleChange = (value: string) => {
    const unescapedValue = unescapeAngleBrackets(value);
    // Trim to limit if exceeded rather than blocking
    if (unescapedValue.length > MEMORY_CONTEXT_LIMITS.value) {
      onChange(unescapedValue.slice(0, MEMORY_CONTEXT_LIMITS.value));
    } else {
      onChange(unescapedValue);
    }
  };

  return (
    <div className="flex flex-col h-full org-context-editor">
      <MDXEditor
        key={contentKey}
        ref={editorRef}
        markdown={escapedContent}
        onChange={handleChange}
        readOnly={!isEditing}
        placeholder={placeholder}
        contentEditableClassName="prose prose-sm max-w-none min-h-[200px] focus:outline-none px-4 py-3"
        plugins={[
          headingsPlugin({ allowedHeadingLevels: [1, 2, 3] }),
          listsPlugin(),
          quotePlugin(),
          tablePlugin(),
          thematicBreakPlugin(),
          linkPlugin(),
          linkDialogPlugin(),
          markdownShortcutPlugin(),
          toolbarPlugin({
            toolbarContents: () =>
              isEditing ? (
                <div className="flex items-center gap-1">
                  <BoldItalicUnderlineToggles />
                  <div className="w-px h-4 bg-gray-200 mx-1" />
                  <ListsToggle />
                  <div className="w-px h-4 bg-gray-200 mx-1" />
                  <InsertTable />
                  <CreateLink />
                </div>
              ) : null,
          }),
        ]}
      />

      {/* Custom styles for MDXEditor */}
      <style>{`
        .org-context-editor .mdxeditor {
          font-size: 0.8125rem;
          line-height: 1.5;
          height: 100%;
          display: flex;
          flex-direction: column;
          border: none;
          border-radius: 0.5rem;
          background: white;
        }

        .org-context-editor .mdxeditor-root-contenteditable {
          flex: 1;
          overflow-y: auto;
          border: none;
        }

        .org-context-editor [data-lexical-editor="true"] {
          min-height: 200px;
        }

        .org-context-editor .mdxeditor-toolbar {
          background: transparent;
          border-bottom: none;
          padding: 0.5rem;
          display: flex;
          justify-content: center;
        }

        .org-context-editor .mdxeditor p {
          margin: 0.375rem 0;
        }

        .org-context-editor .mdxeditor h1 {
          font-size: 1.125rem;
          font-weight: 700;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
        }

        .org-context-editor .mdxeditor h2 {
          font-size: 1rem;
          font-weight: 600;
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
        }

        .org-context-editor .mdxeditor h3 {
          font-size: 0.9375rem;
          font-weight: 600;
          margin-top: 0.75rem;
          margin-bottom: 0.375rem;
        }

        .org-context-editor .mdxeditor ul {
          padding-left: 1.25rem;
          margin: 0.375rem 0;
          list-style-type: disc;
        }

        .org-context-editor .mdxeditor ol {
          padding-left: 1.25rem;
          margin: 0.375rem 0;
          list-style-type: decimal;
        }

        .org-context-editor .mdxeditor li {
          margin: 0.125rem 0;
          display: list-item;
        }

        .org-context-editor .mdxeditor blockquote {
          border-left: 2px solid #e5e7eb;
          margin: 0.5rem 0;
          padding-left: 0.75rem;
          color: #6b7280;
          font-size: 0.8125rem;
        }

        .org-context-editor .mdxeditor table {
          border-collapse: collapse;
          margin: 0.75rem 0;
          width: 100%;
          font-size: 0.75rem;
        }

        .org-context-editor .mdxeditor td,
        .org-context-editor .mdxeditor th {
          border: 1px solid #e5e7eb;
          padding: 0.375rem 0.5rem;
          text-align: left;
        }

        .org-context-editor .mdxeditor th {
          background-color: #f9fafb;
          font-weight: 600;
        }

        .org-context-editor .mdxeditor a {
          color: #4f46e5;
          text-decoration: underline;
        }

        .org-context-editor .mdxeditor code {
          background-color: #f3f4f6;
          border-radius: 0.25rem;
          color: #111827;
          font-family: monospace;
          font-size: 0.75rem;
          padding: 0.125rem 0.25rem;
        }

        /* Placeholder styles */
        .org-context-editor .mdxeditor [data-placeholder]::before {
          color: #adb5bd;
          content: attr(data-placeholder);
          pointer-events: none;
        }

        /* Read-only mode styles */
        .org-context-editor .mdxeditor[data-readonly="true"] [data-lexical-editor="true"] {
          cursor: default;
        }
      `}</style>
    </div>
  );
}

export default OrgContextEditor;
