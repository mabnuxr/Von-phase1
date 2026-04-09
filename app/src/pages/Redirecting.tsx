import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { AnalyticsSkeleton } from "../components/Analytics";

const TRANSITION_DURATION_MS = 2000;

/**
 * Intermediate redirect page that shows a brief "Redirecting" loading state
 * before navigating to the target URL. Shows a dashboard skeleton in the
 * background to hint at the destination layout.
 *
 * Usage: navigate(`/redirecting?to=${encodeURIComponent(targetUrl)}`)
 */
export default function Redirecting() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const to = searchParams.get("to");

  useEffect(() => {
    if (!to) return;

    const timer = setTimeout(() => {
      navigate(to, { replace: true });
    }, TRANSITION_DURATION_MS);

    return () => clearTimeout(timer);
  }, [to, navigate]);

  if (!to) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-4">
        <p className="text-sm text-gray-500">
          Something went wrong. No redirect destination found.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-blue-600 hover:text-blue-700 underline underline-offset-2"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative">
      {/* Background skeleton hinting at the dashboard layout */}
      <div className="absolute inset-0 opacity-50">
        <AnalyticsSkeleton />
      </div>

      {/* Spinner + label overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Redirecting...</p>
      </div>
    </div>
  );
}
