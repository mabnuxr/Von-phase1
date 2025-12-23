import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThreePaneLayout } from './ThreePaneLayout';
import { BuildModeLayout } from './BuildModeLayout';
import type { BuildMode, BuildPhase, ChatMessage, ThinkingStep, ProgressStep } from './types';
import { mockThinkingSteps, mockProgressSteps } from './mockData';

// Sample chat items for the sidebar
const sampleChatItems = [
  { id: '1', label: 'Q4 Pipeline Review' },
  { id: '2', label: 'Forecast Analysis' },
  { id: '3', label: 'Rep Performance' },
  { id: '4', label: 'Deal Inspection' },
  { id: '5', label: 'Account Health Check' },
];

export interface DashboardBuilderDemoProps {
  /**
   * User's first name
   */
  userName?: string;

  /**
   * Whether to start in build mode
   */
  startInBuildMode?: boolean;

  /**
   * Whether to show the building animation
   */
  showBuildingAnimation?: boolean;
}

/**
 * DashboardBuilderDemo - Interactive prototype demonstrating the full flow
 *
 * This component demonstrates:
 * 1. Ask Mode - Initial 3-pane layout with chat
 * 2. Build Mode Transition - Animation when entering build mode
 * 3. Build Mode - 4-column layout with data explorer, dashboard, and chat
 * 4. AI Thinking - Animated thinking process
 * 5. Progress Timeline - Step-by-step build progress
 */
export const DashboardBuilderDemo: React.FC<DashboardBuilderDemoProps> = ({
  userName = 'John',
  startInBuildMode = false,
  showBuildingAnimation = true,
}) => {
  const [mode, setMode] = useState<BuildMode>(startInBuildMode ? 'build' : 'ask');
  const [buildPhase, setBuildPhase] = useState<BuildPhase>('idle');
  const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([]);
  const [progressSteps, setProgressSteps] = useState<ProgressStep[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState('1');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Simulate the thinking process
  const simulateThinking = useCallback(async () => {
    const steps = mockThinkingSteps.map((s) => ({ ...s, status: 'pending' as const }));
    setThinkingSteps(steps);

    for (let i = 0; i < steps.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setThinkingSteps((prev) =>
        prev.map((s, idx) => ({
          ...s,
          status: idx < i ? 'complete' : idx === i ? 'in-progress' : 'pending',
        }))
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
    setThinkingSteps((prev) => prev.map((s) => ({ ...s, status: 'complete' as const })));
  }, []);

  // Simulate the build progress
  const simulateBuildProgress = useCallback(async () => {
    const steps = mockProgressSteps.map((s) => ({ ...s, status: 'pending' as const }));
    setProgressSteps(steps);

    for (let i = 0; i < steps.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setProgressSteps((prev) =>
        prev.map((s, idx) => ({
          ...s,
          status: idx < i ? 'complete' : idx === i ? 'in-progress' : 'pending',
        }))
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
    setProgressSteps((prev) => prev.map((s) => ({ ...s, status: 'complete' as const })));
  }, []);

  // Handle sending a message in build mode
  const handleBuildMessage = useCallback(
    async (message: string) => {
      // Add user message
      const userMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'user',
        content: message,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Start the build process
      setBuildPhase('thinking');
      setIsTransitioning(true);

      // Simulate thinking
      if (showBuildingAnimation) {
        await simulateThinking();
        setBuildPhase('gathering-data');
        await simulateBuildProgress();
      }

      // Add AI response
      const aiMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: `I've analyzed your customer data and identified **8 accounts** that are showing signs of potential churn. Here's what I found:

**Key Insights:**
- **Total ARR at Risk:** $4.95M across all flagged accounts
- **Critical Accounts:** 3 accounts require immediate attention
- **Average Health Score:** 37 (down 8 points from last quarter)

The main risk factors I identified are:
1. **Declining engagement** - Login frequency dropped 40% over 6 months
2. **Rising support tickets** - 3.4x increase in open tickets
3. **Low feature adoption** - Only 35% of available features being used

I've created a dashboard with detailed breakdowns by region, industry, and individual account metrics. You can drill down into any visualization for more details.`,
        timestamp: new Date(),
        thinkingSteps: mockThinkingSteps,
        isThinkingCollapsed: true,
      };
      setMessages((prev) => [...prev, aiMessage]);

      setBuildPhase('complete');
      setMode('build');
      setIsTransitioning(false);
    },
    [showBuildingAnimation, simulateThinking, simulateBuildProgress]
  );

  // Handle message send from 3-pane layout
  const handleAskMessage = useCallback(
    (message: string, messageMode: BuildMode) => {
      if (messageMode === 'build' || message.toLowerCase().includes('dashboard') || message.toLowerCase().includes('build')) {
        handleBuildMessage(message);
      } else {
        // Regular ask mode - just add messages
        const userMessage: ChatMessage = {
          id: `msg-${Date.now()}`,
          role: 'user',
          content: message,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, userMessage]);

        setTimeout(() => {
          const aiMessage: ChatMessage = {
            id: `msg-${Date.now() + 1}`,
            role: 'assistant',
            content: `I can help you with that! If you'd like me to build a dashboard with this data, just switch to Build mode using the toggle above the input field.`,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, aiMessage]);
        }, 1000);
      }
    },
    [handleBuildMessage]
  );

  // Handle exiting build mode
  const handleExitBuildMode = useCallback(() => {
    setMode('ask');
    setBuildPhase('idle');
  }, []);

  return (
    <div className="h-screen w-full overflow-hidden">
      <AnimatePresence mode="wait">
        {mode === 'ask' && !isTransitioning ? (
          <motion.div
            key="ask-mode"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="h-full w-full"
          >
            <ThreePaneLayout
              userName={userName}
              chatItems={sampleChatItems}
              selectedChatId={selectedChatId}
              onChatClick={setSelectedChatId}
              onSendMessage={handleAskMessage}
              mode={mode}
              onModeChange={setMode}
              isSidebarCollapsed={isSidebarCollapsed}
              onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
              avatarLabel="JD"
              userDisplayName="John Doe"
              userEmail="john@company.com"
            />
          </motion.div>
        ) : (
          <motion.div
            key="build-mode"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full w-full"
          >
            <BuildModeLayout
              initialMessages={messages}
              onExitBuildMode={handleExitBuildMode}
              showProgress={buildPhase !== 'complete' && buildPhase !== 'idle'}
              buildComplete={buildPhase === 'complete'}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DashboardBuilderDemo;
