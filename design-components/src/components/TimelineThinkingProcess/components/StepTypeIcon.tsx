import React from 'react';
import type { StepTypeIconProps } from '../types';
import { SOURCE_CONFIG, TYPE_CONFIG } from '../constants';

// ============================================================================
// Component
// ============================================================================

/**
 * StepTypeIcon - Displays an icon based on step type and source
 *
 * For tool calls and approvals, shows the source icon.
 * For other types, shows the type icon.
 */
export const StepTypeIcon = React.memo<StepTypeIconProps>(
  ({ type = 'reasoning', source, status }) => {
    // For tool calls and approval, show the source icon
    if ((type === 'tool_call' || type === 'approval') && source) {
      const config = SOURCE_CONFIG[source];
      const Icon = config.icon;
      return (
        <Icon
          size={16}
          weight="regular"
          className={
            status === 'in-progress' || status === 'awaiting-approval'
              ? config.color
              : 'text-gray-500'
          }
        />
      );
    }

    // For other types, show the type icon
    const config = TYPE_CONFIG[type];
    const Icon = config.icon;
    return (
      <Icon
        size={16}
        weight="regular"
        className={status === 'in-progress' ? 'text-indigo-600' : 'text-gray-500'}
      />
    );
  }
);

StepTypeIcon.displayName = 'StepTypeIcon';
