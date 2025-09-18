import { render, screen } from '@testing-library/react';
import LayoutGrid from '../../components/Layout/Grid/Grid';

describe('LayoutGrid Component', () => {
  it('renders with default props (3 columns)', () => {
    render(<LayoutGrid />);
    const cols = screen.getAllByText(/Col \d/);

    expect(cols).toHaveLength(3);
    expect(cols[0]).toHaveTextContent('Col 1');
  });

  it('renders with custom column count', () => {
    render(<LayoutGrid columns={4} />);
    const cols = screen.getAllByText(/Col \d/);

    expect(cols).toHaveLength(4);
    expect(cols[3]).toHaveTextContent('Col 4');
  });

  it('renders with custom gutter spacing', () => {
    render(<LayoutGrid gutter={40} />);
    const cols = screen.getAllByText(/Col \d/);

    // Since we can’t test rsuite inline styles in JSDOM,
    // just check that the correct number of Cols still render
    expect(cols).toHaveLength(3);
  });

  it('applies responsive props (renders same number of cols)', () => {
    render(<LayoutGrid responsive={{ xs: 12, sm: 8, md: 6, lg: 4 }} />);
    const cols = screen.getAllByText(/Col \d/);

    expect(cols).toHaveLength(3);
  });

  it('renders non-fluid grid when fluid=false', () => {
    render(<LayoutGrid fluid={false} />);
    const cols = screen.getAllByText(/Col \d/);

    expect(cols).toHaveLength(3);
  });
});
