import { render, screen } from '@testing-library/react';
import Text from '../../components/Typography/Text/Text';

describe('Text', () => {
  test('applies color and fontSize styles', () => {
    render(
      <Text color="red" fontSize="20px">
        Styled Text
      </Text>
    );
    const textElement = screen.getByText('Styled Text');

    // Use RGB value to match JSDOM computed style
    expect(textElement).toHaveStyle('color: rgb(255, 0, 0); font-size: 20px;');
  });

  test('applies muted prop', () => {
    render(<Text muted>Muted Text</Text>);
    const textElement = screen.getByText('Muted Text');
    expect(textElement).toHaveClass('rs-text-muted');
  });

  test('applies strong, italic, underline, strikethrough', () => {
    render(
      <Text strong italic underline strikethrough>
        Styled Text
      </Text>
    );
    const textElement = screen.getByText('Styled Text');
    expect(textElement).toHaveStyle({
      fontWeight: 'bold',
      fontStyle: 'italic',
      textDecoration: 'underline line-through',
    });
  });
});
