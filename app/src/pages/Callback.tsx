import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { config } from "../config";
import {
  setTokens,
  readCodeVerifier,
  readOAuthState,
  getAccessToken,
  logCurrentToken,
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
      const tokenUrl = new URL(
        config.scalekitTokenPath,
        config.scalekitAuthBaseUrl,
      ).toString();
      const form = new URLSearchParams();
      form.set("grant_type", config.oauthGrantType);
      form.set("code", code || "");
      form.set("redirect_uri", config.scalekitRedirectUri);
      form.set("client_id", config.scalekitClientId);
      form.set("code_verifier", codeVerifier);
      form.set("scope", config.oauthScope);

      const res = await fetch(tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form.toString(),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      if (!data.access_token) {
        throw new Error("No access token received from server");
      }
      setTokens(data.access_token, data.refresh_token);
      clearCodeVerifier();
      clearOAuthState();

      // Verify token was stored successfully before navigation
      const storedToken = getAccessToken();
      if (!storedToken) {
        throw new Error("Failed to store access token");
      }

      if (import.meta.env.DEV) {
        logCurrentToken("after login");
      }

      // Identify user in LaunchDarkly after successful login
      await identifyUser();

      navigate("/chat", { replace: true });
    } catch (error: unknown) {
      if (import.meta.env.DEV) {
        console.error("Token exchange failed:", error);
      }
      clearCodeVerifier();
      clearOAuthState();
      // TODO: Add user-friendly error message
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
