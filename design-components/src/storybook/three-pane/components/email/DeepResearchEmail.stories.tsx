import type { Meta, StoryObj } from '@storybook/react-vite';
import { DeepResearchEmail } from './DeepResearchEmail';
import { getDeepResearchEmailTemplate } from './deepResearchEmailTemplate';

const SAMPLE_QUERY =
  'Perform a comprehensive analysis of our Q4 sales performance across all regions and product categories. Identify trends, top-performing segments, underperforming areas, and provide strategic recommendations for Q1 planning.';

const meta: Meta<typeof DeepResearchEmail> = {
  title: '3-Pane/Components/Email/Deep Research Email',
  component: DeepResearchEmail,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'gray',
      values: [{ name: 'gray', value: '#e5e7eb' }],
    },
  },
  argTypes: {
    previewWidth: {
      control: 'radio',
      options: ['mobile', 'desktop'],
      description: 'Preview width to simulate different devices',
    },
    querySummary: {
      control: 'text',
      description: 'The research query to display in the email',
    },
    conversationUrl: {
      control: 'text',
      description: 'URL for the "View Conversation" button',
    },
    pdfDownloadUrl: {
      control: 'text',
      description: 'URL for the "Download PDF" button',
    },
  },
  args: {
    querySummary: SAMPLE_QUERY,
    conversationUrl: 'https://app.vonlabs.ai/conversation/abc123',
    pdfDownloadUrl: 'https://app.vonlabs.ai/download/report-abc123.pdf',
    unsubscribeUrl: 'https://app.vonlabs.ai/unsubscribe?token=xyz',
    currentYear: new Date().getFullYear(),
  },
};

export default meta;
type Story = StoryObj<typeof DeepResearchEmail>;

/**
 * Desktop preview of the Deep Research email template.
 * This shows how the email will appear on desktop email clients.
 */
export const Desktop: Story = {
  args: {
    previewWidth: 'desktop',
  },
};

/**
 * Mobile preview of the Deep Research email template.
 * The buttons stack vertically on smaller screens for better touch targets.
 */
export const Mobile: Story = {
  args: {
    previewWidth: 'mobile',
  },
};

/**
 * Preview with a shorter query to show how the layout adapts.
 */
export const ShortQuery: Story = {
  args: {
    previewWidth: 'desktop',
    querySummary: 'What are our top-performing sales reps this quarter?',
  },
};

/**
 * Side-by-side comparison of desktop and mobile views.
 */
export const Comparison: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
      <div>
        <p
          style={{
            margin: '0 0 12px 0',
            fontSize: '13px',
            fontWeight: 500,
            color: '#374151',
          }}
        >
          Desktop (600px)
        </p>
        <DeepResearchEmail {...args} previewWidth="desktop" />
      </div>
      <div>
        <p
          style={{
            margin: '0 0 12px 0',
            fontSize: '13px',
            fontWeight: 500,
            color: '#374151',
          }}
        >
          Mobile (375px)
        </p>
        <DeepResearchEmail {...args} previewWidth="mobile" />
      </div>
    </div>
  ),
};

/**
 * Raw HTML Template
 *
 * Use this story to copy the raw HTML template with placeholders
 * for use in SendGrid, MailChimp, or other email services.
 *
 * **Template Variables:**
 * - `{{query_summary}}` - The user's research query
 * - `{{conversation_url}}` - URL to view the conversation
 * - `{{pdf_download_url}}` - URL to download the PDF report
 * - `{{unsubscribe_url}}` - Unsubscribe link
 * - `{{current_year}}` - Current year for copyright
 */
export const RawHTMLTemplate: Story = {
  render: () => {
    const template = getDeepResearchEmailTemplate();

    const handleCopy = () => {
      navigator.clipboard.writeText(template);
      alert('HTML template copied to clipboard!');
    };

    return (
      <div
        style={{
          maxWidth: '800px',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <div
          style={{
            marginBottom: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '16px', color: '#111827' }}>
              Raw HTML Template
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
              Copy this HTML for SendGrid, MailChimp, or other email services
            </p>
          </div>
          <button
            onClick={handleCopy}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 500,
              color: '#ffffff',
              backgroundColor: '#111827',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Copy HTML
          </button>
        </div>

        <div
          style={{
            padding: '16px',
            backgroundColor: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            marginBottom: '16px',
          }}
        >
          <p
            style={{
              margin: '0 0 8px 0',
              fontSize: '12px',
              fontWeight: 500,
              color: '#374151',
            }}
          >
            Template Variables:
          </p>
          <ul
            style={{
              margin: 0,
              padding: '0 0 0 20px',
              fontSize: '12px',
              color: '#6b7280',
            }}
          >
            <li>
              <code>{'{{query_summary}}'}</code> - The user's research query
            </li>
            <li>
              <code>{'{{conversation_url}}'}</code> - URL to view the conversation
            </li>
            <li>
              <code>{'{{pdf_download_url}}'}</code> - URL to download the PDF
            </li>
            <li>
              <code>{'{{unsubscribe_url}}'}</code> - Unsubscribe link
            </li>
            <li>
              <code>{'{{current_year}}'}</code> - Current year for copyright
            </li>
          </ul>
        </div>

        <pre
          style={{
            padding: '16px',
            backgroundColor: '#1f2937',
            color: '#e5e7eb',
            borderRadius: '8px',
            fontSize: '11px',
            lineHeight: 1.5,
            overflow: 'auto',
            maxHeight: '500px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {template}
        </pre>
      </div>
    );
  },
};
