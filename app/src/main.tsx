import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ErrorBoundary } from "@vonlabs/design-components";
import "@vonlabs/design-components/dist/design-components.css";
import App from "./App";
import "./index.css";
import { QueryProvider } from "./providers/QueryProvider";
import { LaunchDarklyProvider } from "./providers/LaunchDarklyProvider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <LaunchDarklyProvider>
        <QueryProvider>
          <App />
        </QueryProvider>
      </LaunchDarklyProvider>
    </ErrorBoundary>
  </StrictMode>,
);
