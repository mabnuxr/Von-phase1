import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckIcon, CaretDownIcon } from '@phosphor-icons/react';
import { useVisibilityToggle } from '../../../hooks/useVisibilityToggle';
import { Tooltip } from '../../Tooltip';
import { ConversationMode } from './types';

/**
 * Get agent mode display label and description
 */
function getConversationModeDisplay(mode: ConversationMode) {
  switch (mode) {
    case ConversationMode.Auto:
      return { label: 'Ask Von', description: 'Any revenue question or task' };
    case ConversationMode.DashboardBuilder:
      return { label: 'Build Dashboards', description: 'All of Ask Von + build dashboards' };
    default:
      return { label: 'Unknown Mode', description: 'An unknown conversation mode' };
  }
}

/**
 * ModeSelectorPill - Always-visible pill that shows the current conversation mode.
 * Click opens a popover to switch between Ask and Dashboard Builder.
 *
 * When `isAgentLocked` is true, all modes except the selected one are treated as disabled.
 */
export interface ModeSelectorPillProps {
  selectedMode: ConversationMode;
  onModeChange: (mode: ConversationMode) => void;
  availableModes: ConversationMode[];
  disabled?: boolean;
  isAgentLocked?: boolean;
  onBuildDashboard?: () => void;
}

export const ModeSelectorPill: React.FC<ModeSelectorPillProps> = ({
  selectedMode,
  onModeChange,
  availableModes,
  disabled = false,
  isAgentLocked = false,
  onBuildDashboard,
}) => {
  const { isVisible: isOpen, hide, toggleVisibility } = useVisibilityToggle();
  const display = getConversationModeDisplay(selectedMode);

  const disabledModes = useMemo(
    () => (isAgentLocked ? availableModes.filter((m) => m !== selectedMode) : []),
    [isAgentLocked, availableModes, selectedMode]
  );

  const handleSelect = (mode: ConversationMode) => {
    if (disabledModes.includes(mode)) return;
    onModeChange(mode);
    if (mode === ConversationMode.DashboardBuilder) {
      onBuildDashboard?.();
    }
    hide();
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !disabled && toggleVisibility()}
        disabled={disabled}
        className={`flex items-center gap-1.5 px-2 py-1 text-sm font-medium rounded-full border border-green-200 bg-green-50 text-green-700 transition-colors cursor-pointer ${
          disabled ? 'opacity-60 cursor-not-allowed' : 'hover:bg-green-100'
        }`}
        title="Switch mode"
      >
        {display.label}
        <CaretDownIcon size={12} weight="bold" className="text-green-500" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={hide} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.1 }}
              className="absolute bottom-full left-0 mb-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 p-1 z-50"
            >
              {availableModes.map((mode) => {
                const modeDisplay = getConversationModeDisplay(mode);
                const isSelected = selectedMode === mode;
                const isModeDisabled = disabledModes.includes(mode);
                return (
                  <Tooltip
                    key={mode}
                    content="Start a new conversation to switch modes"
                    enabled={isModeDisabled}
                    placement="top"
                    wrapperClassName="w-full"
                  >
                    <button
                      type="button"
                      disabled={isModeDisabled}
                      onClick={() => handleSelect(mode)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border text-left transition-colors ${
                        isSelected
                          ? 'border-green-200 bg-green-50'
                          : isModeDisabled
                            ? 'border-transparent bg-gray-50/70 opacity-55 cursor-not-allowed'
                            : 'border-transparent hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-sm font-medium ${
                              isSelected
                                ? 'text-green-800'
                                : isModeDisabled
                                  ? 'text-gray-500'
                                  : 'text-gray-900'
                            }`}
                          >
                            {modeDisplay.label}
                          </span>
                        </div>
                        <span
                          className={`text-xs ${
                            isSelected
                              ? 'text-green-700'
                              : isModeDisabled
                                ? 'text-gray-400'
                                : 'text-gray-700'
                          }`}
                        >
                          {modeDisplay.description}
                        </span>
                      </div>
                      {isSelected && (
                        <CheckIcon
                          size={14}
                          weight="bold"
                          className={`flex-shrink-0 ${isModeDisabled ? 'text-green-500/70' : 'text-green-600'}`}
                        />
                      )}
                    </button>
                  </Tooltip>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
