// Base compound component
export { BaseArtifactCard, ArtifactCardSkeleton, ActionButton } from './BaseArtifactCard';
export type { BaseArtifactCardProps, ActionButtonProps } from './BaseArtifactCard';

// Pre-composed variants
export { FileArtifactCard } from './FileArtifactCard';
export type { FileArtifactCardProps } from './FileArtifactCard';

export { DashboardArtifactCard } from './DashboardArtifactCard';
export type { DashboardArtifactCardProps } from './DashboardArtifactCard';

export { GmailDraftCard } from './GmailDraftCard';
export type { GmailDraftCardProps } from './GmailDraftCard';

export { EmailComposer } from './EmailComposer';
export type { EmailComposerProps, EmailData } from './EmailComposer';

export { SlackMessageComposer } from './SlackMessageComposer';
export type {
  SlackMessageComposerProps,
  SlackMessageData,
  SlackConversationType,
} from './SlackMessageComposer';

// Shared types
export type { ArtifactType, FileArtifact, EmailDraftArtifact } from './types';
