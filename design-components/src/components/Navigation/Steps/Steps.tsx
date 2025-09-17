// components/NavigationSteps.tsx

import React from 'react';
import { Steps } from 'rsuite';

export type Step = {
  title: string;
  description?: string;
};

export interface NavigationStepsProps {
  current: number;
  steps: Step[];
  size?: 'lg' | 'md' | 'sm';
  status?: 'finish' | 'process' | 'waiting' | 'error';
  showDescription?: boolean;
  onStepClick?: (stepIndex: number) => void;
}

const NavigationSteps: React.FC<NavigationStepsProps> = ({
  current,
  steps,
  size = 'md',
  status = 'process',
  showDescription = true,
  onStepClick,
}) => {
  return (
    <Steps current={current} size={size} status={status}>
      {steps.map((step, index) => (
        <Steps.Item
          key={index}
          title={step.title}
          description={showDescription ? step.description : undefined}
          onClick={() => onStepClick?.(index)}
          disabled={index > current}
        />
      ))}
    </Steps>
  );
};

export default NavigationSteps;