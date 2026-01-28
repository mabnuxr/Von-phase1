import type { Meta, StoryObj, Decorator } from '@storybook/react-vite';
import { useState } from 'react';
import {
  StandardChatInput,
  type AutoEditMode,
  type ActivePopover,
} from '../../../../components/Chat/StandardChatInput';

/**
 * Decorator that wraps stories in a container that mimics the chat area
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
  title: '3-Pane/Components/Popups/ChatInputPopover',
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

// Sample markdown content for the plan
const SAMPLE_PLAN_CONTENT = `## Implementation Plan

I'll help you create a sales performance dashboard. Here's my plan:

### Step 1: Data Analysis
- Analyze the existing sales data structure
- Identify key metrics (revenue, deals closed, conversion rate)

### Step 2: Widget Creation
- Create a KPI summary widget for top-level metrics
- Build a line chart for revenue trends over time
- Add a bar chart for deals by stage

### Step 3: Layout & Styling
- Arrange widgets in a 2x2 grid layout
- Apply the design system styling
- Add responsive behavior

### Step 4: Interactivity
- Enable date range filtering
- Add drill-down capability on charts
`;

const SAMPLE_EDIT_CONTENT = `## Proposed Edits

I'll make the following changes to your dashboard:

### Changes to "Revenue by Region" Chart
- Update chart type from bar to stacked bar
- Add year-over-year comparison
- Include percentage change labels

### Changes to Layout
- Move the chart to the top-right position
- Increase height by 50px for better visibility

Do you want me to proceed with these changes?
`;

const SAMPLE_ADD_WIDGET_CONTENT = `## New Widget: Monthly Pipeline Value

I'll add a new KPI widget with the following configuration:

### Widget Details
- **Type:** KPI Card
- **Metric:** Total Pipeline Value
- **Time Period:** Current Month
- **Comparison:** vs Previous Month

### Display
- Large number format with currency
- Trend indicator (up/down arrow)
- Percentage change label

### Position
- Will be placed in the top-left quadrant
- Size: 1x1 grid unit
`;

const SAMPLE_DELETE_WIDGET_CONTENT = `## Confirm Deletion

Are you sure you want to delete the **"Quarterly Revenue"** widget?

### Impact
- This will remove the chart from your dashboard
- Historical data will be preserved in the system
- You can re-add a similar widget later

### Alternative
Instead of deleting, I can:
- Hide the widget temporarily
- Move it to a different location
- Resize it to take less space
`;

// ============================================================================
// Mode Selector Stories
// ============================================================================

/**
 * ModeSelector - Shows the auto edit mode toggle button
 */
export const ModeSelector: Story = {
  render: () => {
    const [autoEditMode, setAutoEditMode] = useState<AutoEditMode>('off');

    return (
      <div className="space-y-4">
        <div className="text-sm text-gray-700 mb-4">
          Current mode: <strong>{autoEditMode}</strong>
        </div>
        <StandardChatInput
          placeholder="Type a message..."
          showModeSelector={true}
          autoEditMode={autoEditMode}
          onAutoEditModeChange={setAutoEditMode}
          onSend={(message) => console.log('Send:', message)}
        />
      </div>
    );
  },
};

// ============================================================================
// Plan Popover Stories
// ============================================================================

/**
 * PlanPopover - Shows the plan mode popover with markdown content
 */
export const PlanPopover: Story = {
  render: () => {
    const [autoEditMode, setAutoEditMode] = useState<AutoEditMode>('plan');
    const [activePopover, setActivePopover] = useState<ActivePopover | undefined>({
      intent: 'plan',
      title: 'Plan for "Create a sales dashboard"',
      content: SAMPLE_PLAN_CONTENT,
      primaryActionLabel: 'Approve Plan',
      isStreaming: false,
    });

    const handleApprove = () => {
      console.log('Plan approved!');
      setActivePopover(undefined);
      setAutoEditMode('off');
    };

    const handleFeedback = (feedback: string) => {
      console.log('Feedback:', feedback);
    };

    return (
      <StandardChatInput
        placeholder="Type a message..."
        showModeSelector={true}
        autoEditMode={autoEditMode}
        onAutoEditModeChange={setAutoEditMode}
        activePopover={activePopover}
        onPopoverClose={() => setActivePopover(undefined)}
        onPopoverPrimaryAction={handleApprove}
        onPopoverFeedback={handleFeedback}
        onSend={(message) => console.log('Send:', message)}
      />
    );
  },
};

/**
 * PlanPopoverStreaming - Shows the plan popover while content is streaming
 */
export const PlanPopoverStreaming: Story = {
  render: () => {
    const [autoEditMode, setAutoEditMode] = useState<AutoEditMode>('plan');
    const [activePopover, setActivePopover] = useState<ActivePopover | undefined>({
      intent: 'plan',
      title: 'Plan for "Build analytics dashboard"',
      content:
        '## Implementation Plan\n\nAnalyzing your request...\n\n### Step 1: Data Analysis\n- Analyzing the existing',
      primaryActionLabel: 'Approve Plan',
      isStreaming: true,
    });

    return (
      <StandardChatInput
        placeholder="Type a message..."
        showModeSelector={true}
        autoEditMode={autoEditMode}
        onAutoEditModeChange={setAutoEditMode}
        activePopover={activePopover}
        onPopoverClose={() => setActivePopover(undefined)}
        onPopoverPrimaryAction={() => console.log('Approve clicked')}
        onPopoverFeedback={(feedback) => console.log('Feedback:', feedback)}
        onSend={(message) => console.log('Send:', message)}
      />
    );
  },
};

/**
 * PlanPopoverWithUserEdits - Shows the plan popover with user edit indicator
 */
export const PlanPopoverWithUserEdits: Story = {
  render: () => {
    const [autoEditMode, setAutoEditMode] = useState<AutoEditMode>('plan');
    const [activePopover, setActivePopover] = useState<ActivePopover | undefined>({
      intent: 'plan',
      title: 'Plan for "Create a sales dashboard"',
      content: SAMPLE_PLAN_CONTENT,
      primaryActionLabel: 'Approve Plan',
      isStreaming: false,
      hasUserEdits: true,
    });

    return (
      <StandardChatInput
        placeholder="Type a message..."
        showModeSelector={true}
        autoEditMode={autoEditMode}
        onAutoEditModeChange={setAutoEditMode}
        activePopover={activePopover}
        onPopoverClose={() => setActivePopover(undefined)}
        onPopoverPrimaryAction={() => console.log('Approve clicked')}
        onPopoverFeedback={(feedback) => console.log('Feedback:', feedback)}
        onSend={(message) => console.log('Send:', message)}
      />
    );
  },
};

// ============================================================================
// Edit Request Popover Stories
// ============================================================================

/**
 * EditRequestPopover - Asks user for making edits to the report or dashboard
 */
export const EditRequestPopover: Story = {
  render: () => {
    const [activePopover, setActivePopover] = useState<ActivePopover | undefined>({
      intent: 'edit',
      title: 'Edit: Update Revenue Chart',
      content: SAMPLE_EDIT_CONTENT,
      primaryActionLabel: 'Confirm Edits',
      isStreaming: false,
    });

    return (
      <StandardChatInput
        placeholder="Type a message..."
        showModeSelector={true}
        autoEditMode="on"
        onAutoEditModeChange={() => {}}
        activePopover={activePopover}
        onPopoverClose={() => setActivePopover(undefined)}
        onPopoverPrimaryAction={() => {
          console.log('Edits confirmed!');
          setActivePopover(undefined);
        }}
        onPopoverFeedback={(feedback) => console.log('Feedback:', feedback)}
        onSend={(message) => console.log('Send:', message)}
      />
    );
  },
};

// ============================================================================
// Add Widget Popover Stories
// ============================================================================

/**
 * AddWidgetPopover - Asks user for adding a widget to the report or dashboard
 */
export const AddWidgetPopover: Story = {
  render: () => {
    const [activePopover, setActivePopover] = useState<ActivePopover | undefined>({
      intent: 'add-widget',
      title: 'Add Widget: Monthly Pipeline KPI',
      content: SAMPLE_ADD_WIDGET_CONTENT,
      primaryActionLabel: 'Add Widget',
      isStreaming: false,
    });

    return (
      <StandardChatInput
        placeholder="Type a message..."
        showModeSelector={true}
        autoEditMode="on"
        onAutoEditModeChange={() => {}}
        activePopover={activePopover}
        onPopoverClose={() => setActivePopover(undefined)}
        onPopoverPrimaryAction={() => {
          console.log('Widget added!');
          setActivePopover(undefined);
        }}
        onPopoverFeedback={(feedback) => console.log('Feedback:', feedback)}
        onSend={(message) => console.log('Send:', message)}
      />
    );
  },
};

// ============================================================================
// Delete Widget Popover Stories
// ============================================================================

/**
 * DeleteWidgetPopover - Asks user for deleting a widget from the report or dashboard
 */
export const DeleteWidgetPopover: Story = {
  render: () => {
    const [activePopover, setActivePopover] = useState<ActivePopover | undefined>({
      intent: 'delete-widget',
      title: 'Delete Widget: Quarterly Revenue',
      content: SAMPLE_DELETE_WIDGET_CONTENT,
      primaryActionLabel: 'Delete Widget',
      isStreaming: false,
    });

    return (
      <StandardChatInput
        placeholder="Type a message..."
        showModeSelector={true}
        autoEditMode="on"
        onAutoEditModeChange={() => {}}
        activePopover={activePopover}
        onPopoverClose={() => setActivePopover(undefined)}
        onPopoverPrimaryAction={() => {
          console.log('Widget deleted!');
          setActivePopover(undefined);
        }}
        onPopoverFeedback={(feedback) => console.log('Feedback:', feedback)}
        onSend={(message) => console.log('Send:', message)}
      />
    );
  },
};

// ============================================================================
// Combined Scenarios
// ============================================================================

/**
 * WithReferenceAndPopover - Shows a popover with a reference context
 */
export const WithReferenceAndPopover: Story = {
  render: () => {
    const [activePopover, setActivePopover] = useState<ActivePopover | undefined>({
      intent: 'plan',
      title: 'Plan for "Add trend analysis"',
      content: SAMPLE_PLAN_CONTENT,
      primaryActionLabel: 'Approve Plan',
      isStreaming: false,
    });

    return (
      <StandardChatInput
        placeholder="Type a message..."
        showModeSelector={true}
        autoEditMode="plan"
        onAutoEditModeChange={() => {}}
        referenceContext={{
          type: 'dashboard',
          name: 'Sales Overview',
          id: 'dash-1',
        }}
        onRemoveReference={() => console.log('Reference removed')}
        activePopover={activePopover}
        onPopoverClose={() => setActivePopover(undefined)}
        onPopoverPrimaryAction={() => {
          console.log('Plan approved!');
          setActivePopover(undefined);
        }}
        onPopoverFeedback={(feedback) => console.log('Feedback:', feedback)}
        onSend={(message) => console.log('Send:', message)}
      />
    );
  },
};

/**
 * InteractiveModeFlow - Full interactive flow showing mode switching and popover
 */
export const InteractiveModeFlow: Story = {
  render: () => {
    const [autoEditMode, setAutoEditMode] = useState<AutoEditMode>('off');
    const [activePopover, setActivePopover] = useState<ActivePopover | undefined>();
    const [message, setMessage] = useState('');

    const handleModeChange = (newMode: AutoEditMode) => {
      setAutoEditMode(newMode);

      // When entering plan mode, show the plan popover (simulating LLM response)
      if (newMode === 'plan') {
        setTimeout(() => {
          setActivePopover({
            intent: 'plan',
            title: 'Plan for your request',
            content: SAMPLE_PLAN_CONTENT,
            primaryActionLabel: 'Approve Plan',
            isStreaming: false,
          });
        }, 500);
      } else {
        setActivePopover(undefined);
      }
    };

    const handleSend = (msg: string) => {
      console.log('Send:', msg);
      setMessage('');

      // If in auto edit mode, show an edit popover (simulating LLM response)
      if (autoEditMode === 'on') {
        setTimeout(() => {
          setActivePopover({
            intent: 'edit',
            title: `Edit: ${msg.slice(0, 30)}...`,
            content: SAMPLE_EDIT_CONTENT,
            primaryActionLabel: 'Confirm Edits',
            isStreaming: false,
          });
        }, 500);
      }
    };

    return (
      <div className="space-y-4">
        <div className="text-sm text-gray-700 p-3 bg-gray-50 rounded-lg">
          <strong>Instructions:</strong> Try switching modes using the "Auto edits" button. In "Plan
          Mode", a plan popover will appear. In "Auto edits: on" mode, send a message to see an edit
          request popover.
        </div>
        <StandardChatInput
          placeholder="Try sending a message or switching modes..."
          showModeSelector={true}
          autoEditMode={autoEditMode}
          onAutoEditModeChange={handleModeChange}
          value={message}
          onChange={setMessage}
          activePopover={activePopover}
          onPopoverClose={() => {
            setActivePopover(undefined);
            setAutoEditMode('off');
          }}
          onPopoverPrimaryAction={() => {
            console.log('Action confirmed!');
            setActivePopover(undefined);
          }}
          onPopoverFeedback={(feedback) => console.log('Feedback:', feedback)}
          onSend={handleSend}
        />
      </div>
    );
  },
};
