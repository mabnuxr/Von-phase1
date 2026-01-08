# StandardChatInput with Rich Text Editor

The `StandardChatInput` component now includes a powerful Tiptap-based rich text editor with Slack-like formatting capabilities and full markdown support.

## Features

### Rich Text Formatting

The editor supports the following formatting options:

- **Bold** (Cmd/Ctrl+B)
- *Italic* (Cmd/Ctrl+I)
- ~~Strikethrough~~
- <u>Underline</u>
- `Inline code` (Cmd/Ctrl+E)
- Code blocks with syntax highlighting
- Links (auto-detected and manual)
- Bulleted lists
- Numbered lists
- Task lists with checkboxes
- Blockquotes
- Headings (H1, H2, H3)

### Markdown Support

The editor automatically converts pasted markdown content into formatted text. You can paste entire markdown files and they will be rendered with proper formatting.

**Example:** Copy and paste this markdown content:

```markdown
# Project Overview

This is a **bold statement** and this is *italic text*.

## Features

- Feature 1
- Feature 2
  - Nested item
- Feature 3

### Code Example

Here's some `inline code` and a code block:

\```javascript
function hello() {
  console.log("Hello, world!");
}
\```

> This is a blockquote with **formatting**.

[Check out this link](https://example.com)
```

### Keyboard Shortcuts

- **Cmd/Ctrl + B**: Toggle bold
- **Cmd/Ctrl + I**: Toggle italic
- **Cmd/Ctrl + E**: Toggle inline code
- **Enter**: Submit message
- **Shift + Enter**: New line

### Formatting Toolbar

An optional Slack-style toolbar provides quick access to all formatting options:

- Bold, italic, strikethrough
- Inline code
- Links
- Bulleted and numbered lists
- Blockquotes

The toolbar can be shown/hidden using the `showFormattingToolbar` prop (default: `true`).

## Usage

### Basic Usage

```tsx
import { StandardChatInput } from '@vonlabs/design-components';

function ChatInterface() {
  return (
    <StandardChatInput
      placeholder="Type a message..."
      onSend={(message) => {
        console.log('Message:', message);
      }}
    />
  );
}
```

### With Formatting Toolbar

```tsx
<StandardChatInput
  placeholder="Try formatting your text..."
  onSend={(message) => console.log(message)}
  showFormattingToolbar={true}
/>
```

### Without Formatting Toolbar

```tsx
<StandardChatInput
  placeholder="Type a message..."
  onSend={(message) => console.log(message)}
  showFormattingToolbar={false}
/>
```

### Controlled Mode

```tsx
function ControlledExample() {
  const [value, setValue] = useState('');

  return (
    <StandardChatInput
      value={value}
      onChange={setValue}
      onSend={(message) => {
        console.log('Send:', message);
        setValue('');
      }}
    />
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showFormattingToolbar` | `boolean` | `true` | Show/hide the formatting toolbar |
| `placeholder` | `string` | `'Type a message...'` | Placeholder text |
| `onSend` | `(message: string, attachments?: FileAttachment[]) => void` | - | Called when message is sent |
| `value` | `string` | - | Controlled value (HTML) |
| `onChange` | `(value: string) => void` | - | Called when content changes (HTML) |
| `disabled` | `boolean` | `false` | Disable the input |
| `onVoiceInput` | `() => void` | - | Voice input callback |
| `isRecording` | `boolean` | `false` | Voice recording state |
| `attachments` | `FileAttachment[]` | - | File attachments |
| `onRemoveAttachment` | `(id: string) => void` | - | Remove attachment callback |

See [types.ts](./types.ts) for the complete API documentation.

## Styling

The editor uses custom CSS that matches the existing design system. Styles are defined in [TiptapEditor.css](./TiptapEditor.css).

### Key Style Features

- Slack-like inline code styling (gray background, red text)
- Clean code block styling with subtle borders
- Proper list indentation and nested list support
- Smooth transitions and hover states
- Scrollbar styling that matches the design system

## Implementation Details

### Architecture

The implementation consists of three main components:

1. **TiptapEditor** ([TiptapEditor.tsx](./TiptapEditor.tsx)): The core editor component using Tiptap
2. **EditorToolbar** ([EditorToolbar.tsx](./EditorToolbar.tsx)): Optional formatting toolbar
3. **StandardChatInput** ([StandardChatInput.tsx](./StandardChatInput.tsx)): The main chat input container

### Extensions Used

- `StarterKit`: Base functionality (paragraphs, bold, italic, etc.)
- `Underline`: Underline formatting
- `TextStyle` + `Color`: Text styling support
- `Link`: Auto-detect and manual link insertion
- `TaskList` + `TaskItem`: Checkbox task lists
- `Placeholder`: Placeholder text support
- `Markdown`: Markdown parsing and paste support

### Content Format

The editor stores content as HTML internally but extracts plain text when sending messages. This ensures compatibility with existing systems while providing a rich editing experience.

## Browser Support

The Tiptap editor works in all modern browsers:

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Performance

The editor is optimized for performance:

- Lazy loading of editor extensions
- Minimal re-renders using React hooks
- Efficient DOM updates via ProseMirror
- Lightweight markdown parsing

## Accessibility

The editor includes accessibility features:

- Keyboard navigation support
- ARIA labels for toolbar buttons
- Focus management
- Screen reader compatibility

## Future Enhancements

Potential future additions:

- Mentions (@user)
- Emoji picker
- Slash commands (/command)
- File drag-and-drop into editor
- Collaborative editing
- Custom keyboard shortcuts
