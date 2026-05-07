import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { markdownCellFormatter, demoteHeadings } from '../../ReportTable/markdownCell';
import './table-widget.css';
import '../../TiptapEditor/TiptapEditor.css';

/**
 * Visual verifier for the markdown cell pipeline.
 *
 * Each story renders the formatter's output for a representative input
 * (plain text, links, headings, scripts, lists, etc.) inside a synthetic
 * <table> so the .dt-markdown-wrap / .tiptap-viewer-cell CSS applies.
 *
 * The play functions assert on the rendered DOM — they double as automated
 * tests via @storybook/addon-vitest, and the stories themselves give a
 * human-reviewable visual catalog of how each scenario actually renders.
 */

interface MarkdownCellPreviewProps {
  /** Raw cell value, as it would arrive from Grid Lite. */
  value: unknown;
}

/**
 * Mounts the formatter output inside a single-cell table that mirrors
 * the .table-widget-root CSS scope so cell-density rules take effect.
 */
const MarkdownCellPreview: React.FC<MarkdownCellPreviewProps> = ({ value }) => {
  const html = markdownCellFormatter.call({ value });
  return (
    <div
      className="table-widget-root"
      style={{ width: 480, padding: 0, border: '1px solid #e5e7eb' }}
    >
      <table className="hcg-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          <tr style={{ height: 36 }}>
            <td
              style={{
                height: 36,
                maxHeight: 36,
                boxSizing: 'border-box',
                padding: '0 8px',
                borderBottom: '1px solid #e5e7eb',
                position: 'relative',
              }}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </tr>
        </tbody>
      </table>
    </div>
  );
};

const meta: Meta<typeof MarkdownCellPreview> = {
  title: 'Dashboard/TableWidget/MarkdownCell',
  component: MarkdownCellPreview,
  parameters: {
    layout: 'centered',
  },
};
export default meta;
type Story = StoryObj<typeof meta>;

// ---------------------------------------------------------------------------
// Stories — each one is both visual review + a play-function-driven test.
// ---------------------------------------------------------------------------

export const PlainText: Story = {
  args: { value: 'Acme Corp' },
  play: async ({ canvasElement }) => {
    expect(canvasElement.querySelector('.dt-markdown-wrap')).not.toBeNull();
    expect(canvasElement.querySelector('.dt-markdown-content')).not.toBeNull();
    // Plain string rounds through marked → <p>Acme Corp</p>; cell-density CSS
    // strips the <p>'s margins so this looks identical to a plain <span>.
    expect(canvasElement.textContent).toContain('Acme Corp');
    expect(canvasElement.querySelector('h1, h2, h3, h4, h5, h6')).toBeNull();
  },
};

export const Bold: Story = {
  args: { value: '**bold here** with rest' },
  play: async ({ canvasElement }) => {
    expect(canvasElement.querySelector('strong')).toBeTruthy();
    expect(canvasElement.querySelector('strong')?.textContent).toBe('bold here');
  },
};

export const ClickableLink: Story = {
  args: { value: '[click me](https://example.com)' },
  play: async ({ canvasElement }) => {
    const link = canvasElement.querySelector('a');
    expect(link).toBeTruthy();
    expect(link?.getAttribute('href')).toBe('https://example.com');
    expect(link?.getAttribute('target')).toBe('_blank');
    expect(link?.getAttribute('rel')).toMatch(/noopener/);
  },
};

export const HeadingDemoted: Story = {
  args: { value: '# Top Customer' },
  play: async ({ canvasElement }) => {
    // The heading style must render visually, but no <h1>..<h6> can leak
    // into the DOM (would pollute the page heading outline for screen readers).
    expect(canvasElement.querySelector('h1, h2, h3, h4, h5, h6')).toBeNull();
    const demoted = canvasElement.querySelector('.md-h1');
    expect(demoted).toBeTruthy();
    expect(demoted?.textContent).toBe('Top Customer');
  },
};

export const SubheadingDemoted: Story = {
  args: { value: '## Section Title' },
  play: async ({ canvasElement }) => {
    expect(canvasElement.querySelector('h2')).toBeNull();
    expect(canvasElement.querySelector('.md-h2')?.textContent).toBe('Section Title');
  },
};

export const MaliciousScript: Story = {
  args: { value: 'safe text <script>window.__pwned = true</script>' },
  play: async ({ canvasElement }) => {
    expect(canvasElement.querySelector('script')).toBeNull();
    expect((window as unknown as { __pwned?: boolean }).__pwned).toBeUndefined();
  },
};

export const MaliciousIframeAndForm: Story = {
  args: {
    value: 'a <iframe src="https://evil.example/x"></iframe> b <form><input/></form> c',
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.querySelector('iframe')).toBeNull();
    expect(canvasElement.querySelector('form')).toBeNull();
    expect(canvasElement.querySelector('input')).toBeNull();
  },
};

export const EmptyValue: Story = {
  args: { value: '' },
  play: async ({ canvasElement }) => {
    // Empty / null values fall through to the em-dash placeholder, NOT the
    // markdown wrapper — keeps the cell visually unchanged from before.
    expect(canvasElement.querySelector('.dt-markdown-wrap')).toBeNull();
    expect(canvasElement.textContent).toContain('—');
  },
};

export const NullValue: Story = {
  args: { value: null },
  play: async ({ canvasElement }) => {
    expect(canvasElement.querySelector('.dt-markdown-wrap')).toBeNull();
    expect(canvasElement.textContent).toContain('—');
  },
};

export const InlineCode: Story = {
  args: { value: 'use `npm install` to add it' },
  play: async ({ canvasElement }) => {
    const code = canvasElement.querySelector('code');
    expect(code).toBeTruthy();
    expect(code?.textContent).toBe('npm install');
  },
};

export const UnorderedList: Story = {
  args: { value: '- one\n- two\n- three' },
  play: async ({ canvasElement }) => {
    const ul = canvasElement.querySelector('ul');
    expect(ul).toBeTruthy();
    expect(ul?.querySelectorAll('li').length).toBe(3);
  },
};

export const GfmTable: Story = {
  args: { value: '| col a | col b |\n|---|---|\n| 1 | 2 |\n| 3 | 4 |' },
  play: async ({ canvasElement }) => {
    // The CELL contains a markdown-rendered table — that's the user's
    // content, distinct from the outer chrome <table>. Look for it via
    // the .dt-markdown-content scope.
    const inner = canvasElement.querySelector('.dt-markdown-content table');
    expect(inner).toBeTruthy();
    expect(inner?.querySelectorAll('th').length).toBe(2);
  },
};

export const ExpandButtonPresent: Story = {
  args: { value: '**bold** [link](https://x.com)' },
  play: async ({ canvasElement }) => {
    // Every markdown cell ships with an expand button that, when the row
    // is hovered AND content overflows, opens a popover. The button is the
    // entry point for the popover round-trip; TableWidget's handleGridClick
    // then reads Grid Lite's own data-value attribute on the <td> for the
    // original markdown source (we don't manage that attribute ourselves).
    expect(canvasElement.querySelector('.dt-markdown-wrap')).not.toBeNull();
    expect(canvasElement.querySelector('.dt-expand-btn')).not.toBeNull();
  },
};

export const SpecialCharsRender: Story = {
  args: { value: 'has "quotes" & <angle>\nand a newline' },
  play: async ({ canvasElement }) => {
    // Special characters survive markdown parsing + sanitization without
    // breaking the cell layout: quotes/ampersand/angle render as text,
    // and the cell wrapper is intact (no attribute parse failures).
    const wrap = canvasElement.querySelector('.dt-markdown-wrap');
    expect(wrap).not.toBeNull();
    expect(canvasElement.textContent).toContain('quotes');
    expect(canvasElement.textContent).toContain('angle');
  },
};

export const JsonEscapedContent: Story = {
  // Backend may serialize markdown through JSON twice; the pipeline
  // unescapes literal \n / \t / \" so newlines render as paragraph breaks.
  args: { value: 'line one\\n\\nline two' },
  play: async ({ canvasElement }) => {
    const ps = canvasElement.querySelectorAll('.dt-markdown-content > p');
    expect(ps.length).toBe(2);
    expect(ps[0].textContent).toBe('line one');
    expect(ps[1].textContent).toBe('line two');
  },
};

// ---------------------------------------------------------------------------
// demoteHeadings — direct unit-style assertions, exposed as a story so they
// run in the same Storybook test pipeline as everything else.
// ---------------------------------------------------------------------------

export const DemoteHeadingsUnit: Story = {
  args: { value: 'placeholder' },
  parameters: {
    docs: {
      description: {
        story:
          'Direct assertions on the demoteHeadings string transform. Visual rendering is unrelated; the play function does the work.',
      },
    },
  },
  play: async () => {
    expect(demoteHeadings('<h1>a</h1><h6>f</h6>')).toBe(
      '<div class="md-h1">a</div><div class="md-h6">f</div>'
    );
    // Preserves attributes
    expect(demoteHeadings('<h2 id="x">y</h2>')).toBe('<div class="md-h2" id="x">y</div>');
    // Doesn't touch non-headings
    expect(demoteHeadings('<p>x</p><strong>y</strong>')).toBe('<p>x</p><strong>y</strong>');
    // Case-insensitive
    expect(demoteHeadings('<H1>x</H1>')).toBe('<div class="md-h1">x</div>');
  },
};
