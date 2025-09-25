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
      const tokenUrl = new URL(config.tokenPath, config.authBase).toString();
      const form = new URLSearchParams();
      form.set("grant_type", "authorization_code");
      form.set("code", code || "");
      form.set("redirect_uri", config.redirectUri);
      form.set("client_id", config.clientId);
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
      logCurrentToken("after login");
      navigate("/dashboard", { replace: true });
    } catch (error: unknown) {
      console.error("Token exchange failed:", error);
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
        <p>Missing authorization code.</p>
        <button onClick={() => navigate("/login")}>Try again</button>
      </div>
    );
  }

  if (isExchanging) {
    return <div style={{ padding: 24 }}>Processing authentication...</div>;
  }
  return <div style={{ padding: 24 }}>Processing authentication...</div>;
}
