import { posthog } from "../posthog";
import type { EventName, EventProps } from "./events";

/**
 * Fire a typed PostHog event. Works inside and outside React.
 * Base properties (user_id, user_role, company, etc.) are injected
 * automatically via super properties — no need to pass them here.
 */
export function track<E extends EventName>(
  event: E,
  props: EventProps<E>,
): void {
  if (!posthog.__loaded) return;
  posthog.capture(event, props as Record<string, unknown>);
}

/**
 * Named methods for all tracked events.
 * Prefer these over calling track() directly — they document intent,
 * provide a single place to update property shapes, and are cmd+clickable.
 */
export const report = {
  // ── Settings ──────────────────────────────────────────────────────────────
  settingsPageViewed: () =>
    track("Settings - Page Viewed", {
      entry_point: "Settings option in chat bottom-left menu",
    }),

  settingsTabClicked: (tabName: string) =>
    track("Settings - Tab Clicked", { tab_name: tabName }),

  settingsBackToHomeClicked: (currentTab: string) =>
    track("Settings - Back to Home Clicked", { current_tab: currentTab }),

  settingsHelpDocsClicked: (currentTab: string) =>
    track("Settings - Help Docs Clicked", { current_tab: currentTab }),

  settingsLogoutClicked: (currentTab: string) =>
    track("Settings - Logout Clicked", { current_tab: currentTab }),

  // ── Chat ──────────────────────────────────────────────────────────────────
  chatPageViewed: () => track("Chat - Page Viewed", {}),

  chatTemplateCategoryClicked: (categoryName: string) =>
    track("Chat - Template Category Clicked", { category_name: categoryName }),

  chatSuggestedPromptClicked: (
    promptText: string,
    categoryName: string,
    promptPosition: number,
  ) =>
    track("Chat - Suggested Prompt Clicked", {
      prompt_text: promptText,
      category_name: categoryName,
      prompt_position: promptPosition,
    }),

  chatSuggestedPromptArrowClicked: (categoryName: string) =>
    track("Chat - Suggested Prompt Arrow Clicked", {
      category_name: categoryName,
    }),
};
