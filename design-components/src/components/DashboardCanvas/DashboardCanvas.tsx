import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, SpinnerGap, WarningCircle } from '@phosphor-icons/react';
import { THESYS_API_URL } from '../../constants';

// Lazy load TheSys components to reduce initial bundle size
const TheSysRenderer = React.lazy(() =>
  Promise.all([import('@thesysai/genui-sdk'), import('@crayonai/react-ui/styles/index.css')]).then(
    ([thesys]) => ({
      default: ({ c1Response }: { c1Response: string }) => (
        <thesys.ThemeProvider>
          <thesys.C1Component c1Response={c1Response} isStreaming={false} />
        </thesys.ThemeProvider>
      ),
    })
  )
);

export interface DashboardCanvasProps {
  title: string;
  messageContent: string;
  messageId: string;
  isOpen: boolean;
  onClose: () => void;
  thesysApiKey: string;
  thesysApiUrl?: string;
}

/**
 * Extract only the final response content, excluding any thinking/reasoning text
 */
function extractFinalContent(messageContent: string): string {
  const thinkingPatterns = [
    /<thinking>[\s\S]*?<\/thinking>/gi,
    /\[thinking\][\s\S]*?\[\/thinking\]/gi,
    /<reasoning>[\s\S]*?<\/reasoning>/gi,
  ];

  let content = messageContent;
  for (const pattern of thinkingPatterns) {
    content = content.replace(pattern, '');
  }

  return content.trim();
}

/**
 * Dashboard Canvas component that renders Thesys-generated UI
 * Appears when user clicks "Convert to Dashboard" on a message
 */
export const DashboardCanvas: React.FC<DashboardCanvasProps> = ({
  title,
  messageContent,
  messageId,
  isOpen,
  onClose,
  thesysApiKey,
  thesysApiUrl = THESYS_API_URL,
}) => {
  const [c1Response, setC1Response] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchDashboard = useCallback(async () => {
    if (!messageContent || !thesysApiKey || !isOpen) {
      return;
    }

    const finalContent = extractFinalContent(messageContent);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${thesysApiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${thesysApiKey}`,
        },
        body: JSON.stringify({
          model: 'c1-exp/anthropic/claude-3.5-haiku/v-20250709',
          messages: [
            {
              role: 'system',
              content: `You are a dashboard generator. Analyze the provided data and create a comprehensive, visually appealing dashboard with:
- Key metrics displayed prominently
- Charts for numerical/time-series data
- Tables for structured data
- Clear section headings

Generate a single cohesive dashboard layout that presents all the information clearly.`,
            },
            {
              role: 'user',
              content: finalContent,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      const responseJson = await response.json();
      const content = responseJson.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('No content in API response');
      }

      setC1Response(content);
    } catch (err) {
      console.error('[DashboardCanvas] Error:', err);
      setError(err instanceof Error ? err : new Error('Failed to generate dashboard'));
    } finally {
      setIsLoading(false);
    }
  }, [messageContent, thesysApiKey, thesysApiUrl, isOpen]);

  useEffect(() => {
    if (isOpen) {
      fetchDashboard();
    }
  }, [isOpen, fetchDashboard]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="flex-1 flex flex-col bg-white rounded-lg border border-gray-200 shadow-xs overflow-hidden min-h-0"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50 shrink-0">
            <h2 className="text-lg font-semibold text-gray-900">{title || 'Dashboard'}</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
              aria-label="Close dashboard"
            >
              <X size={20} weight="bold" />
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-auto p-6 min-h-0">
            {/* Loading State */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <SpinnerGap size={48} className="text-indigo-500" />
                </motion.div>
                <p className="text-gray-600">Generating dashboard...</p>
                <div className="w-64 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-indigo-500 rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Error State */}
            {error && !isLoading && (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <WarningCircle size={48} className="text-amber-500" />
                <p className="text-gray-700 font-medium">Failed to generate dashboard</p>
                <p className="text-sm text-gray-500 max-w-md text-center">{error.message}</p>
                <button
                  onClick={fetchDashboard}
                  className="px-4 py-2 text-sm bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors cursor-pointer"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Dashboard Content */}
            {c1Response && !isLoading && !error && (
              <Suspense
                fallback={
                  <div className="flex items-center justify-center h-full">
                    <SpinnerGap size={32} className="text-indigo-500 animate-spin" />
                  </div>
                }
              >
                <TheSysRenderer c1Response={c1Response} />
              </Suspense>
            )}

            {/* Empty State */}
            {!isLoading && !error && !c1Response && (
              <div className="flex flex-col items-center justify-center h-full gap-2">
                <p className="text-gray-500">No dashboard content</p>
                <p className="text-sm text-gray-400">
                  Try converting a message with data or metrics
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 shrink-0">
            <p className="text-xs text-gray-500">
              Generated from message: <span className="font-mono">{messageId.slice(0, 8)}...</span>
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DashboardCanvas;
