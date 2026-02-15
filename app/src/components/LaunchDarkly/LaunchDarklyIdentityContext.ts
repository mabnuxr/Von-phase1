import { createContext } from "react";

/**
 * Context that indicates whether the LaunchDarkly user identity has been resolved.
 * Set by AuthenticatedLayout after `ldClient.identify()` completes.
 */
export const LaunchDarklyIdentityContext = createContext(false);
