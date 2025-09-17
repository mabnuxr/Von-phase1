import React from 'react';
import type { Meta, StoryFn } from '@storybook/react-vite';
import TypoHeading from '../../components/Typography/Heading/Heading';

export default {
  title: 'Typography/Heading',
  component: TypoHeading,
  argTypes: {
    as: {
      control: 'select',
      options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    },
    children: {
      control: 'text',
    },
    style: {
      control: 'object',
    },
    className: {
      control: 'text',
    },
  },
} as Meta<typeof TypoHeading>;

const Template: StoryFn<React.ComponentProps<typeof TypoHeading>> = (args) => (
  <div style={{ padding: 20 }}>
    <TypoHeading {...args} />
  </div>
);

export const Default = Template.bind({});
Default.args = {
  as: 'h2',
  children: 'This is a heading',
  style: {
    color: '#1a73e8',
    fontWeight: 'bold',
  },
};

export const H1 = Template.bind({});
H1.args = {
  as: 'h1',
  children: 'This is an H1 Heading',
  style: {
    fontSize: '2.5rem',
    color: '#333',
  },
};

export const H6Muted = Template.bind({});
H6Muted.args = {
  as: 'h6',
  children: 'Small and muted heading',
  style: {
    fontSize: '0.9rem',
    color: '#888',
  },
};
