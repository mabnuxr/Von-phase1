
import type { Meta, Story } from '@storybook/react';
import AvatarDisplay from '../../components/MediaAndIcon/Avatar/Avatar';

export default {
  title: 'Media-and-Icon/AvatarDisplay',
  component: AvatarDisplay,
} as Meta;

const Template: Story<AvatarDisplayProps> = (args) => <AvatarDisplay {...args} />;

export const Default = Template.bind({});
Default.args = {
  src: 'https://i.pravatar.cc/100?img=1',
  alt: 'User Avatar',
  size: 'md',
  circle: true,
};

export const WithInitials = Template.bind({});
WithInitials.args = {
  children: 'AB',
  size: 'md',
};

export const Square = Template.bind({});
Square.args = {
  src: 'https://i.pravatar.cc/100?img=2',
  circle: false,
  size: 'md',
};

export const Small = Template.bind({});
Small.args = {
  src: 'https://i.pravatar.cc/100?img=3',
  size: 'sm',
};

export const Large = Template.bind({});
Large.args = {
  src: 'https://i.pravatar.cc/100?img=4',
  size: 'lg',
};
