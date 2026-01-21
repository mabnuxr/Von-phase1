import { useState, useCallback } from "react";

// ============================================================================
// Types
// ============================================================================

/**
 * Unified artifact state that works for both ArtifactPane (V1) and SingleArtifactDrawer (V2)
 */
export interface ArtifactState {
  isOpen: boolean;
  artifactId: string | null;
  toolName: string;
  artifactType: string;
  runId: string | null;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook to manage artifact viewer state (pane or drawer)
 *
 * This hook provides unified state management for both:
 * - ArtifactPane (V1 style)
 * - SingleArtifactDrawer (V2 style)
 *
 * The same state works for both UIs - render the appropriate component
 * based on the thinking process version flag.
 *
 * @example
 * ```tsx
 * const { artifactState, handleArtifactClick, closeArtifact } = useArtifactState();
 *
 * return (
 *   <>
 *     <Chat onArtifactClick={handleArtifactClick} />
 *     {isAgentV2 ? (
 *       <SingleArtifactDrawerContainer
 *         drawerState={artifactState}
 *         onClose={closeArtifact}
 *       />
 *     ) : (
 *       <ArtifactPaneContainer
 *         paneState={artifactState}
 *         onClose={closeArtifact}
 *       />
 *     )}
 *   </>
 * );
 * ```
 */
export function useArtifactState() {
  const [artifactState, setArtifactState] = useState<ArtifactState>({
    isOpen: false,
    artifactId: null,
    toolName: "",
    artifactType: "",
    runId: null,
  });

  const handleArtifactClick = useCallback(
    (
      artifactId: string,
      toolName: string,
      artifactType: string,
      runId: string,
    ) => {
      setArtifactState({
        isOpen: true,
        artifactId,
        toolName,
        artifactType,
        runId,
      });
    },
    [],
  );

  const closeArtifact = useCallback(() => {
    setArtifactState((prev) => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

  return {
    artifactState,
    handleArtifactClick,
    closeArtifact,
  };
}
