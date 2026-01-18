import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface AmbientGlowProps {
  /**
   * Whether the glow effect is active
   */
  isActive: boolean;

  /**
   * Intensity of the glow (0-1)
   */
  intensity?: number;

  /**
   * Speed of the color animation in seconds
   */
  animationSpeed?: number;
}

/**
 * AmbientGlow - Creates an animated gradient glow effect around the page edges
 * Transitions between Von brand colors (purple to orange)
 */
export const AmbientGlow: React.FC<AmbientGlowProps> = ({
  isActive,
  intensity = 0.6,
  animationSpeed = 3,
}) => {
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 pointer-events-none z-[100]"
          style={{ overflow: 'hidden' }}
        >
          {/* Top edge glow */}
          <motion.div
            className="absolute top-0 left-0 right-0 h-24"
            style={{
              background: `linear-gradient(to bottom, rgba(128, 57, 233, ${intensity * 0.4}), transparent)`,
            }}
            animate={{
              background: [
                `linear-gradient(to bottom, rgba(128, 57, 233, ${intensity * 0.4}), transparent)`,
                `linear-gradient(to bottom, rgba(255, 144, 66, ${intensity * 0.4}), transparent)`,
                `linear-gradient(to bottom, rgba(128, 57, 233, ${intensity * 0.4}), transparent)`,
              ],
            }}
            transition={{
              duration: animationSpeed,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Bottom edge glow */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-24"
            style={{
              background: `linear-gradient(to top, rgba(255, 144, 66, ${intensity * 0.4}), transparent)`,
            }}
            animate={{
              background: [
                `linear-gradient(to top, rgba(255, 144, 66, ${intensity * 0.4}), transparent)`,
                `linear-gradient(to top, rgba(128, 57, 233, ${intensity * 0.4}), transparent)`,
                `linear-gradient(to top, rgba(255, 144, 66, ${intensity * 0.4}), transparent)`,
              ],
            }}
            transition={{
              duration: animationSpeed,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Left edge glow */}
          <motion.div
            className="absolute top-0 left-0 bottom-0 w-24"
            style={{
              background: `linear-gradient(to right, rgba(128, 57, 233, ${intensity * 0.3}), transparent)`,
            }}
            animate={{
              background: [
                `linear-gradient(to right, rgba(128, 57, 233, ${intensity * 0.3}), transparent)`,
                `linear-gradient(to right, rgba(255, 144, 66, ${intensity * 0.3}), transparent)`,
                `linear-gradient(to right, rgba(128, 57, 233, ${intensity * 0.3}), transparent)`,
              ],
            }}
            transition={{
              duration: animationSpeed,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: animationSpeed / 4,
            }}
          />

          {/* Right edge glow */}
          <motion.div
            className="absolute top-0 right-0 bottom-0 w-24"
            style={{
              background: `linear-gradient(to left, rgba(255, 144, 66, ${intensity * 0.3}), transparent)`,
            }}
            animate={{
              background: [
                `linear-gradient(to left, rgba(255, 144, 66, ${intensity * 0.3}), transparent)`,
                `linear-gradient(to left, rgba(128, 57, 233, ${intensity * 0.3}), transparent)`,
                `linear-gradient(to left, rgba(255, 144, 66, ${intensity * 0.3}), transparent)`,
              ],
            }}
            transition={{
              duration: animationSpeed,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: animationSpeed / 4,
            }}
          />

          {/* Corner glows for extra polish */}
          {/* Top-left corner */}
          <motion.div
            className="absolute top-0 left-0 w-48 h-48"
            style={{
              background: `radial-gradient(circle at top left, rgba(128, 57, 233, ${intensity * 0.5}), transparent 70%)`,
            }}
            animate={{
              background: [
                `radial-gradient(circle at top left, rgba(128, 57, 233, ${intensity * 0.5}), transparent 70%)`,
                `radial-gradient(circle at top left, rgba(255, 144, 66, ${intensity * 0.5}), transparent 70%)`,
                `radial-gradient(circle at top left, rgba(128, 57, 233, ${intensity * 0.5}), transparent 70%)`,
              ],
            }}
            transition={{
              duration: animationSpeed * 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Top-right corner */}
          <motion.div
            className="absolute top-0 right-0 w-48 h-48"
            style={{
              background: `radial-gradient(circle at top right, rgba(255, 144, 66, ${intensity * 0.5}), transparent 70%)`,
            }}
            animate={{
              background: [
                `radial-gradient(circle at top right, rgba(255, 144, 66, ${intensity * 0.5}), transparent 70%)`,
                `radial-gradient(circle at top right, rgba(128, 57, 233, ${intensity * 0.5}), transparent 70%)`,
                `radial-gradient(circle at top right, rgba(255, 144, 66, ${intensity * 0.5}), transparent 70%)`,
              ],
            }}
            transition={{
              duration: animationSpeed * 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: animationSpeed / 2,
            }}
          />

          {/* Bottom-left corner */}
          <motion.div
            className="absolute bottom-0 left-0 w-48 h-48"
            style={{
              background: `radial-gradient(circle at bottom left, rgba(255, 144, 66, ${intensity * 0.5}), transparent 70%)`,
            }}
            animate={{
              background: [
                `radial-gradient(circle at bottom left, rgba(255, 144, 66, ${intensity * 0.5}), transparent 70%)`,
                `radial-gradient(circle at bottom left, rgba(128, 57, 233, ${intensity * 0.5}), transparent 70%)`,
                `radial-gradient(circle at bottom left, rgba(255, 144, 66, ${intensity * 0.5}), transparent 70%)`,
              ],
            }}
            transition={{
              duration: animationSpeed * 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: animationSpeed / 2,
            }}
          />

          {/* Bottom-right corner */}
          <motion.div
            className="absolute bottom-0 right-0 w-48 h-48"
            style={{
              background: `radial-gradient(circle at bottom right, rgba(128, 57, 233, ${intensity * 0.5}), transparent 70%)`,
            }}
            animate={{
              background: [
                `radial-gradient(circle at bottom right, rgba(128, 57, 233, ${intensity * 0.5}), transparent 70%)`,
                `radial-gradient(circle at bottom right, rgba(255, 144, 66, ${intensity * 0.5}), transparent 70%)`,
                `radial-gradient(circle at bottom right, rgba(128, 57, 233, ${intensity * 0.5}), transparent 70%)`,
              ],
            }}
            transition={{
              duration: animationSpeed * 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Shimmer overlay effect */}
          <motion.div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(135deg, transparent 0%, rgba(255, 255, 255, 0.03) 50%, transparent 100%)',
              backgroundSize: '200% 200%',
            }}
            animate={{
              backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
            }}
            transition={{
              duration: animationSpeed * 2,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AmbientGlow;
