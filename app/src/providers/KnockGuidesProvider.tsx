import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { KnockProvider, KnockGuideProvider } from "@knocklabs/react";
import { AUTH_STATE_CHANGE_EVENT, getUserContextFromToken } from "../lib/auth";
import { config } from "../config";
import { LaunchModal } from "../components/LaunchModal";

/**
 * Reactively tracks the current authenticated user id, recomputing on in-tab
 * auth changes (AUTH_STATE_CHANGE_EVENT) and cross-tab localStorage changes.
 * Returns null when logged out.
 */
function useCurrentUserId(): string | null {
  const [userId, setUserId] = useState<string | null>(
    () => getUserContextFromToken()?.userId ?? null,
  );

  useEffect(() => {
    const sync = () => setUserId(getUserContextFromToken()?.userId ?? null);
    window.addEventListener(AUTH_STATE_CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(AUTH_STATE_CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return userId;
}

interface KnockGuidesProviderProps {
  children: ReactNode;
}

/**
 * Mounts the Knock Guides SDK for authenticated users only and renders the
 * one-time launch modal. Logged-out users render children unchanged.
 *
 * Runs in public-key-only mode: the Knock public API key and guide channel id
 * are non-secret, client-safe values. We intentionally pass NO userToken (there
 * is no server to mint one). Show-once state is persisted server-side at Knock,
 * keyed by user id — never localStorage.
 */
export function KnockGuidesProvider({ children }: KnockGuidesProviderProps) {
  const userId = useCurrentUserId();

  // Logged out, or guides not configured for this environment: no-op passthrough.
  if (!userId || !config.knockPublicApiKey || !config.knockGuideChannelId) {
    return <>{children}</>;
  }

  return (
    <KnockProvider apiKey={config.knockPublicApiKey} user={{ id: userId }}>
      <KnockGuideProvider
        channelId={config.knockGuideChannelId}
        readyToTarget
        trackLocationFromWindow
        listenForUpdates
      >
        {children}
        <LaunchModal />
      </KnockGuideProvider>
    </KnockProvider>
  );
}
