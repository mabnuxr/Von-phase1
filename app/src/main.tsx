import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import { PostHogProvider } from "@posthog/react";
import { ErrorBoundary } from "@vonlabs/design-components";
import "@vonlabs/design-components/dist/design-components.css";
import App from "./App";
import "./index.css";
import { QueryProvider } from "./providers/QueryProvider";
import { LaunchDarklyProvider } from "./providers/LaunchDarklyProvider";
import { ToastProvider } from "./contexts/ToastContext";
import { initSentry } from "./lib/sentry";
import { initDatadog } from "./lib/datadog";
import { initPosthog, posthog } from "./lib/posthog";
import { SentryErrorFallback } from "./components/SentryErrorFallback";

// Initialize observability BEFORE React renders
initSentry();
initDatadog();
initPosthog();

const isSentryEnabled = import.meta.env.VITE_APP_ENV !== "development";

const AppWithProviders = (
  <PostHogProvider client={posthog}>
    <LaunchDarklyProvider>
      <QueryProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </QueryProvider>
    </LaunchDarklyProvider>
  </PostHogProvider>
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {isSentryEnabled ? (
      <Sentry.ErrorBoundary fallback={SentryErrorFallback} showDialog>
        {AppWithProviders}
      </Sentry.ErrorBoundary>
    ) : (
      <ErrorBoundary>{AppWithProviders}</ErrorBoundary>
    )}
  </StrictMode>,
);
