/**
 * TextViewer — Readonly TipTap editor for markdown and plain text artifacts
 */

import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';

interface TextViewerProps {
  text: string;
}

export const TextViewer: React.FC<TextViewerProps> = ({ text }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Markdown.configure({ html: true }),
    ],
    content: text,
    editable: false,
  });

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50/80 py-8">
      <div
        className="mx-auto bg-white rounded-sm shadow-sm border border-gray-200"
        style={{ maxWidth: '816px', minHeight: '400px' }}
      >
        <div className="px-16 py-12">
          {editor ? (
            <div className="prose prose-sm max-w-none">
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

export default TextViewer;
