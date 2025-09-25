import { render, screen, fireEvent } from '@testing-library/react';
import OverlaysPopover from '../../components/Overlays/Popover/Popover';

describe('RSuite Popover Component', () => {
  it('renders popover button', () => {
    render(<OverlaysPopover />);
    const button = screen.getByRole('button', { name: /Click me/i });
    expect(button).toBeInTheDocument();
  });

  it('shows popover content on click trigger', () => {
    render(<OverlaysPopover trigger="click" />);

    const button = screen.getByRole('button', { name: /Click me/i });
    fireEvent.click(button);

    expect(screen.getByText('Popover Title')).toBeInTheDocument();
    expect(screen.getByText('This is the popover content.')).toBeInTheDocument();
  });

  it('renders with custom title, content, and button label', () => {
    render(
      <OverlaysPopover
        trigger="click"
        title="Custom Popover Title"
        content={<div>Custom Popover Content</div>}
        buttonLabel="Open Popover"
      />
    );

    const button = screen.getByRole('button', { name: /Open Popover/i });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);

    expect(screen.getByText('Custom Popover Title')).toBeInTheDocument();
    expect(screen.getByText('Custom Popover Content')).toBeInTheDocument();
  });

  it('does not show popover content before trigger', () => {
    render(<OverlaysPopover />);
    expect(screen.queryByText('Popover Title')).not.toBeInTheDocument();
    expect(screen.queryByText('This is the popover content.')).not.toBeInTheDocument();
  });

  it('supports hover trigger', () => {
    render(<OverlaysPopover trigger="hover" />);
    const button = screen.getByRole('button', { name: /Click me/i });

    fireEvent.mouseOver(button);
    expect(screen.getByText('Popover Title')).toBeInTheDocument();
    expect(screen.getByText('This is the popover content.')).toBeInTheDocument();

    fireEvent.mouseOut(button);
    // Optional: depending on enterable, popover may hide
  });
});
