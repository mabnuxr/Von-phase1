import { useEffect } from "react";
import { useUser } from "./useUser";
import { registerPosthogSuperProps } from "../lib/posthog";

/**
 * Registers user context as PostHog super properties whenever the user changes.
 * Call this from AuthenticatedLayout so it runs for every authenticated route.
 */
export function usePosthogSuperProps() {
  const { user } = useUser();

  useEffect(() => {
    if (!user) return;
    registerPosthogSuperProps(user);
  }, [user]);
}
