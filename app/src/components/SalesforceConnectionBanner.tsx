import { motion } from "framer-motion";

interface SalesforceConnectionBannerProps {
  isSalesforceReady: boolean;
  shouldShakeBanner: boolean;
  onShakeComplete: () => void;
}

/**
 * Salesforce connection warning banner component
 * Displays a warning when Salesforce integration is not connected
 */
export function SalesforceConnectionBanner({
  isSalesforceReady,
  shouldShakeBanner,
  onShakeComplete,
}: SalesforceConnectionBannerProps) {
  if (isSalesforceReady) {
    return null;
  }

  return (
    <motion.div
      className="w-full"
      animate={
        shouldShakeBanner
          ? {
              x: [0, -10, 10, -10, 10, 0],
              transition: { duration: 0.4 },
            }
          : {}
      }
      onAnimationComplete={onShakeComplete}
    >
      <div className="p-2 mt-2 flex flex-row justify-between bg-amber-50 border border-amber-200 rounded-xl">
        <p className="pl-2 text-sm text-amber-800">
          Salesforce integration not connected.
        </p>
        <a
          href="/settings?tab=integrations"
          className="pr-2 text-sm text-von-purple hover:text-von-purple-600 font-medium hover:scale-105"
        >
          Go to Integrations →
        </a>
      </div>
    </motion.div>
  );
}
