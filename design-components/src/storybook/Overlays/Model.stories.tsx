// src/stories/Overlays/Modal.stories.tsx

import type { Meta, StoryObj } from '@storybook/react-vite';
import OverlaysModel from '../../components/Overlays/Model/Model';
import { useState } from 'react';

const meta: Meta<typeof OverlaysModel> = {
  title: 'Overlays/Modal',
  component: OverlaysModel,
  argTypes: {
    title: { control: 'text' },
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl', 'full'] },
    backdrop: { control: 'select', options: [true, false, 'static'] },
    full: { control: 'boolean' },
    children: { control: 'text' },
  },
  args: {
    title: 'Demo Modal',
    size: 'md',
    backdrop: true,
    full: false,
    children: 'This is a basic modal example using RSuite.',
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <div style={{ padding: 40 }}>
        <button onClick={() => setOpen(true)} style={{ padding: '8px 12px' }}>Open Modal</button>
        <OverlaysModel {...args} open={open} onClose={() => setOpen(false)} />
      </div>
    );
  },
};

export const FullScreen: Story = {
  args: {
    title: 'Full Modal',
    size: 'full',
    backdrop: 'static',
    full: true,
    children: 'This is a full-screen modal.',
  },
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <div style={{ padding: 40 }}>
        <button onClick={() => setOpen(true)} style={{ padding: '8px 12px' }}>Open Fullscreen Modal</button>
        <OverlaysModel {...args} open={open} onClose={() => setOpen(false)} />
      </div>
    );
  },
};
