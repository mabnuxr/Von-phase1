import type { Meta, StoryObj } from '@storybook/react-vite';
import NavigatioNav from '../../components/Navigation/Nav/Nav';

const meta: Meta<typeof NavigatioNav> = {
  title: 'Navigation/Nav',
  component: NavigatioNav,
  argTypes: {
    appearance: { control: 'select', options: ['default', 'subtle', 'tabs'] },
    orientation: { control: 'select', options: ['horizontal', 'vertical'] },
  },
  args: {
    appearance: 'default',
    orientation: 'horizontal',
    items: [
      { eventKey: 'home', label: 'Home' },
      { eventKey: 'about', label: 'About' },
      { eventKey: 'contact', label: 'Contact', disabled: false },
    ],
    activeKey: 'home',
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const VerticalTabs: Story = {
  args: {
    appearance: 'tabs',
    orientation: 'vertical',
    items: [
      { eventKey: 'settings', label: 'Settings' },
      { eventKey: 'profile', label: 'Profile' },
      { eventKey: 'logout', label: 'Logout', disabled: true },
    ],
    activeKey: 'settings',
  },
};
