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
  ArrowsClockwiseIcon,
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
  shareToken?: string;
  shareUrl?: string;
  accessType?: AccessType;
  sharedWith?: ShareRecipient[];
  sharedAt?: string;
  snapshotAt?: string;
  hasNewMessages?: boolean;
}

export interface ShareResult {
  shareToken: string;
  shareUrl: string;
  isActive: boolean;
  accessType: AccessType;
  sharedWith: ShareRecipient[];
  sharedAt: string;
  snapshotAt: string;
  hasNewMessages: boolean;
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
  onShareStatusChange?: (isShared: boolean) => void;

  /** Fetch current share status */
  onGetShareStatus: (conversationId: string) => Promise<ShareStatus>;
  /** Create or update share link */
  onCreateShare: (
    conversationId: string,
    accessType: AccessType,
    allowedUserIds: string[]
  ) => Promise<ShareResult>;
  /** Update snapshot (advance to include newer messages) and optionally change type/recipients */
  onUpdateShare: (
    conversationId: string,
    accessType?: AccessType,
    allowedUserIds?: string[]
  ) => Promise<ShareResult>;
  /** Deactivate share link */
  onDeactivateShare: (conversationId: string) => Promise<void>;
  /** Fetch team members for user picker */
  onGetTeamMembers?: () => Promise<TeamMemberOption[]>;
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
}) => {
  const [shareStatus, setShareStatus] = useState<ShareStatus | null>(null);
  const [selectedType, setSelectedType] = useState<AccessType | 'private'>('org_wide');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMemberOption[]>([]);

  const [loading, setLoading] = useState(false);
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
      setLoading(true);
      try {
        const status = await onGetShareStatus(conversationId);
        setShareStatus(status);

        if (status.isShared) {
          setSelectedType(status.accessType || 'org_wide');
          setSelectedUserIds(status.sharedWith?.map((r) => r.userId) || []);
        } else {
          setSelectedType('org_wide');
          setSelectedUserIds([]);
        }

        if (onGetTeamMembers) {
          const members = await onGetTeamMembers();
          setTeamMembers(members);
        }
      } catch (error) {
        console.error('Failed to load share status:', error);
      } finally {
        setLoading(false);
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
    try {
      if (selectedType === 'private') {
        await onDeactivateShare(conversationId);
        setShareStatus({ isShared: false });
        onShareStatusChange?.(false);
      } else if (shareStatus?.isShared) {
        const result = await onUpdateShare(
          conversationId,
          selectedType,
          selectedType === 'restricted' ? selectedUserIds : []
        );
        setShareStatus({
          isShared: true,
          shareToken: result.shareToken,
          shareUrl: result.shareUrl,
          accessType: result.accessType,
          sharedWith: result.sharedWith,
          sharedAt: result.sharedAt,
          snapshotAt: result.snapshotAt,
          hasNewMessages: result.hasNewMessages,
        });
        onShareStatusChange?.(true);
      } else {
        const result = await onCreateShare(
          conversationId,
          selectedType,
          selectedType === 'restricted' ? selectedUserIds : []
        );
        setShareStatus({
          isShared: true,
          shareToken: result.shareToken,
          shareUrl: result.shareUrl,
          accessType: result.accessType,
          sharedWith: result.sharedWith,
          sharedAt: result.sharedAt,
          snapshotAt: result.snapshotAt,
          hasNewMessages: result.hasNewMessages,
        });
        onShareStatusChange?.(true);
      }
    } catch (error) {
      console.error('Failed to share:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSnapshot = async () => {
    setSaving(true);
    try {
      const result = await onUpdateShare(conversationId);
      setShareStatus({
        isShared: true,
        shareToken: result.shareToken,
        shareUrl: result.shareUrl,
        accessType: result.accessType,
        sharedWith: result.sharedWith,
        sharedAt: result.sharedAt,
        snapshotAt: result.snapshotAt,
        hasNewMessages: false,
      });
    } catch (error) {
      console.error('Failed to update snapshot:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    onClose();
    setCopied(false);
  };

  const isAlreadyShared = shareStatus?.isShared ?? false;
  const hasNewMessages = shareStatus?.hasNewMessages ?? false;

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
                    Only messages up to this point will be shared.
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer mt-0.5 shrink-0"
                >
                  <XIcon size={13} />
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <SpinnerGapIcon size={20} className="animate-spin text-gray-400" />
                </div>
              ) : (
                <>
                  {isAlreadyShared && hasNewMessages && (
                    <div className="flex items-center gap-2 mt-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                      <span className="text-xs text-amber-800 flex-1">
                        New messages since last shared
                      </span>
                      <button
                        onClick={handleUpdateSnapshot}
                        disabled={saving}
                        className="flex items-center gap-1 text-xs font-medium text-amber-900 hover:text-amber-950 cursor-pointer disabled:opacity-50"
                      >
                        <ArrowsClockwiseIcon size={12} className={saving ? 'animate-spin' : ''} />
                        Update
                      </button>
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5 mt-3">
                    <button
                      onClick={() => setSelectedType('org_wide')}
                      className={`flex items-start gap-2.5 px-3 py-2 rounded-xl border transition-colors cursor-pointer text-left ${
                        selectedType === 'org_wide'
                          ? 'border-gray-300 bg-gray-50'
                          : 'border-gray-100 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <GlobeSimpleIcon
                        size={16}
                        className={`mt-1 ${selectedType === 'org_wide' ? 'text-gray-900' : 'text-gray-400'}`}
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-gray-900">
                          Create public link
                        </span>
                        <p className="text-xs text-gray-700 mt-0.5">
                          Anyone at your company with this link can open and read this chat.
                        </p>
                      </div>
                      {selectedType === 'org_wide' && (
                        <CheckIcon
                          size={16}
                          weight="bold"
                          className="text-gray-900 mt-1 shrink-0"
                        />
                      )}
                    </button>

                    <button
                      onClick={() => setSelectedType('restricted')}
                      className={`flex items-start gap-2.5 px-3 py-2 rounded-xl border transition-colors cursor-pointer text-left ${
                        selectedType === 'restricted'
                          ? 'border-gray-300 bg-gray-50'
                          : 'border-gray-100 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <UsersIcon
                        size={16}
                        className={`mt-1 ${selectedType === 'restricted' ? 'text-gray-900' : 'text-gray-400'}`}
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-gray-900">
                          Share with specific people
                        </span>
                        <p className="text-xs text-gray-700 mt-0.5">
                          Only selected team members can open this chat.
                        </p>
                      </div>
                      {selectedType === 'restricted' && (
                        <CheckIcon
                          size={16}
                          weight="bold"
                          className="text-gray-900 mt-1 shrink-0"
                        />
                      )}
                    </button>

                    <button
                      onClick={() => setSelectedType('private')}
                      className={`flex items-start gap-2.5 px-3 py-2 rounded-xl border transition-colors cursor-pointer text-left ${
                        selectedType === 'private'
                          ? 'border-gray-300 bg-gray-50'
                          : 'border-gray-100 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <LockIcon
                        size={16}
                        className={`mt-1 ${selectedType === 'private' ? 'text-gray-900' : 'text-gray-400'}`}
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-gray-900">Keep private</span>
                        <p className="text-xs text-gray-700 mt-0.5">
                          Only you have access to this chat.
                        </p>
                      </div>
                      {selectedType === 'private' && (
                        <CheckIcon
                          size={16}
                          weight="bold"
                          className="text-gray-900 mt-1 shrink-0"
                        />
                      )}
                    </button>
                  </div>

                  {selectedType === 'restricted' && (
                    <div className="mt-3">
                      <RecipientPicker
                        recipients={selectedRecipients}
                        onChange={handleRecipientsChange}
                        availableRecipients={availableRecipients}
                        label=""
                        placeholder="Search team members..."
                      />
                    </div>
                  )}

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
                      disabled={
                        saving || (selectedType === 'restricted' && selectedUserIds.length === 0)
                      }
                      className="flex-1 px-3 py-1.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                    >
                      {saving ? (
                        <>
                          <SpinnerGapIcon size={13} className="animate-spin" />
                          Saving...
                        </>
                      ) : selectedType === 'private' ? (
                        'Make private'
                      ) : isAlreadyShared ? (
                        'Update'
                      ) : (
                        'Share'
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
