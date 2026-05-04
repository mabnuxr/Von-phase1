import posthog from "posthog-js";

let isInitialized = false;
 
export function initPosthog() {
  const apiKey = import.meta.env.VITE_POSTHOG_API_KEY;
  const apiHost = import.meta.env.VITE_POSTHOG_HOST || "https://us.i.posthog.com";

  if (!apiKey) {
    return;
  }

  posthog.init(apiKey, {
    api_host: apiHost,
    defaults: "2026-01-30",
    capture_pageview: false,
  });

  isInitialized = true;
}

export function identifyPosthogUser(
  userId: string,
  properties?: { email?: string | null; tenantId?: string | null },
) {
  if (!isInitialized) return;

  posthog.identify(userId, {
    email: properties?.email ?? undefined,
    tenantId: properties?.tenantId ?? undefined,
  });

  if (properties?.tenantId) {
    posthog.group("company", properties.tenantId);
  }
}

export function resetPosthogUser() {
  if (!isInitialized) return;
  posthog.reset();
}

export { posthog };
