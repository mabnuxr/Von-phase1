import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Stack } from '../components/Stack';

describe('Stack Component', () => {
  it('renders with children', () => {
    render(
      <Stack>
        <div>Item 1</div>
        <div>Item 2</div>
      </Stack>
    );
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('renders vertical direction by default', () => {
    render(<Stack>Content</Stack>);
    expect(screen.getByText('Content')).toHaveStyle({ flexDirection: 'column' });
  });

  it('renders horizontal direction', () => {
    render(<Stack direction="horizontal">Content</Stack>);
    expect(screen.getByText('Content')).toHaveStyle({ flexDirection: 'row' });
  });

  it('applies different gap sizes', () => {
    const { rerender } = render(<Stack gap="xs">Extra Small</Stack>);
    expect(screen.getByText('Extra Small')).toHaveStyle({ gap: '0.25rem' });

    rerender(<Stack gap="sm">Small</Stack>);
    expect(screen.getByText('Small')).toHaveStyle({ gap: '0.5rem' });

    rerender(<Stack gap="md">Medium</Stack>);
    expect(screen.getByText('Medium')).toHaveStyle({ gap: '1rem' });

    rerender(<Stack gap="lg">Large</Stack>);
    expect(screen.getByText('Large')).toHaveStyle({ gap: '1.5rem' });

    rerender(<Stack gap="xl">Extra Large</Stack>);
    expect(screen.getByText('Extra Large')).toHaveStyle({ gap: '2rem' });
  });

  it('applies different alignment values', () => {
    const { rerender } = render(<Stack align="start">Start</Stack>);
    expect(screen.getByText('Start')).toHaveStyle({ alignItems: 'flex-start' });

    rerender(<Stack align="center">Center</Stack>);
    expect(screen.getByText('Center')).toHaveStyle({ alignItems: 'center' });

    rerender(<Stack align="end">End</Stack>);
    expect(screen.getByText('End')).toHaveStyle({ alignItems: 'flex-end' });

    rerender(<Stack align="stretch">Stretch</Stack>);
    expect(screen.getByText('Stretch')).toHaveStyle({ alignItems: 'stretch' });

    rerender(<Stack align="baseline">Baseline</Stack>);
    expect(screen.getByText('Baseline')).toHaveStyle({ alignItems: 'baseline' });
  });

  it('applies different justify values', () => {
    const { rerender } = render(<Stack justify="start">Start</Stack>);
    expect(screen.getByText('Start')).toHaveStyle({ justifyContent: 'flex-start' });

    rerender(<Stack justify="center">Center</Stack>);
    expect(screen.getByText('Center')).toHaveStyle({ justifyContent: 'center' });

    rerender(<Stack justify="end">End</Stack>);
    expect(screen.getByText('End')).toHaveStyle({ justifyContent: 'flex-end' });

    rerender(<Stack justify="space-between">Space Between</Stack>);
    expect(screen.getByText('Space Between')).toHaveStyle({ justifyContent: 'space-between' });

    rerender(<Stack justify="space-around">Space Around</Stack>);
    expect(screen.getByText('Space Around')).toHaveStyle({ justifyContent: 'space-around' });

    rerender(<Stack justify="space-evenly">Space Evenly</Stack>);
    expect(screen.getByText('Space Evenly')).toHaveStyle({ justifyContent: 'space-evenly' });
  });

  it('applies wrap when enabled', () => {
    render(<Stack wrap>Wrapped</Stack>);
    expect(screen.getByText('Wrapped')).toHaveStyle({ flexWrap: 'wrap' });
  });

  it('does not wrap by default', () => {
    render(<Stack>No Wrap</Stack>);
    expect(screen.getByText('No Wrap')).toHaveStyle({ flexWrap: 'nowrap' });
  });

  it('applies fullWidth when enabled', () => {
    render(<Stack fullWidth>Full Width</Stack>);
    expect(screen.getByText('Full Width')).toHaveStyle({ width: '100%' });
  });

  it('renders as different HTML elements', () => {
    const { container, rerender } = render(<Stack as="section">Section</Stack>);
    expect(container.querySelector('section')).toBeInTheDocument();

    rerender(<Stack as="nav">Nav</Stack>);
    expect(container.querySelector('nav')).toBeInTheDocument();

    rerender(<Stack as="aside">Aside</Stack>);
    expect(container.querySelector('aside')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Stack className="custom-class">Custom</Stack>);
    expect(screen.getByText('Custom')).toHaveClass('custom-class');
  });

  it('applies custom id', () => {
    render(<Stack id="custom-id">Custom ID</Stack>);
    expect(screen.getByText('Custom ID')).toHaveAttribute('id', 'custom-id');
  });
});
