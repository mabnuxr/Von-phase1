import { config } from "../config";
import { randomString, sha256, base64UrlEncode } from "./pkce";
import { storeCodeVerifier, storeOAuthState } from "./auth";

export async function startAuthorization() {
  const codeVerifier = randomString(64);
  const challengeBuffer = await sha256(codeVerifier);
  const codeChallenge = base64UrlEncode(challengeBuffer);

  // Fetch a server-signed state from the backend. The backend also sets a
  // signed oauth_state HttpOnly cookie that will be validated during
  // token-exchange to prevent login CSRF / session fixation.
  const authorizeRes = await fetch(
    `${config.apiBaseUrl}/api/v1/auth/authorize`,
    { credentials: "include" },
  );
  if (!authorizeRes.ok) {
    throw new Error(`Failed to fetch OAuth state: HTTP ${authorizeRes.status}`);
  }
  const { state } = (await authorizeRes.json()) as { state: string };

  storeCodeVerifier(codeVerifier);
  storeOAuthState(state);

  const authorizeUrl = new URL(
    config.scalekitAuthorizePath,
    config.scalekitAuthBaseUrl,
  );
  authorizeUrl.searchParams.set("response_type", config.oauthResponseType);
  authorizeUrl.searchParams.set("client_id", config.scalekitClientId);
  authorizeUrl.searchParams.set("redirect_uri", config.scalekitRedirectUri);
  authorizeUrl.searchParams.set("scope", config.oauthScope);
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("code_challenge", codeChallenge);
  authorizeUrl.searchParams.set(
    "code_challenge_method",
    config.oauthCodeChallengeMethod,
  );
  // Force login prompt to ensure user re-authenticates after logout
  authorizeUrl.searchParams.set("prompt", "login");

  window.location.href = authorizeUrl.toString();
}
