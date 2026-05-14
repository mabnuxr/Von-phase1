import { useEffect } from "react";
import { useUser } from "./useUser";
import { registerPosthogSuperProps } from "../lib/posthog";

let superPropsRegistered = false;

/**
 * Registers user context as PostHog super properties once per session.
 * Call this from AuthenticatedLayout so it runs for every authenticated route.
 */
export function usePosthogSuperProps() {
  const { user } = useUser();

  useEffect(() => {
    if (!user || superPropsRegistered) return;
    registerPosthogSuperProps(user);
    superPropsRegistered = true;
  }, [user]);
}
