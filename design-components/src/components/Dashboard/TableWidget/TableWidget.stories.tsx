import type { Meta, StoryObj } from '@storybook/react-vite';
import { TableWidget } from './TableWidget';
import type { TableWidgetConfig } from '../types';

/**
 * Visual review of TableWidget end-to-end with markdown cells.
 *
 * These stories mount the actual TableWidget (with Highcharts Grid Lite
 * underneath) so the full layout — column widths, hover states, expand
 * popover, pagination — can be eyeballed in Storybook. The pure-string
 * pipeline is verified by play functions in MarkdownCell.stories.tsx;
 * here we just need to see the integrated result.
 */

const decorator = (Story: React.FC) => (
  <div style={{ width: 880, height: 360, background: '#fff' }}>
    <Story />
  </div>
);

const meta: Meta<typeof TableWidget> = {
  title: 'Dashboard/TableWidget',
  component: TableWidget,
  decorators: [decorator],
  parameters: { layout: 'centered' },
};
export default meta;
type Story = StoryObj<typeof meta>;

// ---------------------------------------------------------------------------
// Synthetic data builders
// ---------------------------------------------------------------------------

function buildConfig(rows: Record<string, unknown>[]): TableWidgetConfig {
  // Grid Lite expects column-major data: { columnId: [v1, v2, ...] }
  const colIds = Object.keys(rows[0] ?? {});
  const dataColumns: Record<string, unknown[]> = {};
  for (const id of colIds) {
    dataColumns[id] = rows.map((r) => r[id]);
  }
  return {
    gridOptions: {
      data: { columns: dataColumns },
      columns: colIds.map((id) => ({ id, header: { format: id } })),
      pagination: { enabled: false },
      rendering: {
        rows: { strict: true },
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/**
 * Mixed-content table — the realistic case. Plain strings, links, formatted
 * text, headings, and an empty cell all in the same column.
 */
export const MixedContent: Story = {
  args: {
    config: buildConfig([
      { account: 'Acme Corp', notes: 'Renewal expected Q2.', status: 'open' },
      {
        account: 'Globex',
        notes: 'See [contract](https://crm.example/deals/123) for details.',
        status: 'closed',
      },
      {
        account: 'Initech',
        notes: '**Action required** — legal review pending.',
        status: 'open',
      },
      {
        account: 'Soylent',
        notes: '# High priority\nFollow up by EOD',
        status: 'open',
      },
      { account: 'Umbrella', notes: '', status: 'closed' },
      {
        account: 'Hooli',
        notes: 'Outstanding items:\n- Pricing approval\n- Security review',
        status: 'open',
      },
      {
        account: 'Dunder Mifflin',
        notes: 'Signed yesterday — `MSA-2026-0042`',
        status: 'closed',
      },
    ]),
  },
};

/**
 * Pure plain-text — ensures no visual regression for the most common case.
 * Should look identical to the pre-markdown table.
 */
export const PlainTextOnly: Story = {
  args: {
    config: buildConfig([
      { customer: 'Alpha', region: 'NA', tier: 'Gold' },
      { customer: 'Beta', region: 'EMEA', tier: 'Silver' },
      { customer: 'Gamma', region: 'APAC', tier: 'Bronze' },
    ]),
  },
};

/**
 * Long-content cells exercise the expand-button / popover path. Hover a row
 * and click the expand button to verify the popover renders TiptapViewer
 * with full markdown including clickable links.
 */
export const OverflowingCells: Story = {
  args: {
    config: buildConfig([
      {
        deal: 'Q4-Acme',
        details:
          'This deal involves a multi-year commitment with **strategic implications** for both sides. Outstanding items: pricing, legal review, security review, and architecture sign-off. See the [latest summary](https://crm.example/deals/q4-acme) for the full breakdown.',
      },
      {
        deal: 'Q4-Globex',
        details:
          '## Status\nIn final negotiation. Three open items: \n- Multi-region failover\n- SLA credits\n- Security questionnaire',
      },
    ]),
  },
};

/**
 * Adversarial input — confirms sanitization holds. There should be no
 * <script>, <iframe>, or <form> in the rendered DOM, and the visible cell
 * shows the harmless text portion only.
 */
export const SanitizedAdversarial: Story = {
  args: {
    config: buildConfig([
      {
        source: 'normal note',
        payload: 'safe text',
      },
      {
        source: 'embedded script',
        payload: 'looks fine <script>window.__pwned=true</script>',
      },
      {
        source: 'embedded iframe',
        payload: 'a <iframe src="https://evil.example"></iframe> b',
      },
      {
        source: 'embedded form',
        payload: 'fill <form><input type="text"/></form>',
      },
    ]),
  },
};
