import type { Meta, StoryObj, Decorator } from '@storybook/react-vite';
import { useState } from 'react';
import { StandardChatInput } from '../../../../components/Chat/StandardChatInput';
import type { FileAttachment } from '../../../../components/Chat/FileAttachment/types';
import type { ReferenceContext } from '../../../../components/Chat/StandardChatInput/types';
import type { BuildMode } from '../../../../components/DashboardBuilder/types';

/**
 * ChatInputDecorator - Wraps stories in a container that mimics the chat area
 */
const ChatInputDecorator: Decorator = (Story) => (
  <div
    style={{
      height: '100vh',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      backgroundColor: '#ffffff',
      padding: '24px',
    }}
  >
    <Story />
  </div>
);

const meta = {
  title: '3-Pane/Components/Chat/StandardChatInputWithReference',
  component: StandardChatInput,
  decorators: [ChatInputDecorator],
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'white',
      values: [{ name: 'white', value: '#ffffff' }],
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof StandardChatInput>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// With Dashboard Reference
// ============================================================================

/**
 * WithDashboardReference
 *
 * Shows the chat input with a dashboard reference tag above it.
 * The reference indicates which dashboard the user is currently viewing/referencing.
 */
export const WithDashboardReference: Story = {
  render: () => {
    const [mode, setMode] = useState<BuildMode>('ask');
    const [reference, setReference] = useState<ReferenceContext | undefined>({
      type: 'dashboard',
      name: 'Sales Overview',
      id: 'dash-1',
    });

    return (
      <StandardChatInput
        placeholder="Ask about this dashboard..."
        mode={mode}
        onModeChange={setMode}
        onVoiceInput={() => console.log('Voice input clicked')}
        onSend={(message, attachments) => {
          console.log('Send:', message, attachments, 'Reference:', reference);
        }}
        referenceContext={reference}
        onRemoveReference={() => setReference(undefined)}
      />
    );
  },
};

// ============================================================================
// With Report Reference
// ============================================================================

/**
 * WithReportReference
 *
 * Shows the chat input with a report reference tag.
 */
export const WithReportReference: Story = {
  render: () => {
    const [mode, setMode] = useState<BuildMode>('ask');
    const [reference, setReference] = useState<ReferenceContext | undefined>({
      type: 'report',
      name: 'Q4 Pipeline Analysis',
      id: 'report-1',
    });

    return (
      <StandardChatInput
        placeholder="Ask about this report..."
        mode={mode}
        onModeChange={setMode}
        onVoiceInput={() => console.log('Voice input clicked')}
        onSend={(message, attachments) => {
          console.log('Send:', message, attachments, 'Reference:', reference);
        }}
        referenceContext={reference}
        onRemoveReference={() => setReference(undefined)}
      />
    );
  },
};

// ============================================================================
// With Reference and Files
// ============================================================================

/**
 * WithReferenceAndFiles
 *
 * Shows the chat input with both a reference tag and file attachments.
 */
export const WithReferenceAndFiles: Story = {
  render: () => {
    const [mode, setMode] = useState<BuildMode>('ask');
    const [reference, setReference] = useState<ReferenceContext | undefined>({
      type: 'dashboard',
      name: 'Revenue Analytics',
      id: 'dash-2',
    });
    const [attachments, setAttachments] = useState<FileAttachment[]>([
      {
        id: '1',
        file: new File([''], 'comparison-data.xlsx'),
        name: 'Comparison Data Q3-Q4.xlsx',
        size: 256000,
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        extension: 'XLSX',
        category: 'spreadsheet',
        status: 'uploaded',
      },
    ]);

    const handleRemoveAttachment = (id: string) => {
      setAttachments(attachments.filter((a) => a.id !== id));
    };

    return (
      <StandardChatInput
        placeholder="Compare with the attached data..."
        mode={mode}
        onModeChange={setMode}
        onVoiceInput={() => console.log('Voice input clicked')}
        onSend={(message, atts) => {
          console.log('Send:', message, atts, 'Reference:', reference);
          setAttachments([]);
        }}
        referenceContext={reference}
        onRemoveReference={() => setReference(undefined)}
        attachments={attachments}
        onRemoveAttachment={handleRemoveAttachment}
      />
    );
  },
};

// ============================================================================
// Reference Removed State
// ============================================================================

/**
 * ReferenceRemovedInteraction
 *
 * Demonstrates the interaction of adding and removing a reference.
 * Click the X on the reference tag to remove it.
 */
export const ReferenceInteraction: Story = {
  render: () => {
    const [mode, setMode] = useState<BuildMode>('ask');
    const [reference, setReference] = useState<ReferenceContext | undefined>({
      type: 'document',
      name: 'Product Roadmap 2025',
      id: 'doc-1',
    });
    const [showAddButton, setShowAddButton] = useState(false);

    return (
      <div className="space-y-4">
        <StandardChatInput
          placeholder={reference ? 'Ask about this document...' : 'Type a message...'}
          mode={mode}
          onModeChange={setMode}
          onVoiceInput={() => console.log('Voice input clicked')}
          onSend={(message, attachments) => {
            console.log('Send:', message, attachments, 'Reference:', reference);
          }}
          referenceContext={reference}
          onRemoveReference={() => {
            setReference(undefined);
            setShowAddButton(true);
          }}
        />
        {showAddButton && (
          <div className="text-center">
            <button
              onClick={() => {
                setReference({
                  type: 'document',
                  name: 'Product Roadmap 2025',
                  id: 'doc-1',
                });
                setShowAddButton(false);
              }}
              className="text-sm text-indigo-600 hover:text-indigo-700"
            >
              + Add reference back
            </button>
          </div>
        )}
      </div>
    );
  },
};

// ============================================================================
// Multiple Reference Types Showcase
// ============================================================================

/**
 * AllReferenceTypes
 *
 * Shows all three reference types side by side for comparison.
 */
export const AllReferenceTypes: Story = {
  decorators: [
    (Story) => (
      <div
        style={{
          minHeight: '100vh',
          width: '100%',
          backgroundColor: '#ffffff',
          padding: '24px',
        }}
      >
        <Story />
      </div>
    ),
  ],
  render: () => {
    const [mode, setMode] = useState<BuildMode>('ask');

    return (
      <div className="space-y-8 max-w-3xl mx-auto">
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Dashboard Reference</h3>
          <StandardChatInput
            placeholder="Ask about this dashboard..."
            mode={mode}
            onModeChange={setMode}
            referenceContext={{
              type: 'dashboard',
              name: 'Sales Overview',
              id: 'dash-1',
            }}
            onRemoveReference={() => console.log('Remove dashboard reference')}
            onSend={(message) => console.log('Send:', message)}
          />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Report Reference</h3>
          <StandardChatInput
            placeholder="Ask about this report..."
            mode={mode}
            onModeChange={setMode}
            referenceContext={{
              type: 'report',
              name: 'Q4 Pipeline Analysis',
              id: 'report-1',
            }}
            onRemoveReference={() => console.log('Remove report reference')}
            onSend={(message) => console.log('Send:', message)}
          />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Document Reference</h3>
          <StandardChatInput
            placeholder="Ask about this document..."
            mode={mode}
            onModeChange={setMode}
            referenceContext={{
              type: 'document',
              name: 'Product Roadmap 2025',
              id: 'doc-1',
            }}
            onRemoveReference={() => console.log('Remove document reference')}
            onSend={(message) => console.log('Send:', message)}
          />
        </div>
      </div>
    );
  },
};
