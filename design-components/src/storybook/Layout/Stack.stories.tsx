import React from 'react';
import type { Meta, StoryFn } from '@storybook/react-vite';
import LayoutStack from '../../components/Layout/Stack/Stack';

export default {
  title: 'Layout/Stack',
  component: LayoutStack,
  argTypes: {
    direction: {
      control: 'radio',
      options: ['row', 'column'],
    },
    spacing: {
      control: 'number',
      min: 0,
      max: 50,
    },
    justifyContent: {
      control: 'radio',
      options: ['flex-start', 'center', 'flex-end', 'space-around', 'space-between'],
    },
    alignItems: {
      control: 'radio',
      options: ['flex-start', 'center', 'flex-end', 'baseline', 'stretch'],
    },
    wrap: { control: 'boolean' },
  },
} as Meta<typeof LayoutStack>;

const Template: StoryFn<React.ComponentProps<typeof LayoutStack>> = (args) => (
  <div style={{ padding: 20 }}>
    <LayoutStack {...args} />
  </div>
);

export const Default = Template.bind({});
Default.args = {
  direction: 'row',
  spacing: 10,
  justifyContent: 'flex-start',
  alignItems: 'center',
  wrap: false,
};

export const VerticalCenter = Template.bind({});
VerticalCenter.args = {
  direction: 'column',
  spacing: 20,
  justifyContent: 'center',
  alignItems: 'center',
  wrap: false,
};

export const WrappedStack = Template.bind({});
WrappedStack.args = {
  direction: 'row',
  spacing: 12,
  justifyContent: 'space-between',
  alignItems: 'stretch',
  wrap: true,
};
