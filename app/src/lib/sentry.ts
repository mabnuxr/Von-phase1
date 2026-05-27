import * as Sentry from "@sentry/react";
import { NETWORK_ERROR_PATTERNS } from "./networkErrors";

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  const environment = import.meta.env.VITE_APP_ENV || "development";
  const release = import.meta.env.VITE_BUILD_VERSION;

  // Skip Sentry in development or if DSN not configured
  if (environment === "development" || !dsn) {
    return;
  }

  Sentry.init({
    dsn,
    environment,
    release,

    // Performance monitoring
    tracesSampleRate: environment === "production" ? 0.1 : 1.0,

    // NO session replay - LaunchDarkly handles this
    integrations: [Sentry.browserTracingIntegration()],

    // Drop errors thrown from browser extensions (e.g. extensions that
    // override window.fetch and break our telemetry POSTs). These aren't
    // actionable from our code and add noise.
    denyUrls: [
      /^chrome-extension:\/\//,
      /^moz-extension:\/\//,
      /^safari(-web)?-extension:\/\//,
    ],

    // Filter out noisy errors
    ignoreErrors: [
      "ResizeObserver loop",
      /^Loading chunk .* failed/,
      // Client-side network failures — fetch() rejecting before any HTTP
      // response. Verified via Sentry breadcrumbs to be a client-environment
      // issue, not a backend one: when these fire, unrelated third-party
      // origins (LaunchDarkly, Pusher, Datadog) fail in the same session at
      // the same instant, which only happens when the user's network/browser
      // is blocking requests (ad blocker / privacy extension, VPN, firewall,
      // or an offline blip). Not actionable from our code, and real backend
      // outages are caught by server-side/uptime monitoring instead.
      //
      // NETWORK_ERROR_PATTERNS are anchored to the bare browser messages so
      // app-authored errors that merely contain "Failed to fetch" (e.g.
      // salesforceService's "Failed to fetch opportunity stages...",
      // authFlow's "Failed to fetch OAuth state: HTTP 500") still reach Sentry.
      ...NETWORK_ERROR_PATTERNS,
    ],

    // Don't send PII
    beforeSend(event) {
      if (event.user) {
        delete event.user.ip_address;
      }
      return event;
    },
  });
}

export { Sentry };
