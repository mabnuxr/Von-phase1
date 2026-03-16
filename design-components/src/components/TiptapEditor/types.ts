import type { Editor, Extension } from '@tiptap/react';

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
  /** Callback when files are pasted from clipboard */
  onPasteFiles?: (files: File[]) => void;
  /** Callback when Escape is pressed. Return true to consume the event. */
  onEscape?: () => boolean;
  /** Extra Tiptap extensions to inject (e.g. mention chip) */
  additionalExtensions?: Extension[];
}

export interface EditorToolbarProps {
  /** The Tiptap editor instance */
  editor: Editor | null;
}
