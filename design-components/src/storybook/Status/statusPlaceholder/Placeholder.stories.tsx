import React from 'react';
import type { Meta, StoryFn } from '@storybook/react-vite';
import StatusPlaceholder from '../../../components/Status/Placeholder/Placeholder';

export default {
  title: 'Status/Placeholder',
  component: StatusPlaceholder,
  argTypes: {
    type: {
      control: 'select',
      options: ['paragraph', 'graph', 'button', 'grid'],
    },
    active: { control: 'boolean' },
    rows: {
      control: 'number',
      if: { arg: 'type', eq: 'paragraph' },
    },
    columns: {
      control: 'number',
      if: { arg: 'type', eq: 'grid' },
    },
    graphType: {
      control: 'select',
      options: ['circle', 'rect'],
      if: { arg: 'type', eq: 'graph' },
    },
  },
} as Meta<typeof StatusPlaceholder>;

const Template: StoryFn<React.ComponentProps<typeof StatusPlaceholder>> = (args) => (
  <div style={{ padding: 20 }}>
    <StatusPlaceholder {...args} />
  </div>
);

export const Paragraph = Template.bind({});
Paragraph.args = {
  type: 'paragraph',
  active: true,
  rows: 4,
};

export const Graph = Template.bind({});
Graph.args = {
  type: 'graph',
  graphType: 'circle',
  active: true,
};

export const Button = Template.bind({});
Button.args = {
  type: 'button',
  active: true,
};

export const Grid = Template.bind({});
Grid.args = {
  type: 'grid',
  rows: 3,
  columns: 4,
  active: true,
};
