import type { Meta, StoryObj } from '@storybook/react-vite';
import NavigationBreadcrumb from '../../components/Navigation/Breadcrumb/Breadcrumb';

const defaultItems = [
  { label: 'Home', href: '#' },
  { label: 'Library', href: '#' },
  { label: 'Data', href: '#' },
];

const meta: Meta<typeof NavigationBreadcrumb> = {
  title: 'Navigation/Breadcrumb',
  component: NavigationBreadcrumb,
  argTypes: {
    separator: { control: 'text' },
    disabledLast: { control: 'boolean' },
  },
  args: {
    separator: '/',
    disabledLast: false,
    items: defaultItems,
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div style={{ padding: 40 }}>
      <NavigationBreadcrumb
        {...args}
        items={args.items as React.ComponentProps<typeof NavigationBreadcrumb>['items']}
      />
    </div>
  ),
};

export const WithCustomSeparator: Story = {
  args: {
    separator: '→',
    disabledLast: true,
    items: [
      { label: 'Dashboard', href: '#' },
      { label: 'Settings', href: '#' },
      { label: 'Account' },
    ],
  },
  render: (args) => (
    <div style={{ padding: 40 }}>
      <NavigationBreadcrumb
        {...args}
        items={args.items as React.ComponentProps<typeof NavigationBreadcrumb>['items']}
      />
    </div>
  ),
};
