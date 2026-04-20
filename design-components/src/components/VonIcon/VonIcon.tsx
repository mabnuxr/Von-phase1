import React, { useId } from 'react';

export type VonIconVariant = 'minimal' | 'badge';
export type VonIconShape = 'rounded' | 'circle';

export interface VonIconProps {
  size?: number;
  variant?: VonIconVariant;
  shape?: VonIconShape;
  className?: string;
}

const GRADIENT_STOPS = (
  <>
    <stop stopColor="#FFF3EB" />
    <stop offset="0.26" stopColor="#FF9042" />
    <stop offset="1" stopColor="#854FFF" />
  </>
);

/**
 * Von brand mark. Two visual forms:
 * - `minimal` (default): gradient-filled glyph on a transparent background, for inline use.
 * - `badge`: white glyph on a gradient background (circle or rounded-square), for standalone marks.
 */
export const VonIcon: React.FC<VonIconProps> = ({
  size,
  variant = 'minimal',
  shape = 'rounded',
  className,
}) => {
  const gradientId = useId();

  if (variant === 'minimal') {
    const dimension = size ?? 14;
    return (
      <svg
        width={dimension}
        height={dimension}
        viewBox="0 0 15 15"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M7.57031 0.00976562C11.3747 0.202421 14.4003 3.34798 14.4004 7.2002L14.3916 7.5498C14.3088 9.2802 13.6139 10.8497 12.5205 12.0488L12.418 12.1768C12.3818 12.2193 12.3437 12.2617 12.3027 12.3027C12.2209 12.3846 12.1333 12.4559 12.0488 12.5205C10.8497 13.6139 9.2802 14.3088 7.5498 14.3916L7.2002 14.4004C3.34798 14.4003 0.202421 11.3747 0.00976562 7.57031L0 7.2002C4.98797e-05 5.32944 0.71407 3.62479 1.88379 2.34473C1.94851 2.26043 2.01865 2.17666 2.09766 2.09766C2.17973 2.01559 2.26687 1.94274 2.35449 1.87598C3.63351 0.711246 5.33393 5.07565e-05 7.2002 0L7.57031 0.00976562ZM1.5459 5.90137C1.45048 6.31879 1.4004 6.75354 1.40039 7.2002C1.40039 10.4034 3.99702 12.9999 7.2002 13C7.64728 13 8.08216 12.9484 8.5 12.8525C7.09291 12.4323 5.56942 11.5089 4.23047 10.1699C2.89169 8.83108 1.96633 7.30834 1.5459 5.90137ZM5.37598 2.84961C4.32573 2.56213 3.63214 2.69284 3.24414 2.95801C3.1455 3.05003 3.05003 3.1455 2.95801 3.24414C2.69285 3.63214 2.56213 4.32573 2.84961 5.37598C3.17108 6.54998 3.97097 7.92989 5.2207 9.17969C6.47056 10.4295 7.85126 11.2293 9.02539 11.5508C10.0728 11.8374 10.7638 11.7063 11.1523 11.4424C11.2524 11.3491 11.3491 11.2524 11.4424 11.1523C11.7063 10.7638 11.8374 10.0728 11.5508 9.02539C11.2293 7.85126 10.4295 6.47056 9.17969 5.2207C7.92989 3.97097 6.54998 3.17108 5.37598 2.84961ZM7.2002 1.40039C6.75354 1.40041 6.31879 1.45048 5.90137 1.5459C7.30834 1.96633 8.83108 2.89169 10.1699 4.23047C11.5089 5.56942 12.4323 7.09291 12.8525 8.5C12.9484 8.08216 13 7.64728 13 7.2002C12.9999 3.99702 10.4034 1.40039 7.2002 1.40039Z"
          fill={`url(#${gradientId})`}
        />
        <defs>
          <radialGradient
            id={gradientId}
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(11.1377 1.0752) rotate(120.964) scale(15.3062)"
          >
            {GRADIENT_STOPS}
          </radialGradient>
        </defs>
      </svg>
    );
  }

  const dimension = size ?? 28;
  return (
    <svg
      width={dimension}
      height={dimension}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {shape === 'circle' ? (
        <circle cx="14" cy="14" r="14" fill={`url(#${gradientId})`} />
      ) : (
        <path
          d="M0 8C0 3.58172 3.58172 0 8 0H20C24.4183 0 28 3.58172 28 8V20C28 24.4183 24.4183 28 20 28H8C3.58172 28 0 24.4183 0 20V8Z"
          fill={`url(#${gradientId})`}
        />
      )}
      <path
        d="M15.937 11.1501C17.7702 12.4452 19.151 13.9556 19.9152 15.3235C20.7057 16.7385 20.7316 17.7813 20.3233 18.3594C19.9149 18.9375 18.9234 19.2616 17.3256 18.9894C15.7809 18.7262 13.8959 17.9296 12.0627 16.6345C10.2294 15.3394 8.84791 13.8285 8.08365 12.4605C7.29337 11.0458 7.26805 10.0032 7.67638 9.42519C8.08475 8.84721 9.07582 8.52262 10.6733 8.7947C12.2181 9.05788 14.1037 9.855 15.937 11.1501Z"
        stroke="white"
        strokeWidth="1.33"
      />
      <circle cx="13.9932" cy="14" r="7.835" stroke="white" strokeWidth="1.33" />
      <defs>
        <radialGradient
          id={gradientId}
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(21.875 1.75) rotate(120.964) scale(30.6125)"
        >
          {GRADIENT_STOPS}
        </radialGradient>
      </defs>
    </svg>
  );
};
