import { useEffect } from "react";
import * as Sentry from "@sentry/react";
import { LOGO_URL } from "../config/constants";

interface SentryErrorFallbackProps {
  error: unknown;
  componentStack: string;
  eventId: string;
  resetError: () => void;
}

export function SentryErrorFallback({
  error,
  componentStack,
  eventId,
  resetError,
}: SentryErrorFallbackProps) {
  // Handle all error types safely
  const errorDetails =
    error instanceof Error
      ? error.stack || error.message
      : typeof error === "string"
        ? error
        : (() => {
            try {
              return JSON.stringify(error, null, 2);
            } catch {
              return String(error); // Fallback for circular refs
            }
          })();

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.error("Error caught by Sentry ErrorBoundary:", error);
      console.error("Component Stack:", componentStack);
      console.error("Event ID:", eventId);
    }
  }, [error, componentStack, eventId]);

  const handleReportFeedback = () => {
    if (eventId) {
      Sentry.showReportDialog({ eventId });
    }
  };

  return (
    <div className="h-screen bg-[#f5f5f7] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-[600px] bg-white rounded-xl p-8 shadow-[0_4px_12px_rgba(0,0,0,0.08)] text-center">
        {/* Von Logo */}
        <div className="mb-6 flex justify-center">
          <img src={LOGO_URL} alt="Von Logo" className="h-16 w-auto" />
        </div>

        {/* Error Icon */}
        <div className="text-5xl mb-4">⚠️</div>

        {/* Error Title */}
        <h1 className="text-2xl font-semibold mb-3 text-[#1d1d1f] tracking-tight">
          Oops! Something went wrong
        </h1>

        {/* Error Message */}
        <p className="text-sm text-[#666] mb-6 leading-relaxed">
          We're sorry for the inconvenience. Our team has been notified and is
          working to fix the issue.
        </p>

        {/* Development-only error details */}
        {import.meta.env.DEV && (
          <details className="mt-4 mb-6 text-left cursor-pointer">
            <summary className="text-sm font-medium text-[#1d1d1f] hover:text-von-purple transition-colors">
              Error Details (Development Only)
            </summary>
            <div className="mt-3 p-4 bg-red-50 border border-red-200 rounded-xl overflow-auto text-xs text-red-900 max-h-60">
              <div className="font-semibold mb-2">Error Details:</div>
              <pre className="mb-3 whitespace-pre-wrap font-mono">
                {errorDetails}
              </pre>
              {componentStack && (
                <>
                  <div className="font-semibold mb-2 mt-3">
                    Component Stack:
                  </div>
                  <pre className="whitespace-pre-wrap font-mono">
                    {componentStack}
                  </pre>
                </>
              )}
              {eventId && (
                <>
                  <div className="font-semibold mb-2 mt-3">
                    Sentry Event ID:
                  </div>
                  <code className="bg-white px-2 py-1 rounded font-mono">
                    {eventId}
                  </code>
                </>
              )}
            </div>
          </details>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={resetError}
            className="px-5 py-2.5 text-sm font-medium text-white bg-von-purple border-0 rounded-lg cursor-pointer transition-colors duration-200 hover:bg-von-purple-dark"
          >
            Try Again
          </button>
          <button
            onClick={() => (window.location.href = "/")}
            className="px-5 py-2.5 text-sm font-medium text-von-purple bg-transparent border border-von-purple-light rounded-lg cursor-pointer transition-all duration-200 hover:bg-von-purple-light hover:border-von-purple"
          >
            Go to Home
          </button>
          {eventId && import.meta.env.VITE_APP_ENV === "production" && (
            <button
              onClick={handleReportFeedback}
              className="px-5 py-2.5 text-sm font-medium text-[#666] bg-transparent border border-gray-300 rounded-lg cursor-pointer transition-colors duration-200 hover:bg-gray-50"
            >
              Report Feedback
            </button>
          )}
        </div>

        {/* Event ID for support */}
        {eventId && import.meta.env.VITE_APP_ENV === "production" && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-[#86868b]">
              Error ID:{" "}
              <code className="bg-[#f5f5f7] px-2 py-1 rounded font-mono">
                {eventId}
              </code>
            </p>
            <p className="text-xs text-[#86868b] mt-1">
              Please include this ID when contacting support
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
