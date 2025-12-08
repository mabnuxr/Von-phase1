import usePreferencesStore from "../store/preferencesStore";
import { BaseIntegrationConfigPane } from "./BaseIntegrationConfigPane";

/**
 * Workspace (tenant-level) integration configuration pane.
 *
 * This component wraps BaseIntegrationConfigPane for workspace integrations.
 * It conditionally renders based on configuringWorkspaceIntegration state,
 * ensuring the component unmounts when closed, which resets all form state.
 */
export function WorkspaceIntegrationPane() {
  const {
    configuringWorkspaceIntegration,
    setConfiguringWorkspaceIntegration,
    editingIntegrationData,
    setEditingIntegrationData,
  } = usePreferencesStore();

  // Conditionally render - unmounts when closed, resetting all state
  if (!configuringWorkspaceIntegration) return null;

  const handleClose = () => {
    setConfiguringWorkspaceIntegration(null);
    setEditingIntegrationData(null);
  };

  return (
    <BaseIntegrationConfigPane
      integrationId={configuringWorkspaceIntegration}
      accessLevel="tenant"
      onClose={handleClose}
      editData={
        editingIntegrationData
          ? {
              id: editingIntegrationData.id!,
              environmentType: editingIntegrationData.environmentType,
              instanceUrl: editingIntegrationData.instanceUrl,
              gongApiBaseUrl: editingIntegrationData.gongApiBaseUrl,
            }
          : undefined
      }
    />
  );
}
