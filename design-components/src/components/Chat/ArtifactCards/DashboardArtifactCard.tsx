/**
 * DashboardArtifactCard — pre-composed card for dashboard artifacts.
 *
 * Renders preview (expand) and open (navigate) actions.
 */

import React from 'react';
import { CaretRightIcon, ArrowsOutIcon, SquaresFourIcon } from '@phosphor-icons/react';
import { BaseArtifactCard, ActionButton } from './BaseArtifactCard';

// ============================================================================
// Component
// ============================================================================

export interface DashboardArtifactCardProps {
  title: string;
  onPreview?: () => void;
  onOpen?: () => void;
  onClick?: () => void;
  isPending?: boolean;
}

export const DashboardArtifactCard: React.FC<DashboardArtifactCardProps> = ({
  title,
  onPreview,
  onOpen,
  onClick,
  isPending,
}) => (
  <BaseArtifactCard
    title={title}
    description="Dashboard"
    isPending={isPending}
    onClick={onClick ?? onPreview}
  >
    <BaseArtifactCard.Icon>
      <SquaresFourIcon size={20} weight="regular" className="text-gray-500" />
    </BaseArtifactCard.Icon>

    <BaseArtifactCard.Actions>
      {onPreview && (
        <ActionButton onClick={onPreview} title="Expand in chat">
          <CaretRightIcon size={16} weight="regular" />
        </ActionButton>
      )}
      {onOpen && (
        <ActionButton onClick={onOpen} title="Open full view">
          <ArrowsOutIcon size={16} weight="regular" />
        </ActionButton>
      )}
    </BaseArtifactCard.Actions>
  </BaseArtifactCard>
);
