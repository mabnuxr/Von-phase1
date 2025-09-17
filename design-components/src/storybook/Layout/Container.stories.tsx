import type { Meta, StoryObj } from '@storybook/react-vite';
import LayoutContainer from '../../components/Layout/Container/Container';

const meta: Meta<typeof LayoutContainer> = {
  title: 'Layout/Container',
  component: LayoutContainer,
  argTypes: {
    showHeader: { control: 'boolean' },
    showFooter: { control: 'boolean' },
    showSidebar: { control: 'boolean' },
    sidebarPosition: {
      control: 'radio',
      options: ['left', 'right'],
    },
    headerText: { control: 'text' },
    footerText: { control: 'text' },
    height: { control: 'text' },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    showHeader: true,
    showFooter: true,
    showSidebar: false,
    headerText: 'Header',
    footerText: 'Footer',
    content: <div>This is the main content area.</div>,
  },
};

export const WithSidebarLeft: Story = {
  args: {
    showHeader: true,
    showFooter: true,
    showSidebar: true,
    sidebarPosition: 'left',
    sidebarContent: <div>Sidebar on the left</div>,
    content: <div>Main content with left sidebar.</div>,
  },
};

export const WithSidebarRight: Story = {
  args: {
    showHeader: true,
    showFooter: true,
    showSidebar: true,
    sidebarPosition: 'right',
    sidebarContent: <div>Sidebar on the right</div>,
    content: <div>Main content with right sidebar.</div>,
  },
};

export const NoHeaderFooter: Story = {
  args: {
    showHeader: false,
    showFooter: false,
    showSidebar: false,
    content: <div>Minimal layout with only content.</div>,
  },
};

export const CustomHeight: Story = {
  args: {
    showHeader: true,
    showFooter: true,
    height: '600px',
    content: <div>This layout has a custom height of 600px.</div>,
  },
};
