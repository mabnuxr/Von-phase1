import { useCallback } from "react";
import { authService } from "../services";

/**
 * Encapsulates logout logic: backend logout, clear auth, redirect.
 * Extracted from Conversation.tsx to be shared across pages.
 */
export function useLogout() {
  const handleLogout = useCallback(async () => {
    if (import.meta.env.DEV) {
      console.log("[useLogout] Logout clicked");
    }

    try {
      const response = await authService.logout();
      if (import.meta.env.DEV) {
        console.log(
          "[useLogout] Backend logout successful, redirect URL:",
          response.redirectUrl,
        );
      }

      const { clearAllAuth } = await import("../lib/auth");
      clearAllAuth();

      if (response.redirectUrl) {
        window.location.href = response.redirectUrl;
      } else {
        if (import.meta.env.DEV) {
          console.warn(
            "[useLogout] No redirect URL provided, using default logout flow",
          );
        }
        window.location.href = window.location.origin;
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("[useLogout] Backend logout failed:", error);
      }
      startProviderLogout();
    }
  }, []);

  return { handleLogout };
}
