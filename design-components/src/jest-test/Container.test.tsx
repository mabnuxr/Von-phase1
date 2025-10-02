import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Container } from '../components/Container';

describe('Container Component', () => {
  it('renders with children', () => {
    render(<Container>Test Content</Container>);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('applies default maxWidth', () => {
    render(<Container>Default</Container>);
    expect(screen.getByText('Default')).toHaveStyle({ maxWidth: '1024px' });
  });

  it('applies different maxWidth values', () => {
    const { rerender } = render(<Container maxWidth="sm">Small</Container>);
    expect(screen.getByText('Small')).toHaveStyle({ maxWidth: '640px' });

    rerender(<Container maxWidth="md">Medium</Container>);
    expect(screen.getByText('Medium')).toHaveStyle({ maxWidth: '768px' });

    rerender(<Container maxWidth="lg">Large</Container>);
    expect(screen.getByText('Large')).toHaveStyle({ maxWidth: '1024px' });

    rerender(<Container maxWidth="xl">Extra Large</Container>);
    expect(screen.getByText('Extra Large')).toHaveStyle({ maxWidth: '1280px' });

    rerender(<Container maxWidth="2xl">2XL</Container>);
    expect(screen.getByText('2XL')).toHaveStyle({ maxWidth: '1536px' });

    rerender(<Container maxWidth="full">Full</Container>);
    expect(screen.getByText('Full')).toHaveStyle({ maxWidth: '100%' });
  });

  it('centers by default', () => {
    render(<Container>Centered</Container>);
    const element = screen.getByText('Centered');
    expect(element).toHaveStyle({
      marginLeft: 'auto',
      marginRight: 'auto',
    });
  });

  it('can disable centering', () => {
    render(<Container center={false}>Not Centered</Container>);
    const element = screen.getByText('Not Centered');
    expect(element).toHaveStyle({
      marginLeft: 0,
      marginRight: 0,
    });
  });

  it('applies padding by default', () => {
    render(<Container>With Padding</Container>);
    const element = screen.getByText('With Padding');
    expect(element).toHaveStyle({
      paddingLeft: '1rem',
      paddingRight: '1rem',
    });
  });

  it('can disable padding', () => {
    render(<Container disablePadding>No Padding</Container>);
    const element = screen.getByText('No Padding');
    expect(element).toHaveStyle({
      paddingLeft: 0,
      paddingRight: 0,
    });
  });

  it('applies custom className', () => {
    render(<Container className="custom-class">Custom</Container>);
    expect(screen.getByText('Custom')).toHaveClass('custom-class');
  });

  it('applies custom id', () => {
    render(<Container id="custom-id">Custom ID</Container>);
    expect(screen.getByText('Custom ID')).toHaveAttribute('id', 'custom-id');
  });
});
