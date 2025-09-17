import type { Meta, StoryFn } from '@storybook/react';
import NavigationNavbar from '../../components/Navigation/Navbar/Navbar';

export default {
  title: 'Navigation/Navbar',
  component: NavigationNavbar,
  argTypes: {
    appearance: {
      control: 'select',
      options: ['default', 'inverse', 'subtle'],
    },
    placement: {
      control: 'select',
      options: ['left', 'center', 'right'],
    },
    brand: {
      control: 'text',
    },
  },
} as Meta<typeof NavigationNavbar>;

const Template: StoryFn<NavigationNavbarProps> = (args) => (
  <div style={{ padding: 40 }}>
    <NavigationNavbar {...args} />
  </div>
);

export const Default = Template.bind({});
Default.args = {
  brand: 'MyBrand',
  appearance: 'default',
  placement: 'right',
  links: [
    { eventKey: 'home', label: 'Home' },
    { eventKey: 'about', label: 'About' },
    { eventKey: 'login', label: 'Login', disabled: false },
  ],
};

export const InverseWithCenter = Template.bind({});
InverseWithCenter.args = {
  brand: 'MyApp',
  appearance: 'inverse',
  placement: 'center',
  links: [
    { eventKey: 'dashboard', label: 'Dashboard' },
    { eventKey: 'settings', label: 'Settings' },
    { eventKey: 'logout', label: 'Logout', disabled: true },
  ],
};
