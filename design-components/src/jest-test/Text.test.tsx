import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Text } from '../components/Text';

describe('Text Component', () => {
  it('renders with children', () => {
    render(<Text>Hello World</Text>);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('renders different variants', () => {
    const { rerender } = render(<Text variant="body">Body</Text>);
    expect(screen.getByText('Body')).toBeInTheDocument();

    rerender(<Text variant="bodySmall">Body Small</Text>);
    expect(screen.getByText('Body Small')).toBeInTheDocument();

    rerender(<Text variant="caption">Caption</Text>);
    expect(screen.getByText('Caption')).toBeInTheDocument();

    rerender(<Text variant="label">Label</Text>);
    expect(screen.getByText('Label')).toBeInTheDocument();

    rerender(<Text variant="labelLarge">Label Large</Text>);
    expect(screen.getByText('Label Large')).toBeInTheDocument();
  });

  it('renders as different HTML elements', () => {
    const { container, rerender } = render(<Text as="p">Paragraph</Text>);
    expect(container.querySelector('p')).toBeInTheDocument();

    rerender(<Text as="span">Span</Text>);
    expect(container.querySelector('span')).toBeInTheDocument();

    rerender(<Text as="div">Div</Text>);
    expect(container.querySelector('div')).toBeInTheDocument();

    rerender(<Text as="label">Label</Text>);
    expect(container.querySelector('label')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Text className="custom-class">Custom</Text>);
    expect(screen.getByText('Custom')).toHaveClass('custom-class');
  });

  it('applies custom id', () => {
    render(<Text id="custom-id">Custom ID</Text>);
    expect(screen.getByText('Custom ID')).toHaveAttribute('id', 'custom-id');
  });

  it('renders with italic style', () => {
    render(<Text italic>Italic</Text>);
    expect(screen.getByText('Italic')).toHaveStyle({ fontStyle: 'italic' });
  });

  it('renders with underline', () => {
    render(<Text underline>Underlined</Text>);
    expect(screen.getByText('Underlined')).toHaveStyle({ textDecoration: 'underline' });
  });

  it('applies text alignment', () => {
    const { rerender } = render(<Text align="left">Left</Text>);
    expect(screen.getByText('Left')).toHaveStyle({ textAlign: 'left' });

    rerender(<Text align="center">Center</Text>);
    expect(screen.getByText('Center')).toHaveStyle({ textAlign: 'center' });

    rerender(<Text align="right">Right</Text>);
    expect(screen.getByText('Right')).toHaveStyle({ textAlign: 'right' });

    rerender(<Text align="justify">Justify</Text>);
    expect(screen.getByText('Justify')).toHaveStyle({ textAlign: 'justify' });
  });
});
