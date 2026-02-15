import { datadogRum } from "@datadog/browser-rum";

let isInitialized = false;

export function initDatadog() {
  const applicationId = import.meta.env.VITE_DD_APPLICATION_ID;
  const clientToken = import.meta.env.VITE_DD_CLIENT_TOKEN;
  const site = import.meta.env.VITE_DD_SITE || "us5.datadoghq.com";
  const environment = import.meta.env.VITE_APP_ENV ?? "production";
  const version = import.meta.env.VITE_BUILD_VERSION;

  // Skip in development or if credentials not configured
  if (import.meta.env.DEV || !applicationId || !clientToken) {
    return;
  }

  datadogRum.init({
    applicationId,
    clientToken,
    site,
    service: "revenue-os-frontend",
    env: environment,
    version,

    sessionSampleRate: 100,
    sessionReplaySampleRate: 0, // LaunchDarkly handles session replay

    trackUserInteractions: true,
    trackResources: true,
    trackLongTasks: true,

    // Sentry is the primary error tool — drop error events from DD RUM
    // to avoid duplicate tracking. DD RUM still captures errors for
    // performance correlation via views/actions/resources.
    beforeSend: (event) => {
      if (event.type === "error") {
        return false;
      }
      return true;
    },

    defaultPrivacyLevel: "mask-user-input",
  });

  isInitialized = true;
}

export function identifyDatadogUser(
  userId: string,
  email: string | null,
  tenantId: string | null,
) {
  if (!isInitialized) return;

  datadogRum.setUser({
    id: userId,
    email: email ?? undefined,
    tenantId: tenantId ?? undefined,
  });
}

/**
 * React.Profiler onRender callback — reports component render timings as DD RUM custom actions.
 * Usage: <Profiler id="Dashboard" onRender={reportRenderTiming}>
 */
export function reportRenderTiming(
  id: string,
  phase: "mount" | "update" | "nested-update",
  actualDuration: number,
) {
  if (!isInitialized) return;

  datadogRum.addAction(`react.render.${id}`, {
    component: id,
    phase,
    duration_ms: actualDuration,
  });
}

export { datadogRum };
