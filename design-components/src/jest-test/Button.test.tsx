import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../components/Button/Button';
import '@testing-library/jest-dom';

describe('Button Component', () => {
  it('renders with default props', () => {
    render(<Button width={100}>Click Me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });

    expect(button).toBeInTheDocument();
    expect(button).toHaveStyle({
      backgroundColor: '#2563eb', // default primary
      width: '100px',
    });
  });

  it('applies secondary color', () => {
    render(
      <Button color="secondary" width="200px">
        Secondary
      </Button>
    );
    const button = screen.getByRole('button', { name: /secondary/i });

    expect(button).toHaveStyle({ backgroundColor: '#6b7280', width: '200px' });
  });

  it('applies danger color', () => {
    render(
      <Button color="danger" width="50%">
        Danger
      </Button>
    );
    const button = screen.getByRole('button', { name: /danger/i });

    expect(button).toHaveStyle({ backgroundColor: '#dc2626', width: '50%' });
  });

  it('handles onClick event', () => {
    const handleClick = jest.fn();
    render(
      <Button width={120} onClick={handleClick}>
        Press
      </Button>
    );
    const button = screen.getByRole('button', { name: /press/i });

    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders custom width as number', () => {
    render(<Button width={150}>Numeric Width</Button>);
    const button = screen.getByRole('button', { name: /numeric width/i });

    expect(button).toHaveStyle({ width: '150px' });
  });

  it('renders custom width as string', () => {
    render(<Button width="75%">Percentage Width</Button>);
    const button = screen.getByRole('button', { name: /percentage width/i });

    expect(button).toHaveStyle({ width: '75%' });
  });

  it('renders children correctly', () => {
    render(<Button width={200}>Hello World</Button>);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });
});
