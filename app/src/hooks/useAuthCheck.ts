import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAccessToken } from "../lib/auth";

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
    // Check if user is authenticated
    const token = getAccessToken();
    if (!token) {
      if (import.meta.env.DEV) {
        console.log("[useAuthCheck] No token found, redirecting to login");
      }
      navigate("/", { replace: true });
      return;
    }
    if (import.meta.env.DEV) {
      console.log("[useAuthCheck] Token found, user authenticated");
    }
  }, [navigate]);
}
