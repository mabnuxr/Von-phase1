import React from 'react';
import type { Meta, StoryFn } from '@storybook/react-vite';
import TypoHighlight from '../../components/Typography/Highlight/HighLight';

export default {
  title: 'Typography/Highlight',
  component: TypoHighlight,
  argTypes: {
    children: {
      control: 'text',
    },
    query: {
      control: 'text',
    },
    style: {
      control: 'object',
    },
  },
} as Meta<typeof TypoHighlight>;

const Template: StoryFn<React.ComponentProps<typeof TypoHighlight>> = (args) => (
  <div style={{ padding: 20 }}>
    <TypoHighlight {...args} />
  </div>
);

export const Default = Template.bind({});
Default.args = {
  children: 'React Suite is a popular UI library built with React.',
  query: 'React',
};

export const CaseSensitive = Template.bind({});
CaseSensitive.args = {
  children: 'Search for React or react depending on case sensitivity.',
  query: 'React',
};

export const CustomStyle = Template.bind({});
CustomStyle.args = {
  children: 'This is a customizable highlight component in RSuite.',
  query: 'highlight',
  style: {
    backgroundColor: '#ffe58f',
    fontWeight: 'bold',
    color: '#d48806',
  },
};
