import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { NavigationSteps } from '../../components/Navigation/Steps/Steps';

const meta = {
  title: 'Navigation/Steps',
  component: NavigationSteps,
} satisfies Meta<typeof NavigationSteps>;

export default meta;

type Story = StoryObj<typeof NavigationSteps>;

function WithState(args: React.ComponentProps<typeof NavigationSteps>) {
  const [current, setCurrent] = useState(args.current);
  return (
    <NavigationSteps
      {...args}
      current={current}
      onStepClick={(index) => {
        setCurrent(index);
        args.onStepClick?.(index);
      }}
    />
  );
}

export const Default: Story = {
  render: (args) => <WithState {...args} />,
  args: {
    current: 1,
    steps: [
      { title: 'Step 1', description: 'Description for Step 1' },
      { title: 'Step 2', description: 'Description for Step 2' },
      { title: 'Step 3', description: 'Description for Step 3' },
    ],
    status: 'process',
    showDescription: true,
  },
};
