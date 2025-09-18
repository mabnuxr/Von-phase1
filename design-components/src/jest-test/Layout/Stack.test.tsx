
import { render, screen } from '@testing-library/react';
import LayoutStack from '../../components/Layout/Stack/Stack';

describe('LayoutStack Component', () => {
  it('renders with default props (row direction)', () => {
    const { container } = render(<LayoutStack />);
    const stack = container.querySelector('.rs-stack');
    expect(stack).toBeInTheDocument();
    expect(stack).toHaveStyle('flex-direction: row');
    expect(stack).toHaveStyle('justify-content: flex-start');
    expect(stack).toHaveStyle('align-items: center');
  });

  it('renders with column direction', () => {
    const { container } = render(<LayoutStack direction="column" />);
    const stack = container.querySelector('.rs-stack');
    expect(stack).toBeInTheDocument();
    expect(stack).toHaveStyle('flex-direction: column');
  });

  it('renders all child boxes', () => {
    render(<LayoutStack />);
    const items = screen.getAllByText(/Item \d/); // matches "Item 1", "Item 2", "Item 3"
    expect(items).toHaveLength(3);
    items.forEach((item) => {
      expect(item).toBeInTheDocument();
    });
  });

  it('applies custom props (justifyContent, alignItems, wrap, spacing)', () => {
    const { container } = render(
      <LayoutStack
        justifyContent="space-between"
        alignItems="flex-end"
        wrap={true}
        spacing={20}
      />
    );
    const stack = container.querySelector('.rs-stack');
    expect(stack).toHaveStyle('justify-content: space-between');
    expect(stack).toHaveStyle('align-items: flex-end');
    expect(stack).toHaveStyle('flex-wrap: wrap'); // rsuite applies wrap as flex-wrap
    expect(stack).toHaveStyle('gap: 20px'); // spacing is applied as gap
  });
});
