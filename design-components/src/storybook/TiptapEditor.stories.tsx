import type { Meta, StoryObj, Decorator } from '@storybook/react-vite';
import { useState, useRef } from 'react';
import { TiptapEditor, EditorToolbar } from '../components/TiptapEditor';
import type { Editor } from '@tiptap/react';

/**
 * TiptapEditorDecorator - Wraps stories in a container with proper styling
 */
const TiptapEditorDecorator: Decorator = (Story) => (
  <div
    style={{
      width: '100%',
      maxWidth: '600px',
      padding: '24px',
      backgroundColor: '#ffffff',
    }}
  >
    <Story />
  </div>
);

const meta = {
  title: 'Atoms/Display/Editor',
  component: TiptapEditor,
  decorators: [TiptapEditorDecorator],
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'light gray',
      values: [{ name: 'light gray', value: '#f5f5f5' }],
    },
  },
  tags: ['autodocs'],
  argTypes: {
    content: {
      control: 'text',
      description: 'Initial or controlled content (HTML string)',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text when editor is empty',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the editor is disabled',
    },
  },
} satisfies Meta<typeof TiptapEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Default State
// ============================================================================

/**
 * Default
 *
 * The default TiptapEditor with basic configuration.
 * Supports rich text formatting via keyboard shortcuts and markdown paste.
 */
export const Default: Story = {
  render: () => {
    const [content, setContent] = useState('');

    return (
      <div className="border border-gray-200 rounded-lg p-3">
        <TiptapEditor
          content={content}
          onChange={setContent}
          onSubmit={() => {
            console.log('Submit:', content);
            setContent('');
          }}
          placeholder="Type a message..."
        />
      </div>
    );
  },
};

// ============================================================================
// With Toolbar
// ============================================================================

/**
 * With Toolbar
 *
 * TiptapEditor with the EditorToolbar component for rich text formatting.
 * The toolbar provides buttons for common formatting options.
 */
export const WithToolbar: Story = {
  render: () => {
    const [content, setContent] = useState('');
    const editorRef = useRef<Editor | null>(null);

    return (
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-3">
          <TiptapEditor
            content={content}
            onChange={setContent}
            onSubmit={() => {
              console.log('Submit:', content);
              setContent('');
            }}
            placeholder="Type a message..."
            editorRef={editorRef}
          />
        </div>
        <EditorToolbar editor={editorRef.current} />
      </div>
    );
  },
};

// ============================================================================
// With Initial Content
// ============================================================================

/**
 * With Initial Content
 *
 * Shows the editor pre-populated with formatted content.
 */
export const WithInitialContent: Story = {
  render: () => {
    const [content, setContent] = useState(
      '<p>This is <strong>bold</strong> and <em>italic</em> text.</p><p>Here is some <code class="inline-code">inline code</code> too.</p>'
    );

    return (
      <div className="border border-gray-200 rounded-lg p-3">
        <TiptapEditor
          content={content}
          onChange={setContent}
          onSubmit={() => console.log('Submit:', content)}
          placeholder="Type a message..."
        />
      </div>
    );
  },
};

// ============================================================================
// Disabled State
// ============================================================================

/**
 * Disabled
 *
 * Shows the editor in a disabled state.
 */
export const Disabled: Story = {
  render: () => {
    const [content, setContent] = useState('<p>This content cannot be edited.</p>');

    return (
      <div className="border border-gray-200 rounded-lg p-3 opacity-60">
        <TiptapEditor
          content={content}
          onChange={setContent}
          onSubmit={() => {}}
          placeholder="Type a message..."
          disabled={true}
        />
      </div>
    );
  },
};

// ============================================================================
// Custom Placeholder
// ============================================================================

/**
 * Custom Placeholder
 *
 * Shows the editor with a custom placeholder text.
 */
export const CustomPlaceholder: Story = {
  render: () => {
    const [content, setContent] = useState('');

    return (
      <div className="border border-gray-200 rounded-lg p-3">
        <TiptapEditor
          content={content}
          onChange={setContent}
          onSubmit={() => console.log('Submit:', content)}
          placeholder="Describe your question in detail..."
        />
      </div>
    );
  },
};

// ============================================================================
// Rich Text Demo
// ============================================================================

/**
 * Rich Text Demo
 *
 * Interactive demo showing all formatting features.
 * Try the keyboard shortcuts or paste markdown content.
 */
export const RichTextDemo: Story = {
  render: () => {
    const [content, setContent] = useState('');
    const editorRef = useRef<Editor | null>(null);

    return (
      <div className="space-y-4">
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="p-3">
            <TiptapEditor
              content={content}
              onChange={setContent}
              onSubmit={() => {
                console.log('Submit:', content);
                alert('Submitted! Check console for content.');
              }}
              placeholder="Try formatting your text..."
              editorRef={editorRef}
            />
          </div>
          <EditorToolbar editor={editorRef.current} />
        </div>

        <div className="bg-gray-50 rounded-lg p-4 text-xs text-gray-600">
          <div className="font-semibold mb-2">Keyboard Shortcuts:</div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <kbd className="bg-gray-200 px-1 rounded">Cmd/Ctrl+B</kbd> Bold
            </div>
            <div>
              <kbd className="bg-gray-200 px-1 rounded">Cmd/Ctrl+I</kbd> Italic
            </div>
            <div>
              <kbd className="bg-gray-200 px-1 rounded">Cmd/Ctrl+U</kbd> Underline
            </div>
            <div>
              <kbd className="bg-gray-200 px-1 rounded">Cmd/Ctrl+E</kbd> Inline code
            </div>
            <div>
              <kbd className="bg-gray-200 px-1 rounded">Enter</kbd> Submit
            </div>
            <div>
              <kbd className="bg-gray-200 px-1 rounded">Shift+Enter</kbd> New line
            </div>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 text-xs text-blue-700">
          <div className="font-semibold mb-2">Try Pasting Markdown:</div>
          <code className="block bg-blue-100 p-2 rounded text-xs">
            **bold** _italic_ `code` [link](https://example.com)
          </code>
        </div>
      </div>
    );
  },
};

// ============================================================================
// All Formatting Features
// ============================================================================

/**
 * All Formatting Features
 *
 * Shows a static example with all available formatting options rendered.
 */
export const AllFormattingFeatures: Story = {
  render: () => {
    const richContent = `
      <h1>Heading 1</h1>
      <h2>Heading 2</h2>
      <h3>Heading 3</h3>
      <p>Regular paragraph with <strong>bold</strong>, <em>italic</em>, <u>underline</u>, and <s>strikethrough</s> text.</p>
      <p>Here is <code class="inline-code">inline code</code> in a sentence.</p>
      <pre class="code-block"><code>// Code block
function hello() {
  console.log("Hello, world!");
}</code></pre>
      <blockquote class="blockquote">This is a blockquote for important notes.</blockquote>
      <p>A link: <a href="https://example.com" class="editor-link">Click here</a></p>
      <ul class="bullet-list">
        <li class="list-item">Bullet item 1</li>
        <li class="list-item">Bullet item 2</li>
        <li class="list-item">Bullet item 3</li>
      </ul>
      <ol class="ordered-list">
        <li class="list-item">Numbered item 1</li>
        <li class="list-item">Numbered item 2</li>
        <li class="list-item">Numbered item 3</li>
      </ol>
    `;

    const [content, setContent] = useState(richContent);
    const editorRef = useRef<Editor | null>(null);

    return (
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-3">
          <TiptapEditor
            content={content}
            onChange={setContent}
            onSubmit={() => console.log('Submit:', content)}
            placeholder="Type a message..."
            editorRef={editorRef}
          />
        </div>
        <EditorToolbar editor={editorRef.current} />
      </div>
    );
  },
};

// ============================================================================
// Controlled Component
// ============================================================================

/**
 * Controlled Component
 *
 * Demonstrates using TiptapEditor as a controlled component
 * with external state management.
 */
export const ControlledComponent: Story = {
  render: () => {
    const [content, setContent] = useState('<p>Edit this content...</p>');
    const [submittedContent, setSubmittedContent] = useState('');

    return (
      <div className="space-y-4">
        <div className="border border-gray-200 rounded-lg p-3">
          <TiptapEditor
            content={content}
            onChange={setContent}
            onSubmit={() => {
              setSubmittedContent(content);
              setContent('');
            }}
            placeholder="Type a message..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="bg-gray-50 rounded p-3">
            <div className="font-semibold mb-2">Current Content (HTML):</div>
            <code className="block text-gray-600 break-all">{content || '(empty)'}</code>
          </div>
          <div className="bg-green-50 rounded p-3">
            <div className="font-semibold mb-2">Last Submitted:</div>
            <code className="block text-gray-600 break-all">
              {submittedContent || '(nothing submitted)'}
            </code>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setContent('<p>Hello <strong>World</strong>!</p>')}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
          >
            Set Content
          </button>
          <button
            onClick={() => setContent('')}
            className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
          >
            Clear Content
          </button>
        </div>
      </div>
    );
  },
};

// ============================================================================
// Without Submit Handler
// ============================================================================

/**
 * Without Submit Handler
 *
 * Editor without onSubmit - Enter key creates new lines instead of submitting.
 */
export const WithoutSubmitHandler: Story = {
  render: () => {
    const [content, setContent] = useState('');

    return (
      <div className="space-y-4">
        <div className="border border-gray-200 rounded-lg p-3">
          <TiptapEditor
            content={content}
            onChange={setContent}
            placeholder="Press Enter for new lines..."
          />
        </div>
        <div className="text-xs text-gray-500">
          Without onSubmit, pressing Enter creates a new line instead of submitting.
        </div>
      </div>
    );
  },
};

// ============================================================================
// Editor Toolbar Only
// ============================================================================

/**
 * Editor Toolbar
 *
 * Shows the EditorToolbar component standalone with an editor.
 */
export const ToolbarDemo: Story = {
  render: () => {
    const [content, setContent] = useState('<p>Select text and use the toolbar to format it.</p>');
    const editorRef = useRef<Editor | null>(null);

    return (
      <div className="space-y-4">
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="p-3">
            <TiptapEditor
              content={content}
              onChange={setContent}
              onSubmit={() => console.log('Submit')}
              placeholder="Type here..."
              editorRef={editorRef}
            />
          </div>
          <EditorToolbar editor={editorRef.current} />
        </div>

        <div className="bg-gray-50 rounded-lg p-4 text-xs text-gray-600">
          <div className="font-semibold mb-2">Toolbar Features:</div>
          <ul className="space-y-1 list-disc list-inside">
            <li>
              <strong>B</strong> - Bold text
            </li>
            <li>
              <em>I</em> - Italic text
            </li>
            <li>
              <s>S</s> - Strikethrough
            </li>
            <li>
              <code>&lt;/&gt;</code> - Inline code
            </li>
            <li>🔗 - Add link</li>
            <li>• - Bullet list</li>
            <li>1. - Numbered list</li>
            <li>" - Blockquote</li>
          </ul>
        </div>
      </div>
    );
  },
};
