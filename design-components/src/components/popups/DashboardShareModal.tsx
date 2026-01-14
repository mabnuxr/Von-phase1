import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Link as LinkIcon, UserPlus, PaperPlaneTilt, Copy, Check } from '@phosphor-icons/react';
import { GhostButton, SecondaryButton } from '../forms/buttons';
import { TextInput } from '../forms/input';

// ============================================================================
// Types
// ============================================================================

export type UpdateFrequency = 'hourly' | 'daily' | 'weekly' | 'monthly';

export interface ShareConfig {
  updateFrequency: UpdateFrequency;
  publicLink?: string;
  recipients: string[];
}

export interface DashboardShareModalProps {
  /**
   * Whether the modal is open
   */
  isOpen: boolean;

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

export const DashboardShareModal: React.FC<DashboardShareModalProps> = ({
  isOpen,
  currentConfig = {},
  onShare,
  onClose,
  onGeneratePublicLink,
}) => {
  const [updateFrequency, setUpdateFrequency] = useState<UpdateFrequency>(
    currentConfig.updateFrequency || 'daily'
  );
  const [publicLink, setPublicLink] = useState<string | undefined>(currentConfig.publicLink);
  const [recipients, setRecipients] = useState<string[]>(currentConfig.recipients || []);
  const [emailInput, setEmailInput] = useState('');
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

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

  const handleCopyLink = () => {
    if (publicLink) {
      navigator.clipboard.writeText(publicLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  const handleAddRecipient = () => {
    const email = emailInput.trim();
    if (email && !recipients.includes(email)) {
      setRecipients([...recipients, email]);
      setEmailInput('');
    }
  };

  const handleRemoveRecipient = (email: string) => {
    setRecipients(recipients.filter((r) => r !== email));
  };

  const handleShare = () => {
    onShare({
      updateFrequency,
      publicLink,
      recipients,
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[9998] bg-black/20 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl z-[9999] bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <PaperPlaneTilt size={20} weight="duotone" className="text-gray-700" />
                <h2 className="text-base font-semibold text-gray-900">Share Dashboard</h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={18} weight="bold" className="text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Update Frequency */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      className="text-gray-600"
                    >
                      <path
                        d="M8 4V8L10.5 10.5M14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2C11.3137 2 14 4.68629 14 8Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Update Frequency</h3>
                    <p className="text-xs text-gray-500">How often should the data refresh?</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {(['hourly', 'daily', 'weekly', 'monthly'] as UpdateFrequency[]).map((freq) => (
                    <button
                      key={freq}
                      onClick={() => setUpdateFrequency(freq)}
                      className={`
                        flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer
                        ${
                          updateFrequency === freq
                            ? 'bg-gray-900 text-white shadow-sm'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }
                      `}
                    >
                      {freq.charAt(0).toUpperCase() + freq.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Public Link */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                    <LinkIcon size={16} weight="bold" className="text-gray-600" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900">Public Link</h3>
                </div>
                {publicLink ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={publicLink}
                        readOnly
                        className="flex-1 px-3 py-2 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg"
                      />
                      <button
                        onClick={handleCopyLink}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        {linkCopied ? <Check size={16} weight="bold" /> : <Copy size={16} />}
                        {linkCopied ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Anyone with this link can view the dashboard
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={handleGeneratePublicLink}
                    disabled={isGeneratingLink}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <LinkIcon size={16} weight="bold" />
                    {isGeneratingLink ? 'Generating...' : 'Generate Public Link'}
                  </button>
                )}
              </div>

              {/* Add Recipients */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                    <UserPlus size={16} weight="bold" className="text-gray-600" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900">Add Recipients</h3>
                </div>
                <div className="flex gap-2 mb-3">
                  <TextInput
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="Enter email"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddRecipient();
                      }
                    }}
                  />
                  <SecondaryButton onClick={handleAddRecipient}>Add</SecondaryButton>
                </div>
                {recipients.length > 0 && (
                  <div className="space-y-2">
                    {recipients.map((email) => (
                      <div
                        key={email}
                        className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg"
                      >
                        <span className="text-sm text-gray-700">{email}</span>
                        <button
                          onClick={() => handleRemoveRecipient(email)}
                          className="p-1 rounded hover:bg-gray-200 transition-colors cursor-pointer"
                        >
                          <X size={14} weight="bold" className="text-gray-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-2">Recipients get email notifications</p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 px-5 py-4 border-t border-gray-100 bg-gray-50">
              <GhostButton onClick={onClose} fullWidth>
                Cancel
              </GhostButton>
              <button
                onClick={handleShare}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
              >
                <PaperPlaneTilt size={16} weight="bold" />
                Share
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DashboardShareModal;
