/**
 * Central event schema for PostHog analytics.
 *
 * Every tracked event lives here. To add a new event:
 *   1. Add a key to EventMap with its required extra properties
 *   2. Optionally add a named method to `report` in tracker.ts
 *
 * Base properties (user_id, user_email, user_role, company, company_id) are
 * registered as PostHog super properties at login and attached automatically —
 * do not include them here.
 */
export type EventMap = {
  // ── Settings ──────────────────────────────────────────────────────────────
  "Settings - Page Viewed": { entry_point: string };
  "Settings - Tab Clicked": { tab_name: string };
  "Settings - Back to Home Clicked": { current_tab: string };
  "Settings - Help Docs Clicked": { current_tab: string };
  "Settings - Logout Clicked": { current_tab: string };

  // ── Chat ──────────────────────────────────────────────────────────────────
  "Chat - Page Viewed": Record<never, never>;
  "Chat - Template Category Clicked": { category_name: string };
  "Chat - Suggested Prompt Clicked": {
    prompt_text: string;
    category_name: string;
    prompt_position: number;
  };
  "Chat - Suggested Prompt Arrow Clicked": { category_name: string };
};

export type EventName = keyof EventMap;
export type EventProps<E extends EventName> = EventMap[E];
