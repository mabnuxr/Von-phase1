/**
 * useBaseChatConfig
 *
 * Shared foundation for any chat session — provides user context, feature flags,
 * salesforce auth state, and the commands panel. Both dashboard chat and
 * standalone chat build on top of this.
 */

import { useAppShell } from "./useAppShell";
import { useFeatureFlag } from "./useFeatureFlag";
import { useSalesforceConnection } from "./useSalesforceConnection";
import { useCommandsPanel } from "./useCommandsPanel";
import { useCommandCreatedEvent } from "./useCommandCreatedEvent";

export function useBaseChatConfig() {
  const { user } = useAppShell();
  const features = useFeatureFlag();
  const salesforce = useSalesforceConnection();
  const commands = useCommandsPanel(user?.id);

  // Listen for agent-created commands and auto-refresh the commands list
  useCommandCreatedEvent();

  const canSubmit =
    salesforce.isConnected &&
    salesforce.isAuthenticated &&
    !features.isTenantDisabled;

  return { user, features, commands, canSubmit };
}
