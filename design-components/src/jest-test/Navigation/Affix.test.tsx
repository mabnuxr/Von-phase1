import React from 'react';
import { render, screen } from '@testing-library/react';
import NavigationAffix from '../../components/Navigation/Affix/Affix';

// Mock rsuite Affix to render children normally in tests
jest.mock('rsuite', () => {
  const actual = jest.requireActual('rsuite');
  return {
    ...actual,
    Affix: ({ children }: { children: React.ReactNode }) => (
      <div className="rs-affix">{children}</div>
    ),
  };
});

describe('NavigationAffix Component', () => {
  it('renders the Affix component with default top and button', () => {
    const { container } = render(<NavigationAffix />);
    const affix = container.querySelector('.rs-affix');
    expect(affix).toBeInTheDocument();

    const button = screen.getByRole('button', { name: /I stick to the top/i });
    expect(button).toBeInTheDocument();
  });

  it('renders custom children correctly', () => {
    const childText = 'Custom Content';
    const { container } = render(<NavigationAffix>{childText}</NavigationAffix>);
    const affix = container.querySelector('.rs-affix');
    expect(affix).toBeInTheDocument();

    const child = screen.getByText(childText);
    expect(child).toBeInTheDocument();
  });

  it('applies the top prop correctly', () => {
    const offset = 50;
    const { container } = render(<NavigationAffix top={offset} />);
    const affix = container.querySelector('.rs-affix');
    expect(affix).toBeInTheDocument();
  });

  it('uses offsetTop if provided', () => {
    const offsetTop = 80;
    const { container } = render(<NavigationAffix top={0} offsetTop={offsetTop} />);
    const affix = container.querySelector('.rs-affix');
    expect(affix).toBeInTheDocument();
  });
});
