import { useEffect } from "react";
import { clearAllAuth } from "../lib/auth";
import { startProviderLogout } from "../lib/authFlow";
import { authService } from "../services/authService";

function Logout() {
  useEffect(() => {
    const performLogout = async () => {
      try {
        // Call backend logout to invalidate token and get redirect URL
        const response = await authService.logout();
        if (import.meta.env.DEV) {
          console.log(
            "[Logout] Backend logout successful, redirect URL:",
            response.redirectUrl
          );
        }

        // Clear all auth tokens from localStorage
        clearAllAuth();

        // Redirect to the URL provided by backend
        if (response.redirectUrl) {
          window.location.href = response.redirectUrl;
        } else {
          // Fallback to default logout flow if no redirect URL provided
          if (import.meta.env.DEV) {
            console.warn(
              "[Logout] No redirect URL provided, using default logout flow"
            );
          }
          startProviderLogout();
        }
      } catch (error) {
        // Log error but continue with logout flow
        if (import.meta.env.DEV) {
          console.error("[Logout] Backend logout failed:", error);
        }
        // Still clear local tokens and redirect, even if backend call fails
        clearAllAuth();
        startProviderLogout();
      }
    };

    performLogout();
  }, []);

  return (
    <div className="p-6">
      <h1>Logging out...</h1>
      <p>Clearing your session...</p>
    </div>
  );
}

export default Logout;
