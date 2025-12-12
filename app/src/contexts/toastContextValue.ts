import { createContext } from "react";
import type { ToastVariant, ToastAction } from "@vonlabs/design-components";
import type { ReactNode } from "react";

export interface ToastData {
  id: string;
  message: string;
  variant?: ToastVariant;
  action?: ToastAction;
  icon?: ReactNode;
  autoDismissMs?: number;
}

export interface ToastContextValue {
  showToast: (toast: Omit<ToastData, "id">) => void;
}

export const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});
