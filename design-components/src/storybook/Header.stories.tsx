import type { Meta, StoryObj } from '@storybook/react-vite';
import { Header } from '../components/Header';
import { LOGO_URL } from '../constants';

const meta = {
  title: 'Organisms/Header',
  component: Header,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    logoSrc: {
      control: 'text',
      description: 'Logo image source URL',
    },
    showMenu: {
      control: 'boolean',
      description: 'Show hamburger menu icon',
    },
    onLogoClick: { action: 'logo clicked' },
    onMenuClick: { action: 'menu clicked' },
  },
} satisfies Meta<typeof Header>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default Header
 *
 * Simple header with logo only.
 */
export const Default: Story = {
  args: {
    logoSrc: LOGO_URL,
    showMenu: false,
  },
};

/**
 * Header with Menu
 *
 * Header with logo and hamburger menu icon.
 */
export const WithMenu: Story = {
  args: {
    logoSrc: LOGO_URL,
    showMenu: true,
  },
};

/**
 * In Page Context
 *
 * Header shown within a page layout with gray background.
 */
export const InPageContext: Story = {
  args: {
    logoSrc: LOGO_URL,
    showMenu: false,
  },
  decorators: [
    (Story) => (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#f5f5f7',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            margin: '32px 24px 12px 24px',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <Story />
        </div>
      </div>
    ),
  ],
};
