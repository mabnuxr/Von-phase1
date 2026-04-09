/**
 * DashboardArtifactCard — pre-composed card for dashboard artifacts.
 */

import React from 'react';
import { CaretRightIcon, ChalkboardIcon } from '@phosphor-icons/react';
import { BaseArtifactCard, ActionButton } from './BaseArtifactCard';

// ============================================================================
// Component
// ============================================================================

export interface DashboardArtifactCardProps {
  title: string;
  onPreview?: () => void;
  onClick?: () => void;
  isPending?: boolean;
}

export const DashboardArtifactCard: React.FC<DashboardArtifactCardProps> = ({
  title,
  onPreview,
  onClick,
  isPending,
}) => (
  <BaseArtifactCard
    title={title}
    description="Dashboard"
    isPending={isPending}
    onClick={onClick ?? onPreview}
    className="mt-2"
  >
    <BaseArtifactCard.Icon>
      <ChalkboardIcon size={20} weight="regular" className="text-gray-500" />
    </BaseArtifactCard.Icon>

    <BaseArtifactCard.Actions>
      {onPreview && (
        <ActionButton onClick={onPreview} title="Expand in chat">
          <CaretRightIcon size={16} weight="regular" />
        </ActionButton>
      )}
    </BaseArtifactCard.Actions>
  </BaseArtifactCard>
);
