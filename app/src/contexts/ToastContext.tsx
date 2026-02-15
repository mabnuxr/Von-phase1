import { useState, useCallback, type ReactNode } from "react";
import { Toast } from "@vonlabs/design-components";
import { ToastContext, type ToastData } from "./toastContextValue";

interface ToastProviderProps {
  children: ReactNode;
}

/**
 * ToastProvider - Global toast notification manager
 *
 * Renders toasts in the top-right corner of the screen.
 * Supports multiple simultaneous toasts stacked vertically.
 *
 * @example
 * ```tsx
 * // In App.tsx
 * <ToastProvider>
 *   <App />
 * </ToastProvider>
 *
 * // In any component
 * const { showToast } = useToast();
 * showToast({
 *   message: "Success!",
 *   variant: "success",
 *   action: { label: "View", onClick: () => navigate("/settings") }
 * });
 * ```
 */
export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const showToast = useCallback((toast: Omit<ToastData, "id">) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast container - fixed below TopBar, right side */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            variant={toast.variant}
            action={toast.action}
            icon={toast.icon}
            autoDismissMs={toast.autoDismissMs}
            onDismiss={() => dismissToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export default ToastProvider;
