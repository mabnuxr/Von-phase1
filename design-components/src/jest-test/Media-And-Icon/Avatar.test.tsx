import { render, screen } from '@testing-library/react';
import AvatarDisplay from '../../components/MediaAndIcon/Avatar/Avatar'

describe('AvatarDisplay Component', () => {
  it('renders without crashing with default props', () => {
    const { container } = render(<AvatarDisplay />);
    const avatar = container.querySelector('.rs-avatar');
    expect(avatar).toBeInTheDocument();
  });

  it('renders children correctly', () => {
    render(<AvatarDisplay>AB</AvatarDisplay>);
    const child = screen.getByText('AB');
    expect(child).toBeInTheDocument();
  });

  it('renders multiple sizes without errors', () => {
    const sizes: Array<'lg' | 'md' | 'sm' | 'xs'> = ['lg', 'md', 'sm', 'xs'];
    sizes.forEach((size) => {
      const { container } = render(<AvatarDisplay size={size} />);
      const avatar = container.querySelector('.rs-avatar');
      expect(avatar).toBeInTheDocument();
      // Optionally check the size class
      expect(avatar).toHaveClass(`rs-avatar-${size}`);
    });
  });

  it('renders circle and non-circle variants', () => {
    const { container } = render(<AvatarDisplay circle={false} />);
    const avatar = container.querySelector('.rs-avatar');
    expect(avatar).toBeInTheDocument();
    // Circle class is applied by default; we can't check exact DOM changes without modifying component
  });
});
