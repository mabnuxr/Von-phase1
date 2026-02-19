/**
 * TextViewer — Readonly TipTap editor for markdown and plain text artifacts
 *
 * Uses GFM extensions (tables, task lists, links) and the existing
 * .prose.markdown-body GitHub-style CSS defined in index.css.
 */

import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { Link } from '@tiptap/extension-link';
import { Markdown } from 'tiptap-markdown';

interface TextViewerProps {
  text: string;
}

export const TextViewer: React.FC<TextViewerProps> = ({ text }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5] },
      }),
      Table.configure({ resizable: false }),
      TableRow,
      TableCell,
      TableHeader,
      TaskList,
      TaskItem.configure({ nested: true }),
      Link.configure({ openOnClick: true }),
      Markdown.configure({ html: true }),
    ],
    content: text,
    editable: false,
  });

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50/80 p-4 settings-scrollbar">
      <div
        className="mx-auto bg-white rounded-sm shadow-sm border border-gray-200"
        style={{ maxWidth: '816px', minHeight: '400px' }}
      >
        <div className="px-16 py-12">
          {editor ? (
            <div className="prose markdown-body max-w-none">
              <EditorContent editor={editor} />
            </div>
          ) : (
            <pre className="text-sm text-gray-700 whitespace-pre-wrap">{text}</pre>
          )}
        </div>
      </div>
    </div>
  );
};
