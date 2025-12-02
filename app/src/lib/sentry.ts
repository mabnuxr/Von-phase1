import * as Sentry from "@sentry/react";

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

    // Filter out noisy errors
    ignoreErrors: [
      "ResizeObserver loop",
      "Network request failed",
      /^Loading chunk .* failed/,
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
