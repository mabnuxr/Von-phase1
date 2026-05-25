import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { config } from "../config";
import {
  setAuthData,
  readCodeVerifier,
  readOAuthState,
  isAuthenticated,
  logCurrentAuth,
  clearCodeVerifier,
  clearOAuthState,
} from "../lib/auth";
import { useLaunchDarklyIdentify } from "../hooks/useLaunchDarklyIdentify";

export default function Callback() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const code = params.get("code");
  const state = params.get("state");
  const [isExchanging, setIsExchanging] = useState(false);
  const { identifyUser } = useLaunchDarklyIdentify();

  const exchange = useCallback(async () => {
    // Validate state parameter to prevent CSRF attacks
    const storedState = readOAuthState();
    if (!storedState || storedState !== state) {
      if (import.meta.env.DEV) {
        console.error("[Auth] State mismatch - possible CSRF attack");
      }
      navigate("/", { replace: true });
      return;
    }

    const codeVerifier = readCodeVerifier();
    if (!codeVerifier) {
      navigate("/", { replace: true });
      return;
    }

    try {
      // Exchange code via backend — backend sets HttpOnly cookies for
      // access_token and refresh_token, returns id_token + user context
      const res = await fetch(
        `${config.apiBaseUrl}/api/v1/auth/token-exchange`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include", // Accept Set-Cookie from response
          body: JSON.stringify({
            code: code || "",
            redirect_uri: config.scalekitRedirectUri,
            code_verifier: codeVerifier,
            state: storedState,
          }),
        },
      );

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      if (!data.id_token) {
        throw new Error("No id_token received from server");
      }

      // Store id_token and user context in localStorage
      // (access_token and refresh_token are in HttpOnly cookies)
      setAuthData(data.id_token, data.user);
      clearCodeVerifier();
      clearOAuthState();

      // Verify auth data was stored successfully before navigation
      if (!isAuthenticated()) {
        throw new Error("Failed to store auth data");
      }

      if (import.meta.env.DEV) {
        logCurrentAuth("after login");
      }

      // Identify user in LaunchDarkly after successful login
      await identifyUser();

      navigate("/chat/new", { replace: true });
    } catch (error: unknown) {
      if (import.meta.env.DEV) {
        console.error("Token exchange failed:", error);
      }
      clearCodeVerifier();
      clearOAuthState();
      navigate("/", { replace: true });
    }
  }, [code, state, navigate, identifyUser]);

  const startedRef = useRef(false);
  useEffect(() => {
    if (!code) return;
    if (startedRef.current) return; // prevent double-run (e.g., StrictMode)
    startedRef.current = true;
    setIsExchanging(true);
    exchange().finally(() => setIsExchanging(false));
  }, [code, exchange]);

  if (!code) {
    return (
      <div className="p-6">
        <p>Missing authorization code. Redirecting...</p>
      </div>
    );
  }

  if (isExchanging) {
    return <div className="p-6">Processing authentication...</div>;
  }
  return <div className="p-6">Processing authentication...</div>;
}
