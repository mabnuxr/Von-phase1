
import { render, screen } from '@testing-library/react';
import LayoutContainer from '../../components/Layout/Container/Container'

describe('LayoutContainer Component', () => {
  it('renders with default props', () => {
    render(<LayoutContainer />);
    const container = document.querySelector('.rs-container') as HTMLElement;
    expect(container).toBeInTheDocument();
    expect(container).toHaveStyle({ height: '400px' });

    expect(screen.getByText('Header')).toBeInTheDocument();
    expect(screen.getByText('Footer')).toBeInTheDocument();
    expect(screen.getByText('Main content goes here')).toBeInTheDocument();
  });

  it('renders without header', () => {
    render(<LayoutContainer showHeader={false} />);
    expect(screen.queryByText('Header')).toBeNull();
  });

  it('renders without footer', () => {
    render(<LayoutContainer showFooter={false} />);
    expect(screen.queryByText('Footer')).toBeNull();
  });

  it('renders with sidebar on the left', () => {
    render(
      <LayoutContainer
        showSidebar
        sidebarPosition="left"
        sidebarContent={<div>Left Sidebar</div>}
      />
    );
    expect(screen.getByText('Left Sidebar')).toBeInTheDocument();
  });

  it('renders with sidebar on the right', () => {
    render(
      <LayoutContainer
        showSidebar
        sidebarPosition="right"
        sidebarContent={<div>Right Sidebar</div>}
      />
    );
    expect(screen.getByText('Right Sidebar')).toBeInTheDocument();
  });

  it('renders custom header and footer text', () => {
    render(
      <LayoutContainer
        headerText="Custom Header"
        footerText="Custom Footer"
      />
    );
    expect(screen.getByText('Custom Header')).toBeInTheDocument();
    expect(screen.getByText('Custom Footer')).toBeInTheDocument();
  });

  it('renders custom content', () => {
    render(<LayoutContainer content={<div>Custom Content</div>} />);
    expect(screen.getByText('Custom Content')).toBeInTheDocument();
  });

  it('applies custom height correctly', () => {
    render(<LayoutContainer height="600px" />);
    const container = document.querySelector('.rs-container') as HTMLElement;
    expect(container).toHaveStyle({ height: '600px' });
  });
});
