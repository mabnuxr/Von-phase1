import { memo } from 'react';
import { motion } from 'framer-motion';

export interface IconProps {
  className?: string;
  size?: number;
}

// Database Icon - For SQL tools
export const DatabaseIcon = memo<IconProps>(({ className = 'w-4 h-4', size = 16 }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <ellipse
      cx="12"
      cy="5"
      rx="9"
      ry="3"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
));
DatabaseIcon.displayName = 'DatabaseIcon';

// Tool Icon - Default for tool calls
export const ToolIcon = memo<IconProps>(({ className = 'w-4 h-4', size = 16 }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <path
      d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
));
ToolIcon.displayName = 'ToolIcon';

// Search Icon - For search tools
export const SearchIcon = memo<IconProps>(({ className = 'w-4 h-4', size = 16 }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <circle cx="11" cy="11" r="8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
));
SearchIcon.displayName = 'SearchIcon';

// Calculator Icon - For calculation tools
export const CalculatorIcon = memo<IconProps>(({ className = 'w-4 h-4', size = 16 }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <rect
      x="4"
      y="2"
      width="16"
      height="20"
      rx="2"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8 6h8M8 10h8M8 14h8M8 18h8"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
));
CalculatorIcon.displayName = 'CalculatorIcon';

// CheckCircle Icon - Success state
export const CheckCircleIcon = memo<IconProps>(({ className = 'w-4 h-4', size = 16 }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <path
      d="M22 11.08V12a10 10 0 11-5.93-9.14"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M22 4L12 14.01l-3-3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
));
CheckCircleIcon.displayName = 'CheckCircleIcon';

// XCircle Icon - Error state
export const XCircleIcon = memo<IconProps>(({ className = 'w-4 h-4', size = 16 }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <circle cx="12" cy="12" r="10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M15 9l-6 6M9 9l6 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
));
XCircleIcon.displayName = 'XCircleIcon';

// Loader Icon - Loading state
export const LoaderIcon = memo<IconProps>(({ className = 'w-4 h-4 animate-spin', size = 16 }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <path
      d="M21 12a9 9 0 11-6.219-8.56"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
));
LoaderIcon.displayName = 'LoaderIcon';

// ChevronDown Icon - Expand/collapse
export const ChevronDownIcon = memo<IconProps>(({ className = 'w-4 h-4', size = 16 }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <path d="M6 9l6 6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
));
ChevronDownIcon.displayName = 'ChevronDownIcon';

// Copy Icon - Copy button
export const CopyIcon = memo<IconProps>(({ className = 'w-4 h-4', size = 16 }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <rect
      x="9"
      y="9"
      width="13"
      height="13"
      rx="2"
      ry="2"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
));
CopyIcon.displayName = 'CopyIcon';

// ArrowDown Icon - Scroll to bottom
export const ArrowDownIcon = memo<IconProps>(({ className = 'w-5 h-5', size = 20 }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <path
      d="M12 5v14M19 12l-7 7-7-7"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
));
ArrowDownIcon.displayName = 'ArrowDownIcon';

// TrendingUp Icon - Metrics
export const TrendingUpIcon = memo<IconProps>(({ className = 'w-4 h-4', size = 16 }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <path
      d="M23 6l-9.5 9.5-5-5L1 18"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M17 6h6v6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
));
TrendingUpIcon.displayName = 'TrendingUpIcon';

// Hash Icon - Count metrics
export const HashIcon = memo<IconProps>(({ className = 'w-4 h-4', size = 16 }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <path
      d="M4 9h16M4 15h16M10 3L8 21M16 3l-2 18"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
));
HashIcon.displayName = 'HashIcon';

// DollarSign Icon - Currency metrics
export const DollarSignIcon = memo<IconProps>(({ className = 'w-4 h-4', size = 16 }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <path
      d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
));
DollarSignIcon.displayName = 'DollarSignIcon';

// BarChart Icon - For query execution
export const BarChartIcon = memo<IconProps>(({ className = 'w-4 h-4', size = 16 }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <path
      d="M12 20V10M18 20V4M6 20v-4"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
));
BarChartIcon.displayName = 'BarChartIcon';

// Layers Icon - For schema inspection
export const LayersIcon = memo<IconProps>(({ className = 'w-4 h-4', size = 16 }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <path
      d="M12 2L2 7l10 5 10-5-10-5z"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M2 17l10 5 10-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2 12l10 5 10-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
));
LayersIcon.displayName = 'LayersIcon';

// Zap Icon - For execution time
export const ZapIcon = memo<IconProps>(({ className = 'w-4 h-4', size = 16 }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <path
      d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
));
ZapIcon.displayName = 'ZapIcon';

// Clock Icon - For pending state
export const ClockIcon = memo<IconProps>(({ className = 'w-4 h-4', size = 16 }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <circle cx="12" cy="12" r="10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 6v6l4 2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
));
ClockIcon.displayName = 'ClockIcon';

// PlayCircle Icon - For running state
export const PlayCircleIcon = memo<IconProps>(({ className = 'w-4 h-4', size = 16 }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <circle cx="12" cy="12" r="10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10 8l6 4-6 4V8z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
));
PlayCircleIcon.displayName = 'PlayCircleIcon';

// Brain Icon - Lightbulb for thinking/reasoning blocks with shimmer animation support
export const BrainIcon = memo<IconProps>(({ className = 'w-4 h-4', size = 16 }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Lightbulb for thinking/ideas */}
    <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z" />
  </svg>
));
BrainIcon.displayName = 'BrainIcon';

// Edit Icon - For edit/configure actions
export const EditIcon = memo<IconProps>(({ className = 'w-4 h-4', size = 16 }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <path
      d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
));
EditIcon.displayName = 'EditIcon';

// Server Icon - For environment/deployment indicators
export const ServerIcon = memo<IconProps>(({ className = 'w-4 h-4', size = 16 }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <rect
      x="2"
      y="2"
      width="20"
      height="8"
      rx="2"
      ry="2"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <rect
      x="2"
      y="14"
      width="20"
      height="8"
      rx="2"
      ry="2"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <line
      x1="6"
      y1="6"
      x2="6.01"
      y2="6"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <line
      x1="6"
      y1="18"
      x2="6.01"
      y2="18"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
));
ServerIcon.displayName = 'ServerIcon';

// Globe Icon - For URLs and web links
export const GlobeIcon = memo<IconProps>(({ className = 'w-4 h-4', size = 16 }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <circle cx="12" cy="12" r="10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <line
      x1="2"
      y1="12"
      x2="22"
      y2="12"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
));
GlobeIcon.displayName = 'GlobeIcon';

// Arrow Up Icon - For increases, maximums
export const ArrowUpIcon = memo<IconProps>(({ className = 'w-4 h-4', size = 16 }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <line
      x1="12"
      y1="19"
      x2="12"
      y2="5"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <polyline
      points="5 12 12 5 19 12"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
));
ArrowUpIcon.displayName = 'ArrowUpIcon';

// Plus Icon - For sums, additions
export const PlusIcon = memo<IconProps>(({ className = 'w-4 h-4', size = 16 }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <line
      x1="12"
      y1="5"
      x2="12"
      y2="19"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <line
      x1="5"
      y1="12"
      x2="19"
      y2="12"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
));
PlusIcon.displayName = 'PlusIcon';

// SpinningCircles - 3D spinning circles for thinking/loading state
// Two circles rotate on different axes (X and Y) creating a gyroscope effect
export const SpinningCircles = memo<IconProps>(({ className = 'w-4 h-4' }) => (
  <div
    style={{
      perspective: '150px',
      transformStyle: 'preserve-3d',
    }}
  >
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ transformStyle: 'preserve-3d' }}
    >
      {/* Circle rotating on X-axis (vertical tilt) */}
      <motion.circle
        cx="12"
        cy="12"
        r="8"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        animate={{
          rotateX: [0, 360],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{ transformOrigin: 'center' }}
      />
      {/* Circle rotating on Y-axis (horizontal tilt) */}
      <motion.circle
        cx="12"
        cy="12"
        r="8"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        animate={{
          rotateY: [0, 360],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{ transformOrigin: 'center' }}
      />
    </svg>
  </div>
));
SpinningCircles.displayName = 'SpinningCircles';
