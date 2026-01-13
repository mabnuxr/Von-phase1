import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Link as LinkIcon, Check, Globe, Lock, CaretDown } from '@phosphor-icons/react';
import { EmailTagInput } from '../forms/input';
import { PrimaryButton, GhostButton } from '../forms/buttons';

// ============================================================================
// Types
// ============================================================================

export type AccessLevel = 'restricted' | 'anyone';

export interface ShareConfig {
  publicLink?: string;
  recipients: string[];
  accessLevel: AccessLevel;
}

export interface DashboardSharePopoverProps {
  /**
   * Whether the popover is open
   */
  isOpen: boolean;

  /**
   * Position of the popover (from button rect)
   */
  position?: { top: number; right: number };

  /**
   * Current share configuration
   */
  currentConfig?: Partial<ShareConfig>;

  /**
   * Callback when user shares
   */
  onShare: (config: ShareConfig) => void;

  /**
   * Callback when user closes/cancels
   */
  onClose: () => void;

  /**
   * Callback when public link is generated
   */
  onGeneratePublicLink?: () => Promise<string>;
}

// ============================================================================
// Component
// ============================================================================

export const DashboardSharePopover: React.FC<DashboardSharePopoverProps> = ({
  isOpen,
  position,
  currentConfig = {},
  onShare,
  onClose,
  onGeneratePublicLink,
}) => {
  const [accessLevel, setAccessLevel] = useState<AccessLevel>(currentConfig.accessLevel || 'restricted');
  const [publicLink, setPublicLink] = useState<string | undefined>(currentConfig.publicLink);
  const [recipients, setRecipients] = useState<string[]>(currentConfig.recipients || []);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showAccessDropdown, setShowAccessDropdown] = useState(false);

  const handleGeneratePublicLink = async () => {
    if (onGeneratePublicLink) {
      setIsGeneratingLink(true);
      try {
        const link = await onGeneratePublicLink();
        setPublicLink(link);
      } catch (error) {
        console.error('Failed to generate public link:', error);
      } finally {
        setIsGeneratingLink(false);
      }
    } else {
      // Demo: generate a fake link
      const fakeLink = `https://app.vonlabs.ai/share/${Math.random().toString(36).substring(7)}`;
      setPublicLink(fakeLink);
    }
  };

  const handleCopyLink = async () => {
    // Generate link if not already generated
    if (!publicLink) {
      await handleGeneratePublicLink();
    }

    const linkToCopy = publicLink || `https://app.vonlabs.ai/share/${Math.random().toString(36).substring(7)}`;
    if (!publicLink) {
      setPublicLink(linkToCopy);
    }

    navigator.clipboard.writeText(linkToCopy);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleAccessChange = (level: AccessLevel) => {
    setAccessLevel(level);
    setShowAccessDropdown(false);

    // Auto-generate link when switching to "anyone"
    if (level === 'anyone' && !publicLink) {
      handleGeneratePublicLink();
    }
  };

  const handleShare = () => {
    onShare({
      publicLink,
      recipients,
      accessLevel,
    });
    onClose();
  };

  const accessOptions = [
    {
      value: 'restricted' as AccessLevel,
      label: 'Restricted',
      description: 'Only people you share with can access',
      icon: Lock,
    },
    {
      value: 'anyone' as AccessLevel,
      label: 'Anyone with the link',
      description: 'Anyone on the internet with the link can view',
      icon: Globe,
    },
  ];

  const selectedAccess = accessOptions.find((opt) => opt.value === accessLevel);
  const SelectedIcon = selectedAccess?.icon || Lock;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - invisible, just for click outside */}
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => {
              setShowAccessDropdown(false);
              onClose();
            }}
          />

          {/* Popover */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="fixed w-[440px] z-[9999] bg-white rounded-xl shadow-xl border border-gray-200 overflow-visible"
            style={{
              top: position?.top ?? 60,
              right: position?.right ?? 20,
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">Share Dashboard</h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={18} weight="bold" className="text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-5">
              {/* Add People Section */}
              <div>
                <label className="block text-[13px] font-medium text-gray-900 mb-2">
                  Add people
                </label>
                <EmailTagInput
                  emails={recipients}
                  onChange={setRecipients}
                  placeholder="Enter email addresses..."
                  helperText="Press Enter or comma to add"
                />
              </div>

              {/* General Access Section */}
              <div>
                <label className="block text-[13px] font-medium text-gray-900 mb-2">
                  General access
                </label>
                <div className="relative">
                  <button
                    onClick={() => setShowAccessDropdown(!showAccessDropdown)}
                    className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <div className="w-8 h-8 flex items-center justify-center bg-white rounded-full border border-gray-200">
                      <SelectedIcon size={16} weight="regular" className="text-gray-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-[13px] font-medium text-gray-900">
                        {selectedAccess?.label}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {selectedAccess?.description}
                      </div>
                    </div>
                    <CaretDown size={16} className="text-gray-400" />
                  </button>

                  {/* Access Level Dropdown */}
                  <AnimatePresence>
                    {showAccessDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.1 }}
                        className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden"
                      >
                        {accessOptions.map((option) => {
                          const Icon = option.icon;
                          const isSelected = option.value === accessLevel;
                          return (
                            <button
                              key={option.value}
                              onClick={() => handleAccessChange(option.value)}
                              className={`w-full flex items-center gap-3 p-3 text-left transition-colors cursor-pointer ${
                                isSelected ? 'bg-indigo-50' : 'hover:bg-gray-50'
                              }`}
                            >
                              <div className={`w-8 h-8 flex items-center justify-center rounded-full border ${
                                isSelected
                                  ? 'bg-indigo-100 border-indigo-200'
                                  : 'bg-white border-gray-200'
                              }`}>
                                <Icon
                                  size={16}
                                  weight="regular"
                                  className={isSelected ? 'text-indigo-600' : 'text-gray-600'}
                                />
                              </div>
                              <div className="flex-1">
                                <div className={`text-[13px] font-medium ${
                                  isSelected ? 'text-indigo-700' : 'text-gray-900'
                                }`}>
                                  {option.label}
                                </div>
                                <div className="text-[11px] text-gray-500">
                                  {option.description}
                                </div>
                              </div>
                              {isSelected && (
                                <Check size={16} weight="bold" className="text-indigo-600" />
                              )}
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Link Display (when anyone with link is selected) */}
              {accessLevel === 'anyone' && publicLink && (
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2">
                    <LinkIcon size={14} className="text-gray-400 flex-shrink-0" />
                    <span className="flex-1 text-[12px] text-gray-600 truncate font-mono">
                      {publicLink}
                    </span>
                  </div>
                </div>
              )}

              {/* People with access */}
              {recipients.length > 0 && (
                <div>
                  <label className="block text-[13px] font-medium text-gray-900 mb-2">
                    People with access
                  </label>
                  <div className="space-y-1">
                    {recipients.map((email) => (
                      <div
                        key={email}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors group"
                      >
                        <div className="w-8 h-8 flex items-center justify-center bg-indigo-100 rounded-full text-[11px] font-semibold text-indigo-700">
                          {email.charAt(0).toUpperCase()}
                        </div>
                        <span className="flex-1 text-[13px] text-gray-700">{email}</span>
                        <button
                          onClick={() => setRecipients(recipients.filter((r) => r !== email))}
                          className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-gray-200 transition-all cursor-pointer"
                        >
                          <X size={14} weight="bold" className="text-gray-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50/50">
              <button
                onClick={handleCopyLink}
                disabled={isGeneratingLink}
                className="flex items-center gap-2 px-3 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                {linkCopied ? (
                  <>
                    <Check size={16} weight="bold" className="text-green-600" />
                    <span className="text-green-600">Link copied!</span>
                  </>
                ) : (
                  <>
                    <LinkIcon size={16} />
                    <span>Copy link</span>
                  </>
                )}
              </button>
              <div className="flex items-center gap-2">
                <GhostButton onClick={onClose}>
                  Cancel
                </GhostButton>
                <PrimaryButton
                  onClick={handleShare}
                  disabled={recipients.length === 0 && accessLevel === 'restricted'}
                >
                  Done
                </PrimaryButton>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DashboardSharePopover;
