/**
 * ArtifactPaneContainer - App layer wrapper for ArtifactPane
 *
 * This component handles:
 * - Fetching artifact content using useLazyArtifactContent hook
 * - Managing open/close state
 *
 * The design-components ArtifactPane is a pure view component.
 * This container handles all the business logic and data fetching.
 */

import React from "react";
import { ArtifactPane } from "@vonlabs/design-components";
import { useLazyArtifactContent } from "../hooks/useMessageArtifacts";
import type { ArtifactState } from "../hooks/useArtifactState";

// ============================================================================
// Types
// ============================================================================

export interface ArtifactPaneContainerProps {
  /** Conversation ID for fetching artifact */
  conversationId: string | null;
  /** Pane state managed by parent */
  paneState: ArtifactState;
  /** Callback to close the pane */
  onClose: () => void;
}

// ============================================================================
// Component
// ============================================================================

export const ArtifactPaneContainer: React.FC<ArtifactPaneContainerProps> = ({
  conversationId,
  paneState,
  onClose,
}) => {
  const { isOpen, artifactId, toolName, runId } = paneState;

  // Fetch artifact content when pane is open
  // Uses the same hook as LazyTransparencyDrawer and SingleArtifactDrawerContainer
  const {
    data: artifact,
    isLoading,
    error,
  } = useLazyArtifactContent(
    conversationId,
    runId,
    isOpen ? artifactId : null, // Only fetch when pane is open
  );

  return (
    <ArtifactPane
      isOpen={isOpen}
      toolName={toolName}
      onClose={onClose}
      artifact={artifact}
      isLoading={isLoading}
      error={error?.message || null}
    />
  );
};

export default ArtifactPaneContainer;
