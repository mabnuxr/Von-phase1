import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { isAuthenticated } from "../lib/auth";

/**
 * Hook to check authentication and redirect to login if not authenticated
 * Extracts common auth check logic used across protected pages
 *
 * @example
 * ```tsx
 * function Dashboard() {
 *   useAuthCheck();
 *   // ... rest of component
 * }
 * ```
 */
export function useAuthCheck(): void {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated()) {
      if (import.meta.env.DEV) {
        console.log("[useAuthCheck] Not authenticated, redirecting to login");
      }
      navigate("/", { replace: true });
      return;
    }
    if (import.meta.env.DEV) {
      console.log("[useAuthCheck] User authenticated");
    }
  }, [navigate]);
}
