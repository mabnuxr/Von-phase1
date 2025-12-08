import usePreferencesStore from "../store/preferencesStore";
import { BaseIntegrationConfigPane } from "./BaseIntegrationConfigPane";

/**
 * Personal (user-level) integration configuration pane.
 *
 * This component wraps BaseIntegrationConfigPane for personal integrations.
 * It conditionally renders based on configuringPersonalIntegration state,
 * ensuring the component unmounts when closed, which resets all form state.
 */
export function PersonalIntegrationPane() {
  const {
    configuringPersonalIntegration,
    setConfiguringPersonalIntegration,
    editingIntegrationData,
    setEditingIntegrationData,
  } = usePreferencesStore();

  // Conditionally render - unmounts when closed, resetting all state
  if (!configuringPersonalIntegration) return null;

  const handleClose = () => {
    setConfiguringPersonalIntegration(null);
    setEditingIntegrationData(null);
  };

  return (
    <BaseIntegrationConfigPane
      integrationId={configuringPersonalIntegration}
      accessLevel="user"
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
