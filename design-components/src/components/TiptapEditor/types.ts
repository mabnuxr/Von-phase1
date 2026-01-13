import type { Editor } from '@tiptap/react';

export interface TiptapEditorProps {
  /** Initial or controlled content (HTML string) */
  content: string;
  /** Callback when content changes */
  onChange: (content: string) => void;
  /** Callback when Enter is pressed (without Shift) */
  onSubmit?: () => void;
  /** Placeholder text when editor is empty */
  placeholder?: string;
  /** Whether the editor is disabled */
  disabled?: boolean;
  /** Ref to access the editor instance */
  editorRef?: React.RefObject<Editor | null>;
}

export interface EditorToolbarProps {
  /** The Tiptap editor instance */
  editor: Editor | null;
}
