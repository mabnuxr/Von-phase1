/**
 * BaseArtifactCard — compound component shell for artifact cards.
 *
 * Usage:
 *   <BaseArtifactCard title="My File" description="Document">
 *     <BaseArtifactCard.Icon>
 *       <FileDocIcon size={20} />
 *     </BaseArtifactCard.Icon>
 *     <BaseArtifactCard.Actions>
 *       <ActionButton ... />
 *     </BaseArtifactCard.Actions>
 *   </BaseArtifactCard>
 */

import React from 'react';

// ============================================================================
// Sub-components (slots)
// ============================================================================

const Icon: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;
Icon.displayName = 'BaseArtifactCard.Icon';

const Actions: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;
Actions.displayName = 'BaseArtifactCard.Actions';

// ============================================================================
// Helpers
// ============================================================================

function findSlot(children: React.ReactNode, slot: React.FC<{ children: React.ReactNode }>) {
  const arr = React.Children.toArray(children);
  return arr.find((child) => React.isValidElement(child) && child.type === slot) as
    | React.ReactElement
    | undefined;
}

// ============================================================================
// Skeleton (pending state)
// ============================================================================

export const ArtifactCardSkeleton: React.FC = () => (
  <div className="border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-3 animate-pulse">
    <div className="shrink-0 w-9 h-9 rounded-lg bg-gray-100" />
    <div className="flex-1 min-w-0 space-y-2">
      <div className="h-3.5 bg-gray-100 rounded w-3/4" />
      <div className="h-3 bg-gray-100 rounded w-1/3" />
    </div>
  </div>
);

// ============================================================================
// ActionButton — shared across all artifact card variants
// ============================================================================

export interface ActionButtonProps {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  onClick,
  title,
  children,
  disabled,
  className,
}) => (
  <button
    disabled={disabled}
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    className={`w-8 h-8 rounded-lg border border-gray-100 text-gray-800 hover:bg-gray-50 transition-colors flex items-center justify-center cursor-pointer ${className ?? ''}`}
    title={title}
  >
    {children}
  </button>
);

// ============================================================================
// BaseArtifactCard (compound root)
// ============================================================================

export interface BaseArtifactCardProps {
  title: string;
  description: string;
  isPending?: boolean;
  className?: string;
  children?: React.ReactNode;
  onClick?: () => void;
}

const BaseArtifactCardRoot: React.FC<BaseArtifactCardProps> = ({
  title,
  description,
  isPending,
  className,
  children,
  onClick,
}) => {
  if (isPending) {
    return <ArtifactCardSkeleton />;
  }

  const iconSlot = findSlot(children, Icon);
  const actionsSlot = findSlot(children, Actions);

  return (
    <div
      onClick={onClick}
      className={`border border-gray-100 rounded-2xl px-3 py-3 flex items-center gap-3 hover:border-gray-200 shadow-xs transition-colors ${onClick ? 'cursor-pointer' : ''} ${className ?? ''}`}
    >
      {/* Icon slot */}
      {iconSlot && (
        <div className="shrink-0 w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center">
          {iconSlot}
        </div>
      )}

      {/* Title + description */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-gray-900 truncate">{title}</h4>
        <p className="text-xs text-gray-500 truncate mt-0.5">{description}</p>
      </div>

      {/* Actions slot */}
      {actionsSlot && <div className="flex items-center gap-1.5 shrink-0">{actionsSlot}</div>}
    </div>
  );
};

export const BaseArtifactCard = Object.assign(BaseArtifactCardRoot, {
  Icon,
  Actions,
});
