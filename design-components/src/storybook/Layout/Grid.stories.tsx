import type { Meta, StoryObj } from '@storybook/react-vite';
import LayoutGrid from '../../components/Layout/Grid/Grid';

const meta: Meta<typeof LayoutGrid> = {
  title: 'Layout/Grid',
  component: LayoutGrid,
  argTypes: {
    columns: { control: { type: 'number', min: 1, max: 12 } },
    gutter: { control: { type: 'number', min: 0, max: 48 } },
    fluid: { control: 'boolean' },
    responsive: { control: 'object' },
  },
  args: {
    columns: 3,
    gutter: 16,
    fluid: true,
    responsive: { xs: 24, sm: 12, md: 8, lg: 6 },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NoGutter: Story = {
  args: {
    columns: 4,
    gutter: 0,
    responsive: { xs: 24, sm: 12, md: 6 },
  },
};

export const FluidFalse: Story = {
  args: {
    columns: 2,
    gutter: 20,
    fluid: false,
    responsive: { xs: 24, sm: 12 },
  },
};
