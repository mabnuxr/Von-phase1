import { useState, useCallback, useRef } from 'react';
import type { AgentStatus } from './AgentProgressBar';
import type { OverlayPhase } from './FinalizationOverlay';
import type { InteractionType } from './SimulatedInteraction';
import type { ThinkingStep, DataViewTab } from '../types';

/**
 * Prototype phases in order
 */
export type PrototypePhase =
  | 'idle'
  | 'starting'
  | 'thinking'
  | 'tables-1'
  | 'tables-2'
  | 'tables-3'
  | 'tables-4'
  | 'tables-5'
  | 'tables-6'
  | 'interaction-filter'
  | 'interaction-sort'
  | 'switching-tab'
  | 'dashboard-thinking'
  | 'chart-1'
  | 'chart-2'
  | 'chart-3'
  | 'chart-4'
  | 'metrics'
  | 'finalizing'
  | 'complete'
  | 'done';

export interface OrchestratorState {
  phase: PrototypePhase;
  isRunning: boolean;
  agentStatus: AgentStatus;
  agentMessage: string;
  agentProgress: number;
  overlayPhase: OverlayPhase;
  activeTab: DataViewTab;
  thinkingSteps: ThinkingStep[];
  visibleTables: number[];
  visibleCharts: number[];
  visibleMetrics: boolean;
  currentInteraction: InteractionType | null;
  ambientGlowActive: boolean;
}

const initialThinkingSteps: ThinkingStep[] = [
  {
    id: 'ts-1',
    text: 'Analyzing your request to identify accounts at risk of churning...',
    status: 'pending',
  },
  {
    id: 'ts-2',
    text: 'Connecting to Salesforce to pull account and opportunity data...',
    status: 'pending',
  },
  {
    id: 'ts-3',
    text: 'Retrieving customer health metrics and engagement patterns...',
    status: 'pending',
  },
  { id: 'ts-4', text: 'Analyzing support ticket trends and NPS scores...', status: 'pending' },
  { id: 'ts-5', text: 'Running churn prediction model on account data...', status: 'pending' },
  {
    id: 'ts-6',
    text: 'Calculating risk scores and identifying key indicators...',
    status: 'pending',
  },
];

const dashboardThinkingSteps: ThinkingStep[] = [
  {
    id: 'ds-1',
    text: 'Designing dashboard layout for optimal data visualization...',
    status: 'pending',
  },
  {
    id: 'ds-2',
    text: 'Configuring metric cards for key performance indicators...',
    status: 'pending',
  },
  { id: 'ds-3', text: 'Creating bar chart for risk distribution by region...', status: 'pending' },
  { id: 'ds-4', text: 'Building engagement trend line chart...', status: 'pending' },
  { id: 'ds-5', text: 'Setting up ARR at risk visualization by industry...', status: 'pending' },
  { id: 'ds-6', text: 'Finalizing churn probability distribution chart...', status: 'pending' },
];

const initialState: OrchestratorState = {
  phase: 'idle',
  isRunning: false,
  agentStatus: 'idle',
  agentMessage: '',
  agentProgress: 0,
  overlayPhase: 'hidden',
  activeTab: 'data',
  thinkingSteps: [],
  visibleTables: [],
  visibleCharts: [],
  visibleMetrics: false,
  currentInteraction: null,
  ambientGlowActive: false,
};

/**
 * usePrototypeOrchestrator - Controls the entire interactive prototype sequence
 */
export function usePrototypeOrchestrator() {
  const [state, setState] = useState<OrchestratorState>(initialState);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  const clearAllTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }, []);

  const addTimeout = useCallback((callback: () => void, delay: number) => {
    const timeout = setTimeout(callback, delay);
    timeoutsRef.current.push(timeout);
    return timeout;
  }, []);

  const updateState = useCallback((updates: Partial<OrchestratorState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const updateThinkingStep = useCallback((stepId: string, status: ThinkingStep['status']) => {
    setState((prev) => ({
      ...prev,
      thinkingSteps: prev.thinkingSteps.map((step) =>
        step.id === stepId ? { ...step, status } : step
      ),
    }));
  }, []);

  const start = useCallback(() => {
    clearAllTimeouts();
    updateState({
      ...initialState,
      phase: 'starting',
      isRunning: true,
      ambientGlowActive: true,
      thinkingSteps: initialThinkingSteps.map((s) => ({ ...s, status: 'pending' as const })),
    });

    // Start sequence timings
    let time = 0;

    // Phase: Starting - Agent bar appears
    addTimeout(
      () => {
        updateState({
          phase: 'thinking',
          agentStatus: 'working',
          agentMessage: 'Analyzing query and gathering data...',
          agentProgress: 5,
        });
      },
      (time += 500)
    );

    // Thinking steps animate
    initialThinkingSteps.forEach((step) => {
      addTimeout(
        () => {
          updateThinkingStep(step.id, 'in-progress');
          updateState({ agentProgress: 5 + 20 / initialThinkingSteps.length });
        },
        (time += 600)
      );

      addTimeout(
        () => {
          updateThinkingStep(step.id, 'complete');
        },
        (time += 400)
      );
    });

    // Tables phase - show tables one by one
    for (let i = 1; i <= 6; i++) {
      addTimeout(
        () => {
          updateState({
            phase: `tables-${i}` as PrototypePhase,
            agentMessage: `Creating data table ${i} of 6...`,
            agentProgress: 25 + (i / 6) * 25,
            visibleTables: Array.from({ length: i }, (_, idx) => idx),
          });
        },
        (time += 1800)
      );
    }

    // Simulated filter interaction
    addTimeout(
      () => {
        updateState({
          phase: 'interaction-filter',
          agentMessage: 'Demonstrating filter interaction...',
          currentInteraction: 'filter',
          agentProgress: 55,
        });
      },
      (time += 2000)
    );

    // Simulated sort interaction
    addTimeout(
      () => {
        updateState({
          phase: 'interaction-sort',
          agentMessage: 'Demonstrating sort interaction...',
          currentInteraction: 'sort',
          agentProgress: 60,
        });
      },
      (time += 2500)
    );

    // Clear interaction and switch to dashboard
    addTimeout(
      () => {
        updateState({
          phase: 'switching-tab',
          agentMessage: 'Switching to dashboard view...',
          currentInteraction: null,
          agentProgress: 62,
        });
      },
      (time += 2000)
    );

    // Switch tab and start dashboard thinking
    addTimeout(
      () => {
        updateState({
          phase: 'dashboard-thinking',
          activeTab: 'dashboard',
          agentMessage: 'Building dashboard visualizations...',
          agentProgress: 65,
          thinkingSteps: dashboardThinkingSteps.map((s) => ({ ...s, status: 'pending' as const })),
        });
      },
      (time += 800)
    );

    // Dashboard thinking steps
    dashboardThinkingSteps.forEach((step) => {
      addTimeout(
        () => {
          updateThinkingStep(step.id, 'in-progress');
        },
        (time += 400)
      );

      addTimeout(
        () => {
          updateThinkingStep(step.id, 'complete');
        },
        (time += 300)
      );
    });

    // Show metrics first
    addTimeout(
      () => {
        updateState({
          phase: 'metrics',
          agentMessage: 'Adding metric cards...',
          agentProgress: 70,
          visibleMetrics: true,
        });
      },
      (time += 800)
    );

    // Charts one by one
    for (let i = 1; i <= 4; i++) {
      addTimeout(
        () => {
          updateState({
            phase: `chart-${i}` as PrototypePhase,
            agentMessage: `Creating chart ${i} of 4...`,
            agentProgress: 70 + (i / 4) * 25,
            visibleCharts: Array.from({ length: i }, (_, idx) => idx),
          });
        },
        (time += 3000)
      );
    }

    // Finalizing
    addTimeout(
      () => {
        updateState({
          phase: 'finalizing',
          agentMessage: 'Finalizing dashboard...',
          agentProgress: 98,
          overlayPhase: 'finalizing',
        });
      },
      (time += 2000)
    );

    // Complete
    addTimeout(
      () => {
        updateState({
          phase: 'complete',
          agentStatus: 'complete',
          agentMessage: 'Dashboard complete!',
          agentProgress: 100,
          overlayPhase: 'complete',
        });
      },
      (time += 2000)
    );
  }, [clearAllTimeouts, addTimeout, updateState, updateThinkingStep]);

  const dismiss = useCallback(() => {
    updateState({
      phase: 'done',
      overlayPhase: 'hidden',
      ambientGlowActive: false,
      agentStatus: 'idle',
    });

    // Hide agent bar after a moment
    addTimeout(() => {
      updateState({ isRunning: false });
    }, 500);
  }, [addTimeout, updateState]);

  const reset = useCallback(() => {
    clearAllTimeouts();
    setState(initialState);
  }, [clearAllTimeouts]);

  return {
    state,
    start,
    dismiss,
    reset,
  };
}

export default usePrototypeOrchestrator;
