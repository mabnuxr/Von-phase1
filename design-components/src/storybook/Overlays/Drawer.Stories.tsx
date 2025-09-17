import React, { useState } from 'react';
import type { Meta, StoryFn } from '@storybook/react';
import OverlaysDrawer from '../../components/Overlays/Drawer/Drawer'
import { Button } from 'rsuite';

export default {
  title: 'nnew/Drawer',
  component: OverlaysDrawer,
  argTypes: {
    placement: {
      control: 'radio',
      options: ['left', 'right', 'top', 'bottom'],
    },
    size: {
      control: 'radio',
      options: ['xs', 'sm', 'md', 'lg', 'full'],
    },
    title: {
      control: 'text',
    },
    closable: {
      control: 'boolean',
    },
  },
} as Meta<typeof OverlaysDrawer>;

const Template: StoryFn<React.ComponentProps<typeof OverlaysDrawer>> = (args) => {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ padding: 20 }}>
      <Button onClick={() => setOpen(true)}>Open Drawer</Button>
      <OverlaysDrawer
        {...args}
        open={open}
        onClose={() => setOpen(false)}
      >
        <p>This is content inside the drawer.</p>
        <p>You can customize placement, size, title, and more.</p>
      </OverlaysDrawer>
    </div>
  );
};

export const Default = Template.bind({});
Default.args = {
  placement: 'right',
  size: 'md',
  title: 'Drawer Example',
  closable: true,
};
