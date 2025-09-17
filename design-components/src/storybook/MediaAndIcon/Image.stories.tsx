import type { Meta, StoryObj } from '@storybook/react-vite';
import ImageDisplay from '../../components/MediaAndIcon/Image/Image';

const meta = {
  title: 'Media-and-Icon/ImageDisplay',
  component: ImageDisplay,
} satisfies Meta<typeof ImageDisplay>;

export default meta;

type Story = StoryObj<typeof ImageDisplay>;

export const Default: Story = {
  args: {
    src: 'https://via.placeholder.com/150',
    alt: 'Sample Image',
    width: 150,
    height: 150,
  },
};

export const Responsive: Story = {
  args: {
    src: 'https://via.placeholder.com/600x200',
    alt: 'Responsive Image',
    // remove unsupported 'responsive' prop from component if present
  },
};

export const Rounded: Story = {
  args: {
    src: 'https://via.placeholder.com/150',
    alt: 'Rounded Image',
    width: 150,
    height: 150,
    rounded: true,
  },
};

export const Circle: Story = {
  args: {
    src: 'https://via.placeholder.com/150',
    alt: 'Circle Image',
    width: 150,
    height: 150,
    circle: true,
  },
};

export const WithFallback: Story = {
  args: {
    src: 'https://not-a-real-image.jpg',
    fallback: (
      <div
        style={{
          width: 150,
          height: 150,
          background: '#eee',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        Fallback
      </div>
    ),
  },
};
