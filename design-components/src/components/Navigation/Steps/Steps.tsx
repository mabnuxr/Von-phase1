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
  status?: 'finish' | 'process' | 'waiting' | 'error';
  showDescription?: boolean;
  onStepClick?: (stepIndex: number) => void;
}

const NavigationSteps: React.FC<NavigationStepsProps> = ({
  current,
  steps,
  status = 'process',
  showDescription = true,
  onStepClick,
}) => {
  // keep "status" in the API for future support; currently unused by rsuite Steps
  void status;
  return (
    <Steps current={current}>
      {steps.map((step, index) => (
        <Steps.Item
          key={index}
          title={step.title}
          description={showDescription ? step.description : undefined}
          onClick={() => onStepClick?.(index)}
        />
      ))}
    </Steps>
  );
};

export { NavigationSteps };
export default NavigationSteps;
