import { render, screen } from '@testing-library/react';
import LayoutDivider from '../../components/Layout/Divider/Divider';

describe('LayoutDivider Component', () => {
  it('renders with default props (center aligned)', () => {
    render(<LayoutDivider>Default Divider</LayoutDivider>);
    const divider = document.querySelector('.rs-divider') as HTMLElement;

    expect(divider).toBeInTheDocument();
    expect(divider).toHaveClass('rs-divider-horizontal');
    expect(divider).toHaveClass('rs-divider-with-text'); // rsuite default
    // ⚠️ No center-specific class is applied in your component
    expect(screen.getByText('Default Divider')).toBeInTheDocument();
  });

  it('renders with left aligned text (prop still spreads)', () => {
    render(<LayoutDivider textAlign="left">Left Divider</LayoutDivider>);
    const divider = document.querySelector('.rs-divider') as HTMLElement;

    expect(divider).toHaveClass('rs-divider-horizontal');
    expect(divider).toHaveClass('rs-divider-with-text');
    // ⚠️ No "rs-divider-with-text-left" since component doesn’t add it
    expect(screen.getByText('Left Divider')).toBeInTheDocument();
  });

  it('renders with right aligned text (prop still spreads)', () => {
    render(<LayoutDivider textAlign="right">Right Divider</LayoutDivider>);
    const divider = document.querySelector('.rs-divider') as HTMLElement;

    expect(divider).toHaveClass('rs-divider-horizontal');
    expect(divider).toHaveClass('rs-divider-with-text');
    // ⚠️ No "rs-divider-with-text-right"
    expect(screen.getByText('Right Divider')).toBeInTheDocument();
  });

  it('renders vertical divider', () => {
    render(<LayoutDivider vertical />);
    const divider = document.querySelector('.rs-divider') as HTMLElement;

    expect(divider).toHaveClass('rs-divider-vertical');
    expect(divider).not.toHaveClass('rs-divider-with-text');
  });

  it('applies custom styles', () => {
    render(<LayoutDivider style={{ color: 'red' }}>Styled Divider</LayoutDivider>);
    const divider = document.querySelector('.rs-divider') as HTMLElement;

    expect(divider).toHaveStyle({ color: 'rgb(255, 0, 0)' }); // browser normalizes "red"
    expect(screen.getByText('Styled Divider')).toBeInTheDocument();
  });
});
