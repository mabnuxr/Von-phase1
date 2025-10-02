import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Heading } from '../components/Heading';

describe('Heading Component', () => {
  it('renders with children', () => {
    render(<Heading>Test Heading</Heading>);
    expect(screen.getByText('Test Heading')).toBeInTheDocument();
  });

  it('renders different heading levels', () => {
    const { container, rerender } = render(<Heading level="h1">H1</Heading>);
    expect(container.querySelector('h1')).toBeInTheDocument();

    rerender(<Heading level="h2">H2</Heading>);
    expect(container.querySelector('h2')).toBeInTheDocument();

    rerender(<Heading level="h3">H3</Heading>);
    expect(container.querySelector('h3')).toBeInTheDocument();

    rerender(<Heading level="h4">H4</Heading>);
    expect(container.querySelector('h4')).toBeInTheDocument();

    rerender(<Heading level="h5">H5</Heading>);
    expect(container.querySelector('h5')).toBeInTheDocument();

    rerender(<Heading level="h6">H6</Heading>);
    expect(container.querySelector('h6')).toBeInTheDocument();
  });

  it('renders h2 by default', () => {
    const { container } = render(<Heading>Default</Heading>);
    expect(container.querySelector('h2')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Heading className="custom-class">Custom</Heading>);
    expect(screen.getByText('Custom')).toHaveClass('custom-class');
  });

  it('applies custom id', () => {
    render(<Heading id="custom-id">Custom ID</Heading>);
    expect(screen.getByText('Custom ID')).toHaveAttribute('id', 'custom-id');
  });

  it('applies text alignment', () => {
    const { rerender } = render(<Heading align="left">Left</Heading>);
    expect(screen.getByText('Left')).toHaveStyle({ textAlign: 'left' });

    rerender(<Heading align="center">Center</Heading>);
    expect(screen.getByText('Center')).toHaveStyle({ textAlign: 'center' });

    rerender(<Heading align="right">Right</Heading>);
    expect(screen.getByText('Right')).toHaveStyle({ textAlign: 'right' });
  });

  it('uses semantic level but can have different visual level', () => {
    const { container } = render(
      <Heading level="h3" visualLevel="h1">
        Visual Override
      </Heading>
    );
    // Should render as h3 element
    expect(container.querySelector('h3')).toBeInTheDocument();
    // But styling would be from h1 (we can't easily test style values without looking at exact px)
    expect(screen.getByText('Visual Override')).toBeInTheDocument();
  });
});
