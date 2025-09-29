import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { config } from "../config";
import {
  setTokens,
  readCodeVerifier,
  logCurrentToken,
  clearCodeVerifier,
} from "../lib/auth";

export default function Callback() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const code = params.get("code");
  const [isExchanging, setIsExchanging] = useState(false);

  const exchange = useCallback(async () => {
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
      form.set("grant_type", "authorization_code");
      form.set("code", code || "");
      form.set("redirect_uri", config.scalekitRedirectUri);
      form.set("client_id", config.scalekitClientId);
      form.set("code_verifier", codeVerifier);

      const res = await fetch(tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form.toString(),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      setTokens(data.access_token, data.refresh_token);
      clearCodeVerifier();
      if (import.meta.env.DEV) {
        logCurrentToken("after login");
      }
      // Small delay to ensure localStorage is synced
      await new Promise(resolve => setTimeout(resolve, 50));
      navigate("/dashboard", { replace: true });
    } catch (error: unknown) {
      if (import.meta.env.DEV) {
        console.error("Token exchange failed:", error);
      }
      // TODO: Add user-friendly error message
      navigate("/", { replace: true });
    }
  }, [code, navigate]);

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
      <div style={{ padding: 24 }}>
        <p>Missing authorization code. Redirecting...</p>
      </div>
    );
  }

  if (isExchanging) {
    return <div style={{ padding: 24 }}>Processing authentication...</div>;
  }
  return <div style={{ padding: 24 }}>Processing authentication...</div>;
}
