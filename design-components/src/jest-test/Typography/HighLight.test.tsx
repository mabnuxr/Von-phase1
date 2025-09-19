import { render, screen } from '@testing-library/react';
import Highlight from '../../components/Typography/Highlight/HighLight';

describe('Highlight', () => {
  test('renders text with highlight', () => {
    render(<Highlight query="world">Hello world!</Highlight>);

    // Check that the highlighted part is rendered inside <mark>
    const mark = screen.getByText('world', { exact: false });
    expect(mark.tagName).toBe('MARK');

    // Check that the full text is rendered (may be split)
    const container = screen.getByText(/Hello/i).closest('div');
    expect(container).toBeInTheDocument();
  });

  test('applies className and style', () => {
    render(
      <Highlight
        query="world"
        className="custom-class"
        style={{ color: 'blue', fontWeight: 'bold' }}
      >
        Hello world!
      </Highlight>
    );

    // Find the wrapper container div
    const container = screen.getByText(/Hello/i).closest('div');
    expect(container).toHaveClass('custom-class');

    // For color, use RGB format to match rendered style
    expect(container).toHaveStyle({
      color: 'rgb(0, 0, 255)',
      fontWeight: 'bold',
    });
  });
});
