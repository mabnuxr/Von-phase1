import React from 'react';
import type { Meta, StoryFn } from '@storybook/react-vite';
import OverlaysDropdown from '../../components/Overlays/Dropdown/Dropworn';

export default {
  title: 'Overlays/Dropdown',
  component: OverlaysDropdown,
  argTypes: {
    title: {
      control: 'text',
    },
    placement: {
      control: 'select',
      options: [
        'topStart',
        'topEnd',
        'bottomStart',
        'bottomEnd',
        'leftStart',
        'leftEnd',
        'rightStart',
        'rightEnd',
      ],
    },
    itemCount: {
      control: 'number',
      min: 1,
      max: 10,
    },
    disabledItems: {
      control: 'boolean',
    },
  },
} as Meta<typeof OverlaysDropdown>;

const Template: StoryFn<React.ComponentProps<typeof OverlaysDropdown>> = (args) => (
  <div style={{ padding: 40 }}>
    <OverlaysDropdown {...args} />
  </div>
);

export const Default = Template.bind({});
Default.args = {
  title: 'Menu',
  placement: 'bottomStart',
  itemCount: 3,
  disabledItems: false,
};

export const TopEndDisabled = Template.bind({});
TopEndDisabled.args = {
  title: 'Top Dropdown',
  placement: 'topEnd',
  itemCount: 4,
  disabledItems: true,
};
