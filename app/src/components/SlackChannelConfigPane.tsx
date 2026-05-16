import { useState, useEffect, useMemo, useRef } from "react";
import { Banner } from "@vonlabs/design-components";
import {
  useIntegrations,
  useUpdateIntegration,
} from "../hooks/useIntegrations";
import { INTEGRATION_METADATA } from "../constants/integrationMetadata";
import usePreferencesStore from "../store/preferencesStore";
import { SlackChannelConfig } from "./SlackChannelConfig";
import {
  DEFAULT_SLACK_CHANNEL_CONFIG,
  type SlackChannelConfigData,
} from "./slackChannelConfig.types";

/**
 * Sidepanel that captures channel-name patterns for a connected Slack Workspace
 * integration. Opened via the gear icon on the connected tile in IntegrationsList.
 * Persists patterns to `integration.config.channel_categories` — downstream
 * sync code reads from there. No Airbyte / job-creation side effects here.
 */
export function SlackChannelConfigPane() {
  const { configuringSlackChannels, setConfiguringSlackChannels } =
    usePreferencesStore();

  if (!configuringSlackChannels) return null;

  return (
    <SlackChannelConfigPaneInner
      integrationId={configuringSlackChannels}
      onClose={() => setConfiguringSlackChannels(null)}
    />
  );
}

interface InnerProps {
  integrationId: string;
  onClose: () => void;
}

function SlackChannelConfigPaneInner({ integrationId, onClose }: InnerProps) {
  const { data: integrationsData } = useIntegrations();
  const updateMutation = useUpdateIntegration();

  const backendIntegration = useMemo(
    () => integrationsData?.integrations.find((i) => i.id === integrationId),
    [integrationsData, integrationId],
  );

  const slackMeta = INTEGRATION_METADATA["slack_workspace"];

  const [slackChannelConfig, setSlackChannelConfig] =
    useState<SlackChannelConfigData>(DEFAULT_SLACK_CHANNEL_CONFIG);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Hydrate local state from backend integration config — once, when the
  // panel opens. Re-running on every `backendIntegration` reference change
  // (background refetches on focus, mutation invalidation, etc.) would
  // silently clobber the user's in-progress edits.
  const hasHydrated = useRef(false);
  useEffect(() => {
    if (hasHydrated.current) return;
    if (!backendIntegration) return;
    const config = backendIntegration.config;
    if (
      config?.channel_categories &&
      Array.isArray(config.channel_categories)
    ) {
      setSlackChannelConfig({
        channel_categories:
          config.channel_categories as SlackChannelConfigData["channel_categories"],
      });
    }
    hasHydrated.current = true;
  }, [backendIntegration]);

  // Slide-in animation on mount.
  useEffect(() => {
    const t = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleSave = async () => {
    setErrorMessage(null);

    // Trim each condition's value before validating + persisting. Saving
    // `"  ext-  "` would otherwise be matched literally with surrounding
    // whitespace and silently never resolve to a channel.
    const trimmedCategories = slackChannelConfig.channel_categories.map(
      (cat) => ({
        ...cat,
        groups: cat.groups.map((g) => ({
          ...g,
          conditions: g.conditions.map((c) => ({ ...c, value: c.value.trim() })),
        })),
      }),
    );

    const hasAtLeastOneCondition = trimmedCategories.some((cat) =>
      cat.groups.some((g) => g.conditions.some((c) => c.value !== "")),
    );
    if (!hasAtLeastOneCondition) {
      setValidationErrors([
        "At least one channel group with a non-empty condition is required",
      ]);
      return;
    }
    setValidationErrors([]);

    try {
      await updateMutation.mutateAsync({
        integrationId,
        data: {
          config: { channel_categories: trimmedCategories },
        },
      });
      handleClose();
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Failed to save channel configuration",
      );
    }
  };

  const isSaving = updateMutation.isPending;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/20 transition-opacity duration-300 z-40 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      />

      {/* Side Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-160 p-2 z-50 transform transition-all duration-300 ease-in-out ${
          isVisible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col bg-white rounded-xl border border-gray-200 shadow-xs">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 shrink-0">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                {slackMeta && (
                  <img
                    src={slackMeta.logoPath}
                    alt={slackMeta.name}
                    className="w-6 h-6 object-contain shrink-0"
                  />
                )}
                <h2 className="text-base font-semibold text-gray-900 m-0 truncate">
                  Channel Configuration
                </h2>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer shrink-0 p-0 border-none bg-transparent"
                aria-label="Close"
              >
                <svg
                  className="size-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    d="M6 18L18 6M6 6l12 12"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
            <p className="text-[12px] text-gray-500 mt-1.5 mb-0 leading-relaxed">
              Group your Slack channels into categories. Von reads these to give
              you full context for every question.
            </p>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto settings-scrollbar px-6 py-5">
            <div className="space-y-6">
              {validationErrors.length > 0 && (
                <Banner
                  variant="error"
                  message={validationErrors.join(" • ")}
                  dismissible={false}
                />
              )}

              {errorMessage && (
                <Banner
                  variant="error"
                  message={errorMessage}
                  dismissible={false}
                />
              )}

              <SlackChannelConfig
                value={slackChannelConfig}
                onChange={setSlackChannelConfig}
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-gray-200 shrink-0">
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={handleClose}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? "Saving…" : "Save configuration"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
