import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { ChatPaneV2 } from '../../components/Jan17Demo/ChatPaneV2';
import type { ChatMessage } from '../../components/Jan17Demo/ChatPaneV2';
import { ArtifactViewer } from '../../components/Jan17Demo/ArtifactViewer';
import ChatViewV2 from '../../components/Jan17Demo/ChatViewV2';
import type {
  Artifact,
  DocumentArtifact,
  SlidesArtifact,
  SpreadsheetArtifact,
} from '../../components/Jan17Demo/ChatViewV2';

// =============================================================================
// Mock Data
// =============================================================================

const MOCK_DOCUMENT: DocumentArtifact = {
  type: 'document',
  title: 'Q1 2026 Revenue Analysis',
  description: 'Document generated from /Deal summary',
  content: `# Q1 2026 Revenue Analysis

## Executive Summary

Total revenue for Q1 2026 reached **$4.2M**, representing a 23% increase over Q4 2025. This growth was primarily driven by expansion in the enterprise segment and successful upselling of premium features.

## Key Highlights

- **New ARR:** $1.8M from 12 new enterprise deals
- **Expansion Revenue:** $850K from existing accounts
- **Churn:** 2.1% (down from 3.4% in Q4)
- **Net Revenue Retention:** 118%

## Pipeline Analysis

The current pipeline stands at $12.3M with a weighted value of $6.1M. Notable deals include:

1. **Acme Corp** — $450K, Stage 3, Expected close: March 2026
2. **GlobalTech** — $380K, Stage 4, Expected close: February 2026
3. **DataFlow Inc** — $290K, Stage 2, Expected close: April 2026

## Recommendations

Focus areas for Q2 include accelerating the mid-market segment and increasing product-led growth motions to improve conversion from free trial to paid.`,
};

const MOCK_SLIDES: SlidesArtifact = {
  type: 'slides',
  title: 'Board Deck: Q1 2026',
  description: 'Presentation generated from /Board update',
  slides: [
    {
      id: '1',
      title: 'Q1 2026 Board Update',
      content:
        '# Q1 2026 Board Update\n\n**Revenue Operations Summary**\n\nPrepared for the Board of Directors\nFebruary 2026',
      notes: 'Opening slide — set context for the quarterly review.',
    },
    {
      id: '2',
      title: 'Revenue Highlights',
      content:
        '## Revenue Highlights\n\n- Total Revenue: **$4.2M** (+23% QoQ)\n- New ARR: **$1.8M** from 12 enterprise deals\n- Net Revenue Retention: **118%**\n- Churn Rate: **2.1%** (improved from 3.4%)',
      notes: 'Emphasize the churn improvement — this was a board concern last quarter.',
    },
    {
      id: '3',
      title: 'Pipeline Overview',
      content:
        '## Pipeline Overview\n\n- Total Pipeline: **$12.3M**\n- Weighted Pipeline: **$6.1M**\n- Average Deal Size: **$340K** (+15% YoY)\n- Sales Cycle: **45 days** (down from 52)',
      notes: 'Pipeline health is strong. Call out deal size increase as a key win.',
    },
    {
      id: '4',
      title: 'Q2 Focus Areas',
      content:
        '## Q2 2026 Focus Areas\n\n1. Accelerate mid-market segment\n2. Launch product-led growth motion\n3. Expand APAC presence\n4. Reduce time-to-value for new customers',
    },
  ],
};

const MOCK_SPREADSHEET: SpreadsheetArtifact = {
  type: 'spreadsheet',
  title: 'Deal Summary: Q1 2026 Pipeline',
  description: 'Spreadsheet generated from /Deal summary',
  columns: [
    { id: 'company', label: 'Company' },
    { id: 'deal_size', label: 'Deal Size' },
    { id: 'stage', label: 'Stage' },
    { id: 'close_date', label: 'Expected Close' },
    { id: 'owner', label: 'Owner' },
    { id: 'probability', label: 'Probability' },
  ],
  rows: [
    {
      company: 'Acme Corp',
      deal_size: '$450,000',
      stage: 'Negotiation',
      close_date: 'Mar 2026',
      owner: 'Sarah Chen',
      probability: '75%',
    },
    {
      company: 'GlobalTech',
      deal_size: '$380,000',
      stage: 'Proposal',
      close_date: 'Feb 2026',
      owner: 'Mike Johnson',
      probability: '85%',
    },
    {
      company: 'DataFlow Inc',
      deal_size: '$290,000',
      stage: 'Discovery',
      close_date: 'Apr 2026',
      owner: 'Lisa Park',
      probability: '40%',
    },
    {
      company: 'CloudFirst',
      deal_size: '$520,000',
      stage: 'Negotiation',
      close_date: 'Mar 2026',
      owner: 'Sarah Chen',
      probability: '70%',
    },
    {
      company: 'TechVentures',
      deal_size: '$180,000',
      stage: 'Qualification',
      close_date: 'May 2026',
      owner: 'David Kim',
      probability: '25%',
    },
    {
      company: 'InnovateCo',
      deal_size: '$340,000',
      stage: 'Proposal',
      close_date: 'Mar 2026',
      owner: 'Mike Johnson',
      probability: '60%',
    },
  ],
};

const makeMessages = (artifact: Artifact): ChatMessage[] => [
  {
    id: '1',
    type: 'user',
    content: 'Summarize the Q1 2026 pipeline',
  },
  {
    id: '2',
    type: 'assistant',
    content: `I've generated the requested ${artifact.type} based on your input.`,
    thinkingSteps: [
      { id: 't1', text: 'Querying Salesforce opportunities', status: 'complete' as const },
      { id: 't2', text: 'Analyzing pipeline data', status: 'complete' as const },
      { id: 't3', text: 'Generating artifact', status: 'complete' as const },
    ],
    thinkingElapsedTime: 6,
    artifact,
  },
];

// =============================================================================
// Story: Isolated Artifact Viewers
// =============================================================================

const meta: Meta = {
  title: 'Artifacts',
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

/**
 * Document viewer — renders a DOCX-style document with rich text content.
 */
export const DocumentViewer: StoryObj = {
  render: () => (
    <div className="h-screen w-full bg-gray-50 p-4">
      <ArtifactViewer artifact={MOCK_DOCUMENT} onClose={() => console.log('Close viewer')} />
    </div>
  ),
};

/**
 * Slides viewer — renders a PPTX-style presentation with slide navigation.
 */
export const SlidesViewer: StoryObj = {
  render: () => (
    <div className="h-screen w-full bg-gray-50 p-4">
      <ArtifactViewer artifact={MOCK_SLIDES} onClose={() => console.log('Close viewer')} />
    </div>
  ),
};

/**
 * Spreadsheet viewer — renders an XLSX-style table with column headers.
 */
export const SpreadsheetViewer: StoryObj = {
  render: () => (
    <div className="h-screen w-full bg-gray-50 p-4">
      <ArtifactViewer artifact={MOCK_SPREADSHEET} onClose={() => console.log('Close viewer')} />
    </div>
  ),
};

/**
 * All artifact cards in a chat — shows how each artifact type renders as a card
 * within the assistant message.
 */
export const ArtifactCards: StoryObj = {
  render: () => {
    const messages: ChatMessage[] = [
      {
        id: '1',
        type: 'user',
        content: 'Generate reports for the Q1 review',
      },
      {
        id: '2',
        type: 'assistant',
        content: "Here's your revenue analysis document.",
        artifact: MOCK_DOCUMENT,
      },
      {
        id: '3',
        type: 'assistant',
        content: "Here's the board deck presentation.",
        artifact: MOCK_SLIDES,
      },
      {
        id: '4',
        type: 'assistant',
        content: "And here's the pipeline breakdown.",
        artifact: MOCK_SPREADSHEET,
      },
    ];

    return (
      <div className="h-screen w-full bg-white">
        <ChatViewV2
          messages={messages}
          onArtifactClick={(id) => console.log('Artifact clicked:', id)}
          onArtifactDownload={(artifact) => console.log('Download:', artifact.title)}
        />
      </div>
    );
  },
};

/**
 * Full two-pane flow — chat on the left, artifact viewer on the right.
 * Click an artifact card to open it in the viewer pane.
 */
export const ChatToArtifactFlow: StoryObj = {
  render: () => {
    const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);
    const messages = makeMessages(MOCK_SPREADSHEET);

    // Add more messages with different artifact types
    const allMessages: ChatMessage[] = [
      ...messages,
      {
        id: '3',
        type: 'user',
        content: 'Can you also create a document summary?',
      },
      {
        id: '4',
        type: 'assistant',
        content: "Here's your document summary.",
        artifact: MOCK_DOCUMENT,
      },
    ];

    return (
      <div className="h-screen w-full flex bg-gray-50">
        {/* Chat Pane */}
        <div
          className={`${selectedArtifact ? 'w-[400px]' : 'w-full'} h-full transition-all duration-300 bg-white border-r border-gray-100`}
        >
          <ChatPaneV2
            messages={allMessages}
            placeholder="Continue the conversation..."
            onArtifactClick={(artifactId) => {
              const msg = allMessages.find((m) => m.id === artifactId);
              if (msg?.artifact) setSelectedArtifact(msg.artifact);
            }}
            onArtifactDownload={(artifact) => console.log('Download:', artifact.title)}
          />
        </div>

        {/* Artifact Viewer Pane */}
        {selectedArtifact && (
          <div className="flex-1 h-full p-4">
            <ArtifactViewer artifact={selectedArtifact} onClose={() => setSelectedArtifact(null)} />
          </div>
        )}
      </div>
    );
  },
};
