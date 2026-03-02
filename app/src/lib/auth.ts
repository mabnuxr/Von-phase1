export const ID_TOKEN_KEY = "id_token";
export const USER_CONTEXT_KEY = "user_context";
export const CODE_VERIFIER_KEY = "pkce_code_verifier";
export const OAUTH_STATE_KEY = "oauth_state";

// Custom event for auth state changes within the same tab
export const AUTH_STATE_CHANGE_EVENT = "auth-state-change";

// Type definitions for auth events
export interface AuthStateChangeDetail {
  type: "login" | "logout";
  hasToken: boolean;
}

export type AuthStateChangeEvent = CustomEvent<AuthStateChangeDetail>;

// User context stored alongside id_token after token exchange
export interface StoredUserContext {
  user_id: string;
  email: string;
  tenant_id: string | null;
}

export function getIdToken(): string | null {
  return localStorage.getItem(ID_TOKEN_KEY);
}

export function setIdToken(idToken: string) {
  localStorage.setItem(ID_TOKEN_KEY, idToken);
}

export function getUserContext(): StoredUserContext | null {
  try {
    const raw = localStorage.getItem(USER_CONTEXT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredUserContext;
  } catch {
    return null;
  }
}

export function setUserContext(context: StoredUserContext) {
  localStorage.setItem(USER_CONTEXT_KEY, JSON.stringify(context));
}

/**
 * Store id_token and user context after successful token exchange.
 * Access and refresh tokens are stored in HttpOnly cookies by the backend.
 */
export function setAuthData(idToken: string, userContext: StoredUserContext) {
  try {
    setIdToken(idToken);
    setUserContext(userContext);
    // Dispatch custom event for same-tab notifications
    window.dispatchEvent(
      new CustomEvent(AUTH_STATE_CHANGE_EVENT, {
        detail: { type: "login", hasToken: true },
      }),
    );
  } catch (error) {
    console.error("[Auth] Failed to set auth data:", error);
    throw error;
  }
}

export function clearAllAuth() {
  try {
    localStorage.removeItem(ID_TOKEN_KEY);
    localStorage.removeItem(USER_CONTEXT_KEY);
    localStorage.removeItem(CODE_VERIFIER_KEY);
    localStorage.removeItem(OAUTH_STATE_KEY);
    // Dispatch custom event for same-tab notifications
    window.dispatchEvent(
      new CustomEvent(AUTH_STATE_CHANGE_EVENT, {
        detail: { type: "logout", hasToken: false },
      }),
    );
  } catch (error) {
    console.error("[Auth] Failed to clear auth:", error);
  }
}

export function storeCodeVerifier(codeVerifier: string) {
  localStorage.setItem(CODE_VERIFIER_KEY, codeVerifier);
}

export function readCodeVerifier(): string | null {
  return localStorage.getItem(CODE_VERIFIER_KEY);
}

export function clearCodeVerifier() {
  localStorage.removeItem(CODE_VERIFIER_KEY);
}

export function storeOAuthState(state: string) {
  localStorage.setItem(OAUTH_STATE_KEY, state);
}

export function readOAuthState(): string | null {
  return localStorage.getItem(OAUTH_STATE_KEY);
}

export function clearOAuthState() {
  localStorage.removeItem(OAUTH_STATE_KEY);
}

export function isAuthenticated(): boolean {
  return getIdToken() !== null;
}

export function logCurrentAuth(context: string) {
  if (import.meta.env.DEV) {
    const idToken = getIdToken();
    const userContext = getUserContext();
    if (idToken) {
      console.log(
        `[Auth] ${context} - id_token present (length: ${idToken.length}), user: ${userContext?.email ?? "unknown"}`,
      );
    } else {
      console.log(`[Auth] ${context} - no id_token found`);
    }
  }
}

/**
 * Decode JWT token payload without verification
 * Note: This only decodes the payload, it does NOT verify the signature
 */
function decodeJWT(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = atob(parts[1]);
    return JSON.parse(payload);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("[Auth] Failed to decode JWT:", error);
    }
    return null;
  }
}

/**
 * Get user context from stored user context (set during token exchange)
 * and optionally enriched from id_token claims.
 * Returns null if no auth data is available.
 */
export function getUserContextFromToken(): {
  userId: string;
  email: string | null;
  tenantId: string | null;
} | null {
  // Primary: use stored user context from token exchange
  const stored = getUserContext();
  if (stored) {
    return {
      userId: stored.user_id,
      email: stored.email,
      tenantId: stored.tenant_id,
    };
  }

  // Fallback: decode id_token for basic claims
  const idToken = getIdToken();
  if (!idToken) return null;

  const payload = decodeJWT(idToken);
  if (!payload) return null;

  const userId = (payload.sub as string) || (payload.user_id as string);
  const email = (payload.email as string | undefined) || null;

  if (!userId) return null;

  return {
    userId,
    email,
    tenantId: null, // id_token may not have tenant_id
  };
}
