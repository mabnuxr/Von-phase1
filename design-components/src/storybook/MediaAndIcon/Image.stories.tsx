
import type{ Meta, Story } from '@storybook/react';
import ImageDisplay from '../../components/MediaAndIcon/Image/Image';

export default {
  title: 'Media-and-Icon/ImageDisplay',
  component: ImageDisplay,
} as Meta;

const Template: Story<ImageDisplayProps> = (args) => <ImageDisplay {...args} />;

export const Default = Template.bind({});
Default.args = {
  src: 'https://via.placeholder.com/150',
  alt: 'Sample Image',
  width: 150,
  height: 150,
};

export const Responsive = Template.bind({});
Responsive.args = {
  src: 'https://via.placeholder.com/600x200',
  alt: 'Responsive Image',
  responsive: true,
};

export const Rounded = Template.bind({});
Rounded.args = {
  src: 'https://via.placeholder.com/150',
  alt: 'Rounded Image',
  width: 150,
  height: 150,
  rounded: true,
};

export const Circle = Template.bind({});
Circle.args = {
  src: 'https://via.placeholder.com/150',
  alt: 'Circle Image',
  width: 150,
  height: 150,
  circle: true,
};

export const WithFallback = Template.bind({});
WithFallback.args = {
  src: 'https://not-a-real-image.jpg',
  fallback: <div style={{ width: 150, height: 150, background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Fallback</div>,
};
