import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GlobeSimpleIcon,
  LockIcon,
  XIcon,
  SpinnerGapIcon,
  CheckIcon,
  CopyIcon,
  UsersIcon,
} from '@phosphor-icons/react';
import { RecipientPicker } from '../RecipientPicker';
import type { Recipient } from '../RecipientPicker';

// ============================================================================
// Types
// ============================================================================

export type AccessType = 'org_wide' | 'restricted';

export interface ShareRecipient {
  userId: string;
  email: string;
  displayName: string;
}

export interface ShareStatus {
  isShared: boolean;
  shareId?: string;
  shareUrl?: string;
  accessType?: AccessType;
  sharedWith?: ShareRecipient[];
  sharedAt?: string;
  allowFileAttachments?: boolean;
}

export interface ShareResult {
  shareId: string;
  shareUrl: string;
  isActive: boolean;
  accessType: AccessType;
  sharedWith: ShareRecipient[];
  sharedAt: string;
  allowFileAttachments: boolean;
}

export interface TeamMemberOption {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface ShareChatPopupProps {
  isOpen: boolean;
  conversationId: string;
  onClose: () => void;
  onShareStatusChange?: (isShared: boolean, accessType?: AccessType | null) => void;

  /** Fetch current share status */
  onGetShareStatus: (conversationId: string) => Promise<ShareStatus>;
  /** Create or update share link */
  onCreateShare: (
    conversationId: string,
    accessType: AccessType,
    allowedUserIds: string[],
    allowFileAttachments: boolean
  ) => Promise<ShareResult>;
  /** Update access type, recipients, and/or file attachment setting */
  onUpdateShare: (
    conversationId: string,
    accessType?: AccessType,
    allowedUserIds?: string[],
    allowFileAttachments?: boolean
  ) => Promise<ShareResult>;
  /** Deactivate share link */
  onDeactivateShare: (conversationId: string) => Promise<void>;
  /** Fetch team members for user picker */
  onGetTeamMembers?: () => Promise<TeamMemberOption[]>;
  /** Toast callback — fired after each share action completes */
  onToast?: (message: string) => void;
}

// ============================================================================
// Component
// ============================================================================

export const ShareChatPopup: React.FC<ShareChatPopupProps> = ({
  isOpen,
  conversationId,
  onClose,
  onShareStatusChange,
  onGetShareStatus,
  onCreateShare,
  onUpdateShare,
  onDeactivateShare,
  onGetTeamMembers,
  onToast,
}) => {
  const [shareStatus, setShareStatus] = useState<ShareStatus | null>(null);
  const [selectedType, setSelectedType] = useState<AccessType | 'private'>('private');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMemberOption[]>([]);

  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // RecipientPicker expects Recipient[] — derive from team members list
  const availableRecipients = useMemo<Recipient[]>(
    () =>
      teamMembers.map((m) => ({
        id: m.id,
        email: m.email,
        firstName: m.firstName,
        lastName: m.lastName,
      })),
    [teamMembers]
  );
  const selectedRecipients = useMemo<Recipient[]>(
    () => availableRecipients.filter((r) => selectedUserIds.includes(r.id)),
    [availableRecipients, selectedUserIds]
  );
  const handleRecipientsChange = useCallback((recipients: Recipient[]) => {
    setSelectedUserIds(recipients.map((r) => r.id));
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const load = async () => {
      try {
        const status = await onGetShareStatus(conversationId);
        setShareStatus(status);

        if (status.isShared) {
          setSelectedType(status.accessType || 'org_wide');
          setSelectedUserIds(status.sharedWith?.map((r) => r.userId) || []);
        } else {
          setSelectedType('private');
          setSelectedUserIds([]);
        }

        if (onGetTeamMembers) {
          const members = await onGetTeamMembers();
          setTeamMembers(members);
        }
      } catch (error) {
        console.error('Failed to load share status:', error);
      }
    };

    load();
  }, [isOpen, conversationId, onGetShareStatus, onGetTeamMembers]);

  const handleCopyLink = useCallback(async () => {
    const url = shareStatus?.shareUrl;
    if (!url) return;

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for non-HTTPS or denied clipboard permission
      console.warn('Clipboard write failed');
    }
  }, [shareStatus?.shareUrl]);

  const handleShare = async () => {
    setSaving(true);
    const previousUserIds = shareStatus?.sharedWith?.map((r) => r.userId) ?? [];
    const wasShared = shareStatus?.isShared ?? false;
    try {
      if (selectedType === 'private') {
        await onDeactivateShare(conversationId);
        setShareStatus({ isShared: false });
        onShareStatusChange?.(false, null);
        onToast?.('Chat is now private');
      } else if (wasShared) {
        const result = await onUpdateShare(
          conversationId,
          selectedType,
          selectedType === 'restricted' ? selectedUserIds : [],
          true
        );
        setShareStatus({
          isShared: true,
          shareId: result.shareId,
          shareUrl: result.shareUrl,
          accessType: result.accessType,
          sharedWith: result.sharedWith,
          sharedAt: result.sharedAt,
        });
        onShareStatusChange?.(true, result.accessType);

        // Compute toast based on what changed
        const previousAccessType = shareStatus?.accessType;
        const accessTypeChanged = previousAccessType !== selectedType;

        if (selectedType === 'org_wide') {
          onToast?.('Chat shared with your workspace');
        } else if (accessTypeChanged) {
          // Switched share type (e.g. org_wide → restricted) — not "adding more"
          onToast?.(
            `Chat shared with ${selectedUserIds.length} ${selectedUserIds.length === 1 ? 'person' : 'people'}\nEmail sent`
          );
        } else {
          const added = selectedUserIds.filter((id) => !previousUserIds.includes(id));
          const removed = previousUserIds.filter((id) => !selectedUserIds.includes(id));
          if (removed.length > 0 && added.length === 0) {
            onToast?.(
              `Access removed for ${removed.length} ${removed.length === 1 ? 'person' : 'people'}`
            );
          } else if (added.length > 0) {
            onToast?.(
              `Chat shared with ${added.length} more ${added.length === 1 ? 'person' : 'people'}\nEmail sent`
            );
          } else {
            onToast?.(
              `Chat shared with ${selectedUserIds.length} ${selectedUserIds.length === 1 ? 'person' : 'people'}\nEmail sent`
            );
          }
        }
      } else {
        const result = await onCreateShare(
          conversationId,
          selectedType,
          selectedType === 'restricted' ? selectedUserIds : [],
          true
        );
        setShareStatus({
          isShared: true,
          shareId: result.shareId,
          shareUrl: result.shareUrl,
          accessType: result.accessType,
          sharedWith: result.sharedWith,
          sharedAt: result.sharedAt,
        });
        onShareStatusChange?.(true, result.accessType);

        if (selectedType === 'org_wide') {
          onToast?.('Chat shared with your workspace');
        } else {
          onToast?.(
            `Chat shared with ${selectedUserIds.length} ${selectedUserIds.length === 1 ? 'person' : 'people'}
Email sent`
          );
        }
      }
    } catch (error) {
      console.error('Failed to share:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    onClose();
    setCopied(false);
  };

  const isAlreadyShared = shareStatus?.isShared ?? false;
  const isPrivate = selectedType === 'private';
  const isShareDisabled = saving || (selectedType === 'restricted' && selectedUserIds.length === 0);

  const shareLabel = saving ? 'Saving...' : isAlreadyShared ? 'Update' : 'Share';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9998] bg-black/20 backdrop-blur-[2px]"
            onClick={handleClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed z-[9999] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] max-w-[90vw] bg-white rounded-2xl border border-gray-100 shadow-xl flex flex-col"
          >
            <div className="p-4">
              <div className="flex items-start justify-between mb-1">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    {isAlreadyShared ? 'Chat shared' : 'Share this chat'}
                  </h3>
                  <p className="text-xs text-gray-700 mt-0.5">
                    Share a read-only link with users in your Von workspace
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer mt-0.5 shrink-0"
                >
                  <XIcon size={13} />
                </button>
              </div>

              <>
                <div className="flex flex-col gap-1.5 mt-3">
                  <button
                    onClick={() => setSelectedType('private')}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-colors cursor-pointer text-left ${
                      selectedType === 'private'
                        ? 'border-gray-300 bg-gray-50'
                        : 'border-gray-100 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <LockIcon
                      size={16}
                      className={selectedType === 'private' ? 'text-gray-900' : 'text-gray-400'}
                    />
                    <span className="flex-1 min-w-0 text-sm font-medium text-gray-900">
                      Keep private
                    </span>
                    {selectedType === 'private' && (
                      <CheckIcon size={16} weight="bold" className="text-gray-900 shrink-0" />
                    )}
                  </button>

                  <div
                    className={`rounded-xl border transition-colors ${
                      selectedType === 'restricted'
                        ? 'border-gray-300 bg-gray-50'
                        : 'border-gray-100 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <button
                      onClick={() => setSelectedType('restricted')}
                      className="flex items-center gap-2.5 px-3 py-2 w-full cursor-pointer text-left"
                    >
                      <UsersIcon
                        size={16}
                        className={
                          selectedType === 'restricted' ? 'text-gray-900' : 'text-gray-400'
                        }
                      />
                      <span className="flex-1 min-w-0 text-sm font-medium text-gray-900">
                        Share with specific people
                      </span>
                      {selectedType === 'restricted' && (
                        <CheckIcon size={16} weight="bold" className="text-gray-900 shrink-0" />
                      )}
                    </button>
                    {selectedType === 'restricted' && (
                      <div className="px-3 pb-2">
                        <div className="border-t border-gray-200 mb-2" />
                        <RecipientPicker
                          recipients={selectedRecipients}
                          onChange={handleRecipientsChange}
                          availableRecipients={availableRecipients}
                          label=""
                          placeholder="Search team members..."
                        />
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedType('org_wide')}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-colors cursor-pointer text-left ${
                      selectedType === 'org_wide'
                        ? 'border-gray-300 bg-gray-50'
                        : 'border-gray-100 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <GlobeSimpleIcon
                      size={16}
                      className={selectedType === 'org_wide' ? 'text-gray-900' : 'text-gray-400'}
                    />
                    <span className="flex-1 min-w-0 text-sm font-medium text-gray-900">
                      Share with workspace
                    </span>
                    {selectedType === 'org_wide' && (
                      <CheckIcon size={16} weight="bold" className="text-gray-900 shrink-0" />
                    )}
                  </button>
                </div>

                {isAlreadyShared && selectedType !== 'private' && shareStatus?.shareUrl && (
                  <button
                    onClick={handleCopyLink}
                    className="w-full flex items-center gap-2 mt-3 px-3 py-2 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors cursor-pointer text-left"
                  >
                    <span className="flex-1 text-xs text-gray-700 truncate font-mono">
                      {shareStatus.shareUrl}
                    </span>
                    {copied ? (
                      <span className="text-[10px] text-gray-500 shrink-0">Copied!</span>
                    ) : (
                      <CopyIcon size={13} className="text-gray-700 shrink-0" />
                    )}
                  </button>
                )}

                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
                  <button
                    onClick={handleClose}
                    className="flex-1 px-3 py-1.5 text-sm font-medium text-gray-800 bg-gray-50 border border-gray-100 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleShare}
                    disabled={isShareDisabled}
                    className="flex-1 px-3 py-1.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                  >
                    {saving ? (
                      <>
                        <SpinnerGapIcon size={13} className="animate-spin" />
                        Saving...
                      </>
                    ) : isPrivate ? (
                      'Make private'
                    ) : (
                      shareLabel
                    )}
                  </button>
                </div>
              </>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
