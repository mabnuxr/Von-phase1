import { render, screen, fireEvent } from '@testing-library/react';
import OverlaysModel from '../../components/Overlays/Model/Model';

// Suppress deprecated prop warning from rsuite Modal
beforeAll(() => {
  jest.spyOn(console, 'warn').mockImplementation((msg) => {
    if (typeof msg === 'string' && msg.includes('"full" property of "Modal" has been deprecated')) {
      return;
    }
    // Keep other warnings
    console.warn(msg);
  });
});

describe('RSuite Modal Component', () => {
  it('renders modal with title and default content', () => {
    render(<OverlaysModel open={true} onClose={jest.fn()} />);
    
    expect(screen.getByText('Modal Title')).toBeInTheDocument();
    expect(screen.getByText('This is the modal content.')).toBeInTheDocument();
    
    // Check buttons
    expect(screen.getByRole('button', { name: /OK/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
  });

  it('renders modal with custom title and children', () => {
    render(
      <OverlaysModel open={true} onClose={jest.fn()} title="Custom Title">
        <div>Custom Content</div>
      </OverlaysModel>
    );

    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.getByText('Custom Content')).toBeInTheDocument();
  });

  it('calls onClose when OK button is clicked', () => {
    const handleClose = jest.fn();
    render(<OverlaysModel open={true} onClose={handleClose} />);

    const okButton = screen.getByRole('button', { name: /OK/i });
    fireEvent.click(okButton);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Cancel button is clicked', () => {
    const handleClose = jest.fn();
    render(<OverlaysModel open={true} onClose={handleClose} />);

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('does not render modal when open is false', () => {
    render(<OverlaysModel open={false} onClose={jest.fn()} />);
    
    expect(screen.queryByText('Modal Title')).not.toBeInTheDocument();
  });
});
