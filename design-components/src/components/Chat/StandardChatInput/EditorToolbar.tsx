import React from 'react';
import type { Editor } from '@tiptap/react';
import {
  TextB,
  TextItalic,
  TextStrikethrough,
  Code,
  Link as LinkIcon,
  ListBullets,
  ListNumbers,
  Quotes,
} from '@phosphor-icons/react';

interface EditorToolbarProps {
  editor: Editor | null;
}

/**
 * EditorToolbar - Formatting toolbar for Tiptap editor (Slack-style)
 *
 * Features:
 * - Bold, italic, strikethrough
 * - Inline code
 * - Link
 * - Bulleted and numbered lists
 * - Blockquote
 */
export const EditorToolbar: React.FC<EditorToolbarProps> = ({ editor }) => {
  if (!editor) {
    return null;
  }

  const ToolbarButton: React.FC<{
    onClick: () => void;
    isActive?: boolean;
    icon: React.ReactNode;
    title: string;
  }> = ({ onClick, isActive, icon, title }) => (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={`p-1.5 rounded hover:bg-gray-100 transition-colors ${
        isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-600'
      }`}
      title={title}
    >
      {icon}
    </button>
  );

  return (
    <div className="flex items-center gap-1 px-3 py-2 border-t border-gray-100">
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        icon={<TextB size={16} weight="bold" />}
        title="Bold (Cmd/Ctrl+B)"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        icon={<TextItalic size={16} weight="bold" />}
        title="Italic (Cmd/Ctrl+I)"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
        icon={<TextStrikethrough size={16} weight="bold" />}
        title="Strikethrough"
      />

      <div className="w-px h-4 bg-gray-200 mx-1" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive('code')}
        icon={<Code size={16} weight="bold" />}
        title="Inline code (Cmd/Ctrl+E)"
      />

      <div className="w-px h-4 bg-gray-200 mx-1" />

      <ToolbarButton
        onClick={() => {
          const url = window.prompt('Enter URL:');
          if (url) {
            editor.chain().focus().setLink({ href: url }).run();
          }
        }}
        isActive={editor.isActive('link')}
        icon={<LinkIcon size={16} weight="bold" />}
        title="Add link"
      />

      <div className="w-px h-4 bg-gray-200 mx-1" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        icon={<ListBullets size={16} weight="bold" />}
        title="Bullet list"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        icon={<ListNumbers size={16} weight="bold" />}
        title="Numbered list"
      />

      <div className="w-px h-4 bg-gray-200 mx-1" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive('blockquote')}
        icon={<Quotes size={16} weight="bold" />}
        title="Blockquote"
      />
    </div>
  );
};

export default EditorToolbar;
