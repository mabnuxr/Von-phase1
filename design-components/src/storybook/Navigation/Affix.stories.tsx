import type { Meta, StoryObj } from '@storybook/react-vite';
import NavigationAffix from '../../components/Navigation/Affix/Affix';
import { Divider } from 'rsuite';

const meta: Meta<typeof NavigationAffix> = {
  title: 'Navigation/Affix',
  component: NavigationAffix,
  argTypes: {
    top: { control: 'number', min: 0, max: 300 },
    offsetTop: { control: 'number', min: 0, max: 300 },
    offsetBottom: { control: 'number', min: 0, max: 300 },
  },
  args: {
    top: 10,
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div style={{ height: '200vh', padding: 40 }}>
      <p>Scroll down to see affix behavior</p>
      <Divider />
      <NavigationAffix {...args} />
      <Divider />
      <p style={{ marginTop: 1000 }}>Bottom of content</p>
    </div>
  ),
};

export const WithOffset: Story = {
  args: {
    offsetTop: 100,
  },
};
