import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChatTextIcon,
  GearSix,
  House,
  ChartBar,
  Database,
  Play,
  ArrowClockwise,
} from '@phosphor-icons/react';
import { AmbientGlow } from './AmbientGlow';
import { AgentProgressBar } from './AgentProgressBar';
import { AnimatedTable } from './AnimatedTable';
import { AnimatedChart } from './AnimatedChart';
import { SimulatedInteraction } from './SimulatedInteraction';
import { FinalizationOverlay } from './FinalizationOverlay';
import { ThinkingProcess } from '../ThinkingProcess';
import { usePrototypeOrchestrator } from './usePrototypeOrchestrator';
import { mockDataTables, mockDashboard } from '../mockData';
import type { DashboardWidget } from '../types';

// Von logo for collapsed sidebar
const VonLogoMini: React.FC = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M0 8C0 3.58172 3.58172 0 8 0H20C24.4183 0 28 3.58172 28 8V20C28 24.4183 24.4183 28 20 28H8C3.58172 28 0 24.4183 0 20V8Z"
      fill="url(#paint0_radial_mini)"
    />
    <path
      d="M15.937 11.1501C17.7702 12.4452 19.151 13.9556 19.9152 15.3235C20.7057 16.7385 20.7316 17.7813 20.3233 18.3594C19.9149 18.9375 18.9234 19.2616 17.3256 18.9894C15.7809 18.7262 13.8959 17.9296 12.0627 16.6345C10.2294 15.3394 8.84791 13.8285 8.08365 12.4605C7.29337 11.0458 7.26805 10.0032 7.67638 9.42519C8.08475 8.84721 9.07582 8.52262 10.6733 8.7947C12.2181 9.05788 14.1037 9.855 15.937 11.1501Z"
      stroke="white"
      strokeWidth="1.33"
    />
    <circle cx="13.9932" cy="14" r="7.835" stroke="white" strokeWidth="1.33" />
    <defs>
      <radialGradient
        id="paint0_radial_mini"
        cx="0"
        cy="0"
        r="1"
        gradientUnits="userSpaceOnUse"
        gradientTransform="translate(21.875 1.75) rotate(120.964) scale(30.6125)"
      >
        <stop stopColor="#FFF3EB" />
        <stop offset="0.26" stopColor="#FF9042" />
        <stop offset="1" stopColor="#854FFF" />
      </radialGradient>
    </defs>
  </svg>
);

export interface InteractivePrototypeProps {
  /**
   * Callback when prototype completes
   */
  onComplete?: () => void;
}

/**
 * InteractivePrototype - Full interactive demonstration of dashboard building
 */
export const InteractivePrototype: React.FC<InteractivePrototypeProps> = ({ onComplete }) => {
  const { state, start, dismiss, reset } = usePrototypeOrchestrator();
  const [hasStarted, setHasStarted] = useState(false);

  const handleStart = useCallback(() => {
    setHasStarted(true);
    start();
  }, [start]);

  const handleDismiss = useCallback(() => {
    dismiss();
    onComplete?.();
  }, [dismiss, onComplete]);

  const handleReset = useCallback(() => {
    setHasStarted(false);
    reset();
  }, [reset]);

  // Get the tables and charts to show
  const tablesToShow = mockDataTables.slice(0, 6);
  const metricsWidgets = mockDashboard.widgets.filter((w: DashboardWidget) => w.type === 'metric');
  const chartWidgets = mockDashboard.widgets.filter((w: DashboardWidget) => w.type === 'chart');

  return (
    <div className="h-screen w-full overflow-hidden  relative">
      {/* Ambient Glow Effect */}
      <AmbientGlow isActive={state.ambientGlowActive} intensity={0.5} animationSpeed={3} />

      {/* Agent Progress Bar */}
      <AgentProgressBar
        isVisible={state.isRunning && state.phase !== 'idle'}
        status={state.agentStatus}
        message={state.agentMessage}
        progress={state.agentProgress}
      />

      {/* Finalization Overlay */}
      <FinalizationOverlay
        phase={state.overlayPhase}
        onDismiss={handleDismiss}
        dashboardTitle="Accounts at Risk of Churning"
      />

      {/* Main Layout */}
      <div
        className="flex h-full w-full bg-white"
        style={{ paddingTop: state.isRunning && state.phase !== 'idle' ? 48 : 0 }}
      >
        {/* 1. Collapsed Navigation */}
        <div className="w-14 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col items-center py-3">
          <div className="mb-6">
            <VonLogoMini />
          </div>

          <div className="flex-1 flex flex-col items-center gap-1">
            <button className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer">
              <House size={20} weight="duotone" />
            </button>
            <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 text-gray-900 transition-colors cursor-pointer">
              <ChartBar size={20} weight="duotone" />
            </button>
            <button className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer">
              <Database size={20} weight="duotone" />
            </button>
            <button className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer">
              <ChatTextIcon size={20} weight="duotone" />
            </button>
          </div>

          <div className="flex flex-col items-center gap-1">
            <button className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer">
              <GearSix size={20} weight="duotone" />
            </button>
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-semibold">
              JD
            </div>
          </div>
        </div>

        {/* 2. Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Tab bar */}
          <div className="h-12 flex items-center px-4 border-b border-gray-200 bg-white">
            <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
              <button
                className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
                  state.activeTab === 'data'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Data
              </button>
              <button
                className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
                  state.activeTab === 'dashboard'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Dashboard
              </button>
            </div>
            <div className="ml-4 text-sm font-medium text-gray-900">
              Accounts at Risk of Churning
            </div>
          </div>

          {/* Content area with simulated interactions */}
          <div className="flex-1 overflow-auto p-6 bg-[#fbfbfd] relative">
            {/* Simulated Interactions Overlay */}
            <SimulatedInteraction
              type={state.currentInteraction || 'filter'}
              isActive={state.currentInteraction !== null}
              filterValue="Critical"
              sortColumn="Health Score"
            />

            {/* Start screen - before prototype starts */}
            {!hasStarted && (
              <div className="h-full flex items-center justify-center">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center max-w-md"
                >
                  <motion.div
                    className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, #8039e9, #FF9042)',
                    }}
                    whileHover={{ scale: 1.05 }}
                  >
                    <Play size={36} weight="fill" className="text-white ml-1" />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">
                    Interactive Dashboard Builder Demo
                  </h2>
                  <p className="text-gray-600 mb-8">
                    Watch how our AI agent builds a complete dashboard from a simple query:
                    <br />
                    <span className="text-purple-600 font-medium">
                      "Which accounts are at risk of churning?"
                    </span>
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleStart}
                    className="px-8 py-3 rounded-xl text-white font-medium text-lg cursor-pointer flex items-center gap-2 mx-auto"
                    style={{
                      background: 'linear-gradient(135deg, #8039e9, #FF9042)',
                    }}
                  >
                    <Play size={20} weight="fill" />
                    Start Demo
                  </motion.button>
                </motion.div>
              </div>
            )}

            {/* Data Tab Content */}
            {hasStarted && state.activeTab === 'data' && (
              <div className="space-y-4">
                <AnimatePresence>
                  {state.visibleTables.map((idx) => (
                    <AnimatedTable
                      key={tablesToShow[idx].id}
                      table={tablesToShow[idx]}
                      animate={true}
                      delay={0}
                      visibleRowCount={4}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Dashboard Tab Content */}
            {hasStarted && state.activeTab === 'dashboard' && (
              <div className="space-y-6">
                {/* Metrics Row */}
                <AnimatePresence>
                  {state.visibleMetrics && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="grid grid-cols-4 gap-4"
                    >
                      {metricsWidgets.map((widget: DashboardWidget, idx: number) => (
                        <AnimatedChart
                          key={widget.id}
                          widget={widget}
                          animate={true}
                          delay={idx * 200}
                          showConfigAnimation={false}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Charts Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <AnimatePresence>
                    {state.visibleCharts.map((idx) => (
                      <AnimatedChart
                        key={chartWidgets[idx].id}
                        widget={chartWidgets[idx]}
                        animate={true}
                        delay={0}
                        showConfigAnimation={true}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3. Right Chat Panel */}
        <div className="w-80 flex-shrink-0 border-l border-gray-200 bg-white flex flex-col">
          {/* Chat Header */}
          <div className="h-12 flex items-center justify-between px-4 border-b border-gray-200">
            <span className="text-sm font-semibold text-gray-900">AI Assistant</span>
            {hasStarted && state.phase === 'done' && (
              <button
                onClick={handleReset}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
              >
                <ArrowClockwise size={14} weight="bold" />
                <span className="text-xs">Restart</span>
              </button>
            )}
          </div>

          {/* Thinking Process */}
          <div className="flex-1 overflow-auto p-4">
            {hasStarted && state.thinkingSteps.length > 0 && (
              <ThinkingProcess
                steps={state.thinkingSteps}
                isThinking={state.agentStatus === 'working'}
              />
            )}

            {!hasStarted && (
              <div className="h-full flex items-center justify-center text-center p-4">
                <div>
                  <p className="text-sm text-gray-500 mb-2">
                    Start the demo to see the AI thinking process
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input (disabled during demo) */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl opacity-50">
              <input
                type="text"
                placeholder="Demo in progress..."
                disabled
                className="flex-1 bg-transparent text-sm text-gray-500 outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractivePrototype;
