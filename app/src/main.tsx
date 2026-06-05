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
import { KnockGuidesProvider } from "./providers/KnockGuidesProvider";
import { ToastProvider } from "./contexts/ToastContext";
import { Analytics } from "@vercel/analytics/react";
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
          <KnockGuidesProvider>
            <App />
          </KnockGuidesProvider>
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
    <Analytics />
  </StrictMode>,
);
