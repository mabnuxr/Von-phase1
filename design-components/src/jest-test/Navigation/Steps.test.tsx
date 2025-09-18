import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  NavigationSteps,
  type NavigationStepsProps,
  type Step,
} from '../../components/Navigation/Steps/Steps';

describe('NavigationSteps Component', () => {
  const steps: Step[] = [
    { title: 'Step 1', description: 'Description 1' },
    { title: 'Step 2', description: 'Description 2' },
    { title: 'Step 3', description: 'Description 3' },
  ];

  const defaultProps: NavigationStepsProps = {
    current: 1,
    steps,
    onStepClick: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all steps with titles and descriptions', () => {
    render(<NavigationSteps {...defaultProps} />);

    steps.forEach((step) => {
      expect(screen.getByText(step.title)).toBeInTheDocument();
      expect(screen.getByText(step.description!)).toBeInTheDocument();
    });
  });

  it('highlights the current step correctly', () => {
    render(<NavigationSteps {...defaultProps} />);

    const currentStep = screen.getByText('Step 2').closest('.rs-steps-item');
    expect(currentStep).toHaveClass('rs-steps-item-active');
  });

  it('calls onStepClick when a step is clicked', async () => {
    const onStepClickMock = jest.fn();
    render(<NavigationSteps {...defaultProps} onStepClick={onStepClickMock} />);

    const step1 = screen.getByText('Step 1');
    await userEvent.click(step1);

    expect(onStepClickMock).toHaveBeenCalledTimes(1);
    expect(onStepClickMock).toHaveBeenCalledWith(0);

    const step3 = screen.getByText('Step 3');
    await userEvent.click(step3);

    expect(onStepClickMock).toHaveBeenCalledTimes(2);
    expect(onStepClickMock).toHaveBeenCalledWith(2);
  });

  it('does not show descriptions if showDescription=false', () => {
    render(<NavigationSteps {...defaultProps} showDescription={false} />);

    steps.forEach((step) => {
      if (step.description) {
        expect(screen.queryByText(step.description)).not.toBeInTheDocument();
      }
    });
  });
});
