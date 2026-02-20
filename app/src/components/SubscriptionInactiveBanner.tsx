import { motion } from "framer-motion";

interface SubscriptionInactiveBannerProps {
  isTenantDisabled: boolean;
  shouldShakeBanner: boolean;
  onShakeComplete: () => void;
}

/**
 * Subscription inactive warning banner component
 * Displays a warning when the tenant's subscription is inactive
 */
export function SubscriptionInactiveBanner({
  isTenantDisabled,
  shouldShakeBanner,
  onShakeComplete,
}: SubscriptionInactiveBannerProps) {
  if (!isTenantDisabled) {
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
      <div className="p-2 mt-2 flex flex-row items-center bg-red-50 border border-red-200 rounded-xl">
        <p className="pl-2 text-sm text-red-800">
          Your organization's access is currently inactive. To continue using
          the platform, please contact us.
        </p>
      </div>
    </motion.div>
  );
}
