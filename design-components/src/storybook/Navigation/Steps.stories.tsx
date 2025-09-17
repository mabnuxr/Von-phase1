import React, { useState } from 'react';
import type { Meta, Story } from '@storybook/react';
import NavigationStep from '../../components/Navigation/Steps/Steps'

export default {
  title: 'Navigation/Step',
  component: NavigationStep,
} as Meta;

const Template: Story<NavigationStepProps> = (args: { current: any; onStepClick: (arg0: any) => void; }) => {
  const [currentStep, setCurrentStep] = useState(args.current);

  return (
    <NavigationStep
      {...args}
      current={currentStep}
      onStepClick={(index) => {
        setCurrentStep(index);
        args.onStepClick?.(index);
      }}
    />
  );
};

export const Default = Template.bind({});
Default.args = {
  current: 1,
  steps: [
    { title: 'Step 1', description: 'Description for Step 1' },
    { title: 'Step 2', description: 'Description for Step 2' },
    { title: 'Step 3', description: 'Description for Step 3' },
  ],
  size: 'md',
  status: 'process',
  showDescription: true,
};
