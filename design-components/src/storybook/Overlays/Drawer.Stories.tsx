import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import Drawer from '../../components/Overlays/Drawer/Drawer';

const meta: Meta<typeof Drawer> = {
  title: 'OverLays/Drawer',
  component: Drawer,
  tags: ['autodocs'],
  argTypes: {
    placement: { control: 'select', options: ['left', 'right', 'top', 'bottom'] },
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'full'] },
    title: { control: 'text' },
  },
  args: {
    placement: 'right',
    size: 'md',
    title: 'My Drawer',
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <div style={{ padding: 16 }}>
        <button onClick={() => setOpen(true)} style={{ padding: '8px 12px' }}>Open Drawer</button>
        <Drawer {...args} open={open} onClose={() => setOpen(false)}>
          <div style={{ padding: 12 }}>
            <p>Drawer content goes here.</p>
            <button onClick={() => setOpen(false)} style={{ padding: '8px 12px' }}>Close</button>
          </div>
        </Drawer>
      </div>
    );
  },
};
