import { render, screen } from '@testing-library/react';
import Heading from '../../components/Typography/Heading/Heading';

describe('Heading', () => {
  test('renders default heading', () => {
    render(<Heading>Default Heading</Heading>);
    expect(screen.getByText('Default Heading')).toBeInTheDocument();
  });

  test('applies className and style', () => {
    render(
      <Heading
        className="custom-class"
        style={{ color: 'red', fontSize: '24px' }}
      >
        Styled Heading
      </Heading>
    );

    const heading = screen.getByText('Styled Heading');
    expect(heading).toHaveClass('custom-class');

    // Use computed values instead of named colors
    expect(heading).toHaveStyle({
      color: 'rgb(255, 0, 0)',
      fontSize: '24px',
    });
  });
});
