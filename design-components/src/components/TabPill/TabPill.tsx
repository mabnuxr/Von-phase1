import React from 'react';

export interface TabPillProps {
  /**
   * Tab label text
   */
  label: string;

  /**
   * Whether this tab is active
   * @default false
   */
  active?: boolean;

  /**
   * Click handler
   */
  onClick?: () => void;

  /**
   * Additional CSS class name
   */
  className?: string;
}

/**
 * TabPill - Rounded pill-shaped tab button
 *
 * Used in the top navigation bar for switching between different views.
 * Active tabs have white background with shadow, inactive tabs are transparent.
 *
 * @example
 * ```tsx
 * <TabPill label="Forecast Q3" active onClick={() => {}} />
 * <TabPill label="Sales Performance" onClick={() => {}} />
 * ```
 */
export const TabPill: React.FC<TabPillProps> = ({ label, active = false, onClick, className }) => {
  return (
    <button
      className={`
        inline-flex items-center px-4 py-2 rounded-[20px] border-0 text-sm whitespace-nowrap
        transition-all duration-200 
        ${onClick ? 'cursor-pointer' : 'cursor-default'}
        ${active ? 'bg-white text-gray-900 font-semibold shadow-subtle' : 'bg-transparent text-gray-600 font-normal hover:bg-white/50'}
        ${className || ''}
      `}
      onClick={onClick}
    >
      {label}
    </button>
  );
};

export default TabPill;
