import { render, screen } from '@testing-library/react';
import Text from '../components/Text/Text';
import '@testing-library/jest-dom';

describe('Text component', () => {
  it('renders children correctly', () => {
    render(<Text>Sample Text</Text>);
    expect(screen.getByText('Sample Text')).toBeInTheDocument();
  });

  it('applies h1 variant styles', () => {
    render(<Text variant="h1">Heading</Text>);
    const element = screen.getByText('Heading');
    expect(element).toHaveStyle({
      fontSize: '2rem',
      fontWeight: '700'
    });
  });

  it('applies custom color', () => {
    render(<Text color="#ff0000">Red Text</Text>);
    expect(screen.getByText('Red Text')).toHaveStyle({ color: '#ff0000' });
  });
});
