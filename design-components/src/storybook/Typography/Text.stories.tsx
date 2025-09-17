import React from 'react';
import type { Meta, StoryFn } from '@storybook/react';
import TypoText from '../../components/Typography/Text/Text'

export default {
  title: 'Typography/Text',
  component: TypoText,
  argTypes: {
    children: { control: 'text' },
    muted: { control: 'boolean' },
    strong: { control: 'boolean' },
    italic: { control: 'boolean' },
    underline: { control: 'boolean' },
    strikethrough: { control: 'boolean' },
    color: { control: 'color' },
    fontSize: { control: 'text' },
  },
} as Meta<typeof TypoText>;

const Template: StoryFn<React.ComponentProps<typeof TypoText>> = (args) => (
  <div style={{ padding: 20 }}>
    <TypoText {...args} />
  </div>
);

export const Default = Template.bind({});
Default.args = {
  children: 'This is default text.',
};

export const Muted = Template.bind({});
Muted.args = {
  children: 'This is muted text.',
  muted: true,
};

export const StyledText = Template.bind({});
StyledText.args = {
  children: 'This text is bold, italic, and underlined.',
  strong: true,
  italic: true,
  underline: true,
  color: '#2e8b57',
  fontSize: '1.2rem',
};

export const Strikethrough = Template.bind({});
Strikethrough.args = {
  children: 'This text is struck through.',
  strikethrough: true,
};
