import { config } from "../config";
import { randomString, sha256, base64UrlEncode } from "./pkce";
import { storeCodeVerifier, clearAllAuth } from "./auth";

export async function startAuthorization() {
  const codeVerifier = randomString(64);
  const challengeBuffer = await sha256(codeVerifier);
  const codeChallenge = base64UrlEncode(challengeBuffer);
  storeCodeVerifier(codeVerifier);

  const authorizeUrl = new URL(config.scalekitAuthorizePath, config.scalekitAuthBaseUrl);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("client_id", config.scalekitClientId);
  authorizeUrl.searchParams.set("redirect_uri", config.scalekitRedirectUri);
  authorizeUrl.searchParams.set("scope", "openid profile offline_access");
  authorizeUrl.searchParams.set("state", crypto.randomUUID());
  authorizeUrl.searchParams.set("code_challenge", codeChallenge);
  authorizeUrl.searchParams.set("code_challenge_method", "S256");
  // Force login prompt to ensure user re-authenticates after logout
  authorizeUrl.searchParams.set("prompt", "login");

  window.location.href = authorizeUrl.toString();
}

export function startProviderLogout() {
  // Clear all local auth data before redirecting
  clearAllAuth();

  const logoutUrl = new URL(config.scalekitLogoutPath, config.scalekitAuthBaseUrl);
  // After ScaleKit logout, redirect back with a flag to show logout confirmation
  logoutUrl.searchParams.set("post_logout_redirect_uri", location.origin + "/?logged_out=true");

  if (import.meta.env.DEV) {
    console.log("[Auth] Redirecting to ScaleKit logout:", logoutUrl.toString());
  }

  window.location.href = logoutUrl.toString();
}
