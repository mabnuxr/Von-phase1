import { useEffect } from "react";
import { clearAllAuth } from "../lib/auth";
import { startProviderLogout } from "../lib/authFlow";

function Logout() {
  useEffect(() => {
    // Clear all auth tokens from session storage first
    clearAllAuth();
    if (import.meta.env.DEV) {
      console.log("[Auth] logout - tokens cleared, redirecting to ScaleKit logout");
    }
    // Redirect to ScaleKit logout to clear their session
    startProviderLogout();
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h1>Logging out...</h1>
      <p>Clearing your session...</p>
    </div>
  );
}

export default Logout;
