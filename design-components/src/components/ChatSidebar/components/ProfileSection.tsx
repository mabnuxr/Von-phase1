import React from 'react';
import { CaretUpDownIcon } from '@phosphor-icons/react';
import { ProfilePopover } from '../../popups';
import type { PopoverPosition } from '../hooks';

export interface ProfileSectionProps {
  userName?: string;
  userEmail?: string;
  avatarSrc?: string;
  avatarLabel?: string;
  isProfileOpen: boolean;
  popoverPosition: PopoverPosition;
  avatarButtonRef: React.RefObject<HTMLButtonElement | null>;
  onAvatarClick: () => void;
  onCloseProfile: () => void;
  onSettingsClick?: () => void;

  onSignOutClick?: () => void;
}

/**
 * ProfileSection - User profile area in the expanded sidebar
 *
 * Features:
 * - Avatar with image or initials
 * - User name and email display
 * - Click to open profile popover
 */
export const ProfileSection: React.FC<ProfileSectionProps> = ({
  userName,
  userEmail,
  avatarSrc,
  avatarLabel,
  isProfileOpen,
  popoverPosition,
  avatarButtonRef,
  onAvatarClick,
  onCloseProfile,
  onSettingsClick,
  onSignOutClick,
}) => {
  if (!userName && !userEmail && !avatarLabel) {
    return null;
  }

  return (
    <>
      <div className="mt-auto pt-2 border-t border-gray-100">
        <button
          ref={avatarButtonRef}
          onClick={onAvatarClick}
          className="w-full flex items-center gap-2.5 pl-0.5 pr-2 py-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
        >
          {/* Avatar */}
          <div className="w-7 h-7 rounded-full flex-shrink-0 overflow-hidden">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={userName || 'User avatar'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-indigo-600 flex items-center justify-center text-white text-[11px] font-semibold">
                {avatarLabel || userName?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
          </div>
          {/* User Info */}
          <div className="flex-1 min-w-0 text-left">
            {userName && <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>}
            {userEmail && <p className="text-[11px] text-gray-500 truncate">{userEmail}</p>}
          </div>
          {/* Chevron */}
          <CaretUpDownIcon size={14} className="text-gray-400 flex-shrink-0" />
        </button>
      </div>

      {/* Profile Popover */}
      <ProfilePopover
        isOpen={isProfileOpen}
        onClose={onCloseProfile}
        userEmail={userEmail}
        position={popoverPosition}
        onSettingsClick={onSettingsClick}
        onSignOutClick={onSignOutClick}
      />
    </>
  );
};

export default ProfileSection;
