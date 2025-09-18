import type { Meta, StoryObj } from '@storybook/react-vite';
import OverlaysPopover from '../../components/Overlays/Popover/Popover';

const meta: Meta<typeof OverlaysPopover> = {
  title: 'Overlays/Popover',
  component: OverlaysPopover,
  argTypes: {
    placement: {
      control: 'select',
      options: [
        'top',
        'topStart',
        'topEnd',
        'bottom',
        'bottomStart',
        'bottomEnd',
        'left',
        'leftStart',
        'leftEnd',
        'right',
        'rightStart',
        'rightEnd',
      ],
    },
    trigger: { control: 'select', options: ['click', 'hover', 'focus', 'active', 'none'] },
    title: { control: 'text' },
    content: { control: 'text' },
    enterable: { control: 'boolean' },
    buttonLabel: { control: 'text' },
  },
  args: {
    title: 'Popover',
    content: 'Hello from Popover!',
    placement: 'bottom',
    trigger: 'click',
    enterable: false,
    buttonLabel: 'Click me',
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const HoverPopover: Story = {
  args: {
    title: 'Info',
    content: 'This shows on hover.',
    placement: 'rightStart',
    trigger: 'hover',
    enterable: true,
    buttonLabel: 'Hover over me',
  },
};
