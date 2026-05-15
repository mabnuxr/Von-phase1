import posthog from "posthog-js";
import type { User } from "../services";

let isInitialized = false;

export function initPosthog() {
  const apiKey = import.meta.env.VITE_POSTHOG_API_KEY;
  const apiHost =
    import.meta.env.VITE_POSTHOG_HOST || "https://us.i.posthog.com";

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

// Registers user + company properties as PostHog super properties so they are
// automatically attached to every future event — no need to spread them manually.
export function registerPosthogSuperProps(user: User) {
  if (!isInitialized) return;

  posthog.register({
    user_role: !user.roles?.length
      ? null
      : user.roles.some((r) => r.toLowerCase() === "admin")
        ? "Admin"
        : "Member",
    company: user.tenant ?? null,
    company_id: user.tenantId ?? null,
    user_id: user.id,
    user_email: user.email,
  });
}

export function resetPosthogUser() {
  if (!isInitialized) return;
  posthog.reset();
}

export { posthog };
