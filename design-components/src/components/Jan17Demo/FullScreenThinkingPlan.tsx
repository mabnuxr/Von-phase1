import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SpinnerGapIcon,
  CheckCircleIcon,
  CaretDownIcon,
  CaretRightIcon,
  CloudIcon,
  TableIcon,
  ChartBarIcon,
  DatabaseIcon,
} from '@phosphor-icons/react';
import { Streamdown } from 'streamdown';
import { PrimaryButton, GhostButton } from '../forms/buttons';
import { StandardChatInput } from '../Chat/StandardChatInput';

// ============================================================================
// Types
// ============================================================================

export interface ThinkingStep {
  id: string;
  text: string;
  status: 'pending' | 'in-progress' | 'complete';
  icon?: 'salesforce' | 'database' | 'chart' | 'table';
  detail?: string; // Additional detail text for expanded view
}

export interface DashboardPlan {
  title: string;
  description: string;
  kpis: string[];
  charts: string[];
  table: string;
}

export interface FullScreenThinkingPlanProps {
  userMessage: string;
  thinkingSteps: ThinkingStep[];
  isThinking: boolean;
  elapsedTime: number;
  plan?: DashboardPlan;
  showPlan: boolean;
  onBuildDashboard?: () => void;
  onDiscardPlan?: () => void;
  userName?: string;
  userEmail?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

const formatElapsedTime = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
};

/**
 * Get user initials from name or email
 */
function getUserInitials(name?: string, email?: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    } else if (parts.length === 1 && parts[0].length > 0) {
      return parts[0][0].toUpperCase();
    }
  }
  if (email && email.trim()) {
    const emailUsername = email.split('@')[0];
    if (emailUsername.length >= 2) {
      return emailUsername.substring(0, 2).toUpperCase();
    } else if (emailUsername.length === 1) {
      return emailUsername[0].toUpperCase();
    }
  }
  return 'U';
}

/**
 * Convert plan to markdown format
 */
function planToMarkdown(plan: DashboardPlan): string {
  const kpiList = plan.kpis.map((kpi) => `- ${kpi}`).join('\n');
  const chartList = plan.charts.map((chart) => `- ${chart}`).join('\n');

  return `## ${plan.title}

${plan.description}

### KPI Cards
${kpiList}

### Charts
${chartList}

### Data Table
- ${plan.table}`;
}

// ============================================================================
// Von Logo Component
// ============================================================================

const VonLogo: React.FC = () => (
  <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0">
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M0 8C0 3.58172 3.58172 0 8 0H20C24.4183 0 28 3.58172 28 8V20C28 24.4183 24.4183 28 20 28H8C3.58172 28 0 24.4183 0 20V8Z"
        fill="url(#paint0_radial_thinking)"
      />
      <path
        d="M15.937 11.1501C17.7702 12.4452 19.151 13.9556 19.9152 15.3235C20.7057 16.7385 20.7316 17.7813 20.3233 18.3594C19.9149 18.9375 18.9234 19.2616 17.3256 18.9894C15.7809 18.7262 13.8959 17.9296 12.0627 16.6345C10.2294 15.3394 8.84791 13.8285 8.08365 12.4605C7.29337 11.0458 7.26805 10.0032 7.67638 9.42519C8.08475 8.84721 9.07582 8.52262 10.6733 8.7947C12.2181 9.05788 14.1037 9.855 15.937 11.1501Z"
        stroke="white"
        strokeWidth="1.33"
      />
      <circle cx="13.9932" cy="14" r="7.835" stroke="white" strokeWidth="1.33" />
      <defs>
        <radialGradient
          id="paint0_radial_thinking"
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
  </div>
);

// ============================================================================
// User Avatar Component
// ============================================================================

const UserAvatar: React.FC<{ initials: string }> = ({ initials }) => (
  <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-semibold shadow-sm flex-shrink-0">
    {initials}
  </div>
);

// ============================================================================
// Thinking Step Icon
// ============================================================================

const StepIcon: React.FC<{ icon?: string; status: string }> = ({ icon, status }) => {
  const iconClass = status === 'in-progress' ? 'text-indigo-600' : 'text-gray-500';
  const size = 16;

  switch (icon) {
    case 'salesforce':
      return <CloudIcon size={size} weight="regular" className={iconClass} />;
    case 'database':
      return <DatabaseIcon size={size} weight="regular" className={iconClass} />;
    case 'chart':
      return <ChartBarIcon size={size} weight="regular" className={iconClass} />;
    case 'table':
      return <TableIcon size={size} weight="regular" className={iconClass} />;
    default:
      return <DatabaseIcon size={size} weight="regular" className={iconClass} />;
  }
};

// ============================================================================
// Main Component
// ============================================================================

export const FullScreenThinkingPlan: React.FC<FullScreenThinkingPlanProps> = ({
  userMessage,
  thinkingSteps,
  isThinking,
  elapsedTime,
  plan,
  showPlan,
  onBuildDashboard,
  onDiscardPlan,
  userName = 'User',
  userEmail,
}) => {
  const [isThinkingCollapsed, setIsThinkingCollapsed] = useState(false);
  const wasThinkingRef = useRef(isThinking);

  const completedCount = thinkingSteps.filter((s) => s.status === 'complete').length;
  const totalCount = thinkingSteps.length;
  const allComplete = completedCount === totalCount && totalCount > 0 && !isThinking;

  const visibleSteps = thinkingSteps.filter((s) => s.status !== 'pending');
  const userInitials = getUserInitials(userName, userEmail);

  // Auto-collapse when thinking completes
  useEffect(() => {
    // If we were thinking and now we're done, auto-collapse
    if (wasThinkingRef.current && !isThinking && allComplete) {
      // Small delay for better UX - let user see the final step complete
      const timer = setTimeout(() => {
        setIsThinkingCollapsed(true);
      }, 800);
      return () => clearTimeout(timer);
    }
    wasThinkingRef.current = isThinking;
  }, [isThinking, allComplete]);

  // Animation variants for timeline
  const stepVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const },
    },
  };

  const lineVariants = {
    hidden: { scaleY: 0 },
    visible: {
      scaleY: 1,
      transition: { duration: 0.4, ease: [0.4, 0, 0.6, 1] as const },
    },
  };

  const dotVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as const },
    },
  };

  return (
    <div className="h-full w-full bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden flex flex-col">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8">
          {/* User Message with Avatar */}
          <div className="flex justify-end mb-6">
            <div className="flex items-start gap-3 max-w-[85%]">
              <div className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-2.5">
                <p className="text-[13px] text-gray-900">{userMessage}</p>
              </div>
              <UserAvatar initials={userInitials} />
            </div>
          </div>

          {/* Assistant Response with Von Logo */}
          <div className="flex items-start gap-3 mb-6">
            <VonLogo />
            <div className="flex-1 min-w-0">
              {/* Thinking Block */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="mb-4"
              >
                <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                  {/* Header */}
                  <button
                    onClick={() => setIsThinkingCollapsed(!isThinkingCollapsed)}
                    className="w-full px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-100/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {isThinkingCollapsed ? (
                        <CaretRightIcon
                          size={14}
                          weight="bold"
                          className="text-gray-500 flex-shrink-0"
                        />
                      ) : (
                        <CaretDownIcon
                          size={14}
                          weight="bold"
                          className="text-gray-500 flex-shrink-0"
                        />
                      )}

                      {allComplete ? (
                        <CheckCircleIcon
                          size={18}
                          weight="fill"
                          className="text-emerald-600 flex-shrink-0"
                        />
                      ) : (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="flex-shrink-0"
                        >
                          <SpinnerGapIcon
                            size={18}
                            weight="regular"
                            className="text-indigo-600"
                          />
                        </motion.div>
                      )}

                      {allComplete ? (
                        <span className="text-[13px] text-gray-700">
                          Completed in {formatElapsedTime(elapsedTime)}
                        </span>
                      ) : (
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="text-[13px] font-medium text-gray-900 flex-shrink-0">
                            Thinking
                          </span>
                          <span className="text-[13px] text-gray-500">·</span>
                          <span className="text-[13px] text-gray-700 truncate">
                            {thinkingSteps.find((s) => s.status === 'in-progress')?.text ||
                              `${completedCount}/${totalCount} steps`}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                      {!allComplete && (
                        <span className="text-xs text-gray-500 tabular-nums">
                          {formatElapsedTime(elapsedTime)}
                        </span>
                      )}
                    </div>
                  </button>

                  {/* Timeline Steps */}
                  <AnimatePresence>
                    {!isThinkingCollapsed && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-gray-100 bg-white px-4 py-4">
                          <div className="space-y-0">
                            {visibleSteps.map((step, idx) => {
                              const isLastStep = idx === visibleSteps.length - 1;

                              return (
                                <motion.div
                                  key={step.id}
                                  variants={stepVariants}
                                  initial="hidden"
                                  animate="visible"
                                  className="relative"
                                >
                                  <div className="flex items-stretch gap-3">
                                    {/* Timeline column (dot + line) */}
                                    <div className="relative flex flex-col items-center w-6 pt-1">
                                      {/* Dot with icon */}
                                      <motion.div
                                        variants={dotVariants}
                                        className={`
                                          w-6 h-6 rounded-full flex items-center justify-center z-10
                                          ${step.status === 'in-progress' ? 'bg-indigo-50' : step.status === 'complete' ? 'bg-emerald-50' : 'bg-gray-100'}
                                        `}
                                      >
                                        {step.status === 'complete' ? (
                                          <CheckCircleIcon
                                            size={14}
                                            weight="fill"
                                            className="text-emerald-600"
                                          />
                                        ) : step.status === 'in-progress' ? (
                                          <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{
                                              duration: 1,
                                              repeat: Infinity,
                                              ease: 'linear',
                                            }}
                                          >
                                            <SpinnerGapIcon
                                              size={14}
                                              weight="regular"
                                              className="text-indigo-600"
                                            />
                                          </motion.div>
                                        ) : (
                                          <StepIcon icon={step.icon} status={step.status} />
                                        )}
                                      </motion.div>

                                      {/* Connecting line */}
                                      {!isLastStep && (
                                        <motion.div
                                          variants={lineVariants}
                                          className="w-[1.5px] bg-gray-200 flex-1 rounded-full min-h-[16px]"
                                          style={{ transformOrigin: 'top' }}
                                        />
                                      )}
                                    </div>

                                    {/* Content column */}
                                    <div className={`flex-1 ${!isLastStep ? 'pb-3' : ''}`}>
                                      <div className="flex items-center justify-between py-0.5">
                                        <span
                                          className={`
                                            text-[13px]
                                            ${step.status === 'in-progress' ? 'text-gray-900 font-medium' : step.status === 'complete' ? 'text-gray-800' : 'text-gray-600'}
                                          `}
                                        >
                                          {step.text}
                                        </span>
                                      </div>
                                      {/* Detail text if available */}
                                      {step.detail && step.status === 'complete' && (
                                        <p className="text-xs text-gray-500 mt-0.5">
                                          {step.detail}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>

              {/* Plan as Markdown */}
              <AnimatePresence>
                {showPlan && plan && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                  >
                    {/* Intro text */}
                    <div className="mb-4">
                      <p className="text-[13px] text-gray-900 leading-relaxed">
                        I found the data you need. Here's my plan for your dashboard:
                      </p>
                    </div>

                    {/* Plan Markdown */}
                    <div className="prose-sm markdown-body max-w-none mb-4">
                      <Streamdown
                        parseIncompleteMarkdown={false}
                        isAnimating={false}
                        controls={{ table: true }}
                      >
                        {planToMarkdown(plan)}
                      </Streamdown>
                    </div>

                    {/* Helper text about modifying plan */}
                    <div className="mb-6">
                      <p className="text-xs text-gray-500">
                        You can modify this plan by sharing more details or changes in the chat
                        below.
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3">
                      <PrimaryButton onClick={onBuildDashboard}>Approve Plan</PrimaryButton>
                      <GhostButton onClick={onDiscardPlan}>Discard Plan</GhostButton>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Input */}
      <div className="flex-shrink-0 px-6 pb-6">
        <div className="max-w-3xl mx-auto">
          <StandardChatInput
            placeholder="Type a message to modify the plan..."
            disabled={!showPlan}
            onSend={(message) => console.log('Send:', message)}
          />
        </div>
      </div>
    </div>
  );
};

export default FullScreenThinkingPlan;
