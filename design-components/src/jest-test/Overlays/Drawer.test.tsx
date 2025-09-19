import { render, screen, fireEvent } from '@testing-library/react';
import Drawer, { type DrawerProps } from '../../components/Overlays/Drawer/Drawer';

// Mock rsuite Drawer since it uses portals and animations
jest.mock('rsuite', () => {
  const DrawerMock: any = ({ open, onClose, placement, size, children, className, style }: any) => (
    <div
      data-testid="mock-drawer"
      data-open={open}
      data-placement={placement}
      data-size={size}
      className={className}
      style={style}
    >
      <button onClick={onClose} data-testid="close-btn">
        Close
      </button>
      {children}
    </div>
  );

  // Attach subcomponents like RSuite does
  DrawerMock.Header = ({ children }: any) => <div data-testid="drawer-header">{children}</div>;
  DrawerMock.Title = ({ children }: any) => <h2 data-testid="drawer-title">{children}</h2>;
  DrawerMock.Body = ({ children }: any) => <div data-testid="drawer-body">{children}</div>;

  return { Drawer: DrawerMock };
});

describe('Drawer Component', () => {
  const defaultProps: DrawerProps = {
    open: true,
    onClose: jest.fn(),
    children: <p>Drawer content</p>,
  };

  it('renders drawer when open', () => {
    render(<Drawer {...defaultProps} />);
    expect(screen.getByTestId('mock-drawer')).toHaveAttribute('data-open', 'true');
    expect(screen.getByTestId('drawer-body')).toHaveTextContent('Drawer content');
  });

  it('calls onClose when close button is clicked', () => {
    render(<Drawer {...defaultProps} />);
    fireEvent.click(screen.getByTestId('close-btn'));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('renders with title when provided', () => {
    render(<Drawer {...defaultProps} title="My Drawer Title" />);
    expect(screen.getByTestId('drawer-title')).toHaveTextContent('My Drawer Title');
  });

  it('does not render title when not provided', () => {
    render(<Drawer {...defaultProps} />);
    expect(screen.queryByTestId('drawer-title')).toBeNull();
  });

  it('applies custom className and style', () => {
    const style = { backgroundColor: 'red' };
    render(<Drawer {...defaultProps} className="custom-class" style={style} />);
    const drawer = screen.getByTestId('mock-drawer');

    expect(drawer).toHaveClass('custom-class');
    // ✅ Match normalized rgb value instead of 'red'
    expect(drawer).toHaveStyle('background-color: rgb(255, 0, 0)');
  });

  it('renders without children gracefully', () => {
    render(<Drawer {...defaultProps} children={null} />);
    expect(screen.getByTestId('drawer-body')).toBeEmptyDOMElement();
  });

  it.each(['left', 'right', 'top', 'bottom'] as const)(
    'renders correctly with placement=%s',
    (placement) => {
      render(<Drawer {...defaultProps} placement={placement} />);
      expect(screen.getByTestId('mock-drawer')).toHaveAttribute('data-placement', placement);
    }
  );

  it.each(['xs', 'sm', 'md', 'lg', 'full'] as const)('renders correctly with size=%s', (size) => {
    render(<Drawer {...defaultProps} size={size} />);
    expect(screen.getByTestId('mock-drawer')).toHaveAttribute('data-size', size);
  });
});
