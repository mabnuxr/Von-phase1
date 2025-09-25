import { render, screen, fireEvent } from '@testing-library/react';
import Dropdown from '../../components/Overlays/Dropdown/Dropdownn';

describe('Dropdown Component', () => {
  it('renders all dropdown items', () => {
    render(<Dropdown />);

    // Open the dropdown
    const button = screen.getByRole('button', { name: /dropdown/i });
    fireEvent.click(button);

    const items = screen.getAllByRole('menuitem');
    expect(items).toHaveLength(3);

    expect(screen.getByText('Extra Panel Content')).toBeInTheDocument();
  });

  it('renders the separator line', () => {
    render(<Dropdown />);

    // Open the dropdown
    const button = screen.getByRole('button', { name: /dropdown/i });
    fireEvent.click(button);

    expect(screen.getByRole('separator')).toBeInTheDocument();
  });

  it('ensures non-panel items are not marked as panel', () => {
    render(<Dropdown />);

    const button = screen.getByRole('button', { name: /dropdown/i });
    fireEvent.click(button);

    const items = screen.getAllByRole('menuitem');
    items.forEach((item) => {
      expect(item).not.toHaveClass('rs-dropdown-item-panel');
    });
  });

  it('ensures items are not disabled by default', () => {
    render(<Dropdown />);

    const button = screen.getByRole('button', { name: /dropdown/i });
    fireEvent.click(button);

    const items = screen.getAllByRole('menuitem');
    items.forEach((item) => {
      expect(item).not.toHaveAttribute('aria-disabled', 'true');
    });
  });

  it('renders with different placements', () => {
    const placements: DropdownProps['placement'][] = [
      'topStart',
      'topEnd',
      'bottomStart',
      'bottomEnd',
    ];

    placements.forEach((placement) => {
      const { container } = render(<Dropdown placement={placement} />);
      const button = container.querySelector('.rs-dropdown');
      expect(button).toHaveClass(
        `rs-dropdown-placement-${placement.replace(/([A-Z])/g, '-$1').toLowerCase()}`
      );
    });
  });
});
