import type { Meta, StoryObj } from '@storybook/react-vite';
import { IntegrationCard } from '../components/IntegrationCard';
import { Stack } from '../components/Stack';

const meta = {
  title: 'Molecules/IntegrationCard',
  component: IntegrationCard,
  parameters: {
    layout: 'centered',
    componentSubtitle: 'Card component for displaying integration options',
  },
  tags: ['autodocs'],
  argTypes: {
    name: {
      control: 'text',
      description: 'Integration name',
    },
    integrationLogoPath: {
      control: 'text',
      description: 'Path to integration logo image',
    },
    enabled: {
      control: 'boolean',
      description: 'Whether the integration is enabled',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the toggle is disabled',
    },
  },
} satisfies Meta<typeof IntegrationCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    name: 'Salesforce',
    integrationLogoPath:
      'https://vonlabs-public-assets.s3.us-west-2.amazonaws.com/integrations/salesforce.svg',
    enabled: false,
    onToggle: (enabled) => console.log('Toggle changed:', enabled),
  },
};

export const Enabled: Story = {
  args: {
    name: 'Salesforce',
    integrationLogoPath:
      'https://vonlabs-public-assets.s3.us-west-2.amazonaws.com/integrations/salesforce.svg',
    enabled: true,
    onToggle: (enabled) => console.log('Toggle changed:', enabled),
  },
};

export const Disabled: Story = {
  args: {
    name: 'Salesforce',
    integrationLogoPath:
      'https://vonlabs-public-assets.s3.us-west-2.amazonaws.com/integrations/salesforce.svg',
    enabled: false,
    disabled: true,
  },
};

export const WithConfirmation: Story = {
  args: {
    name: 'Salesforce',
    integrationLogoPath:
      'https://vonlabs-public-assets.s3.us-west-2.amazonaws.com/integrations/salesforce.svg',
    enabled: true,
    onToggle: (enabled) => console.log('Toggle changed:', enabled),
    onRequestDisableConfirmation: async () => {
      return window.confirm('Are you sure you want to disable this integration?');
    },
  },
};

export const Gallery: Story = {
  render: () => (
    <Stack direction="vertical" spacing={3}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 300px)', gap: '16px' }}>
        <IntegrationCard
          name="Salesforce"
          integrationLogoPath="https://vonlabs-public-assets.s3.us-west-2.amazonaws.com/integrations/salesforce.svg"
          enabled={true}
          onToggle={(enabled) => console.log('Salesforce:', enabled)}
        />
        <IntegrationCard
          name="Gong"
          integrationLogoPath="https://vonlabs-public-assets.s3.us-west-2.amazonaws.com/integrations/gong.svg"
          enabled={false}
          onToggle={(enabled) => console.log('Gong:', enabled)}
        />
      </div>
    </Stack>
  ),
};
