import { useContext } from "react";
import { ToastContext } from "../contexts/toastContextValue";

/**
 * Hook to show toast notifications
 *
 * @example
 * ```tsx
 * const { showToast } = useToast();
 *
 * // Success toast
 * showToast({ message: "Saved successfully", variant: "success" });
 *
 * // Toast with action
 * showToast({
 *   message: "New insight extracted",
 *   variant: "info",
 *   action: { label: "View", onClick: () => navigate("/settings") }
 * });
 * ```
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
