import { useContext } from "react";
import { AppShellContext } from "../contexts/AppShellContext";

/**
 * Consumer hook for AppShell context.
 * Must be used within a page rendered inside the AppShell layout route.
 */
export function useAppShell() {
  const context = useContext(AppShellContext);
  if (!context) {
    throw new Error("useAppShell must be used within an AppShell");
  }
  return context;
}
