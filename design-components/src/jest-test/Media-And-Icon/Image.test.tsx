import { render, screen, fireEvent } from '@testing-library/react';
import ImageDisplay from '../../components/MediaAndIcon/Image/Image';

describe('ImageDisplay Component', () => {
  it('renders the ImageDisplay component with required props', () => {
    const { container } = render(<ImageDisplay src="test.png" alt="Test Image" />);
    const image = container.querySelector('.rs-image');
    expect(image).toBeInTheDocument();
  });

  it('renders children or fallback when image fails to load', () => {
    const fallbackText = 'Fallback Content';
    const { container } = render(
      <ImageDisplay src="invalid.png" fallback={<div>{fallbackText}</div>} />
    );

    const image = container.querySelector('.rs-image');
    expect(image).toBeInTheDocument();

    // Simulate image error
    if (image) fireEvent.error(image);

    const fallback = screen.getByText(fallbackText);
    expect(fallback).toBeInTheDocument();
  });

  it('renders with different sizes and styles', () => {
    const { container } = render(
      <ImageDisplay src="test.png" width={200} height={100} rounded circle responsive />
    );
    const image = container.querySelector('.rs-image');
    expect(image).toBeInTheDocument();
  });

  it('renders children when no fallback provided and image fails', () => {
    const childText = 'Child Content';
    const { container } = render(<ImageDisplay src="invalid.png">{childText}</ImageDisplay>);
    const image = container.querySelector('.rs-image');
    expect(image).toBeInTheDocument();

    if (image) fireEvent.error(image);

    const child = screen.getByText(childText);
    expect(child).toBeInTheDocument();
  });
});
