import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Toggle } from '../../../../../components/forms/toggle';

const meta = {
  title: '3-Pane/Components/Forms/Toggle',
  component: Toggle,
  parameters: {
    layout: 'padded',
    backgrounds: {
      default: 'white',
      values: [{ name: 'white', value: '#ffffff' }],
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default
 *
 * Two-option toggle for switching between views.
 */
const DefaultWrapper = () => {
  const [value, setValue] = useState<'data' | 'dashboard'>('dashboard');

  return (
    <div style={{ width: '280px' }}>
      <Toggle
        options={[
          { value: 'data', label: 'Data' },
          { value: 'dashboard', label: 'Dashboard' },
        ]}
        value={value}
        onChange={setValue}
      />
    </div>
  );
};

export const Default: Story = {
  render: () => <DefaultWrapper />,
};

/**
 * Three Options
 *
 * Toggle with three options.
 */
const ThreeOptionsWrapper = () => {
  const [value, setValue] = useState<'all' | 'active' | 'archived'>('all');

  return (
    <div style={{ width: '320px' }}>
      <Toggle
        options={[
          { value: 'all', label: 'All' },
          { value: 'active', label: 'Active' },
          { value: 'archived', label: 'Archived' },
        ]}
        value={value}
        onChange={setValue}
      />
    </div>
  );
};

export const ThreeOptions: Story = {
  render: () => <ThreeOptionsWrapper />,
};

/**
 * View Mode
 *
 * Toggle for switching between list and grid view.
 */
const ViewModeWrapper = () => {
  const [value, setValue] = useState<'list' | 'grid'>('list');

  return (
    <div style={{ width: '200px' }}>
      <Toggle
        options={[
          { value: 'list', label: 'List' },
          { value: 'grid', label: 'Grid' },
        ]}
        value={value}
        onChange={setValue}
      />
    </div>
  );
};

export const ViewMode: Story = {
  render: () => <ViewModeWrapper />,
};

/**
 * Disabled
 *
 * Toggle in disabled state.
 */
export const Disabled: Story = {
  render: () => (
    <div style={{ width: '280px' }}>
      <Toggle
        options={[
          { value: 'data', label: 'Data' },
          { value: 'dashboard', label: 'Dashboard' },
        ]}
        value="dashboard"
        onChange={() => {}}
        disabled
      />
    </div>
  ),
};
