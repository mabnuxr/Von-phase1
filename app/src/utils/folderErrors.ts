import { ApiError } from "../services/apiClient";

export type FolderErrorAction = "toast" | "silent";

export interface FolderErrorMapping {
  action: FolderErrorAction;
  message?: string;
  variant?: "error" | "warning" | "info";
}

/**
 * Read the standard backend error envelope `{ error: { code } }` off an
 * `ApiError`. Returns null for anything we can't classify.
 */
function getErrorCode(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null;
  const response = error.response;
  if (!response || typeof response !== "object") return null;
  const env = (response as { error?: unknown }).error;
  if (env && typeof env === "object" && "code" in env) {
    const code = (env as { code: unknown }).code;
    return typeof code === "string" ? code : null;
  }
  if (typeof env === "string") return env;
  return null;
}

const APP_ERROR_MAP: Record<string, FolderErrorMapping> = {
  APP_FOLDER_FULL: {
    action: "toast",
    message: "This folder is full. Unfile something first or raise its limit.",
    variant: "warning",
  },
  APP_FOLDER_MAX_ITEMS_INVALID: {
    action: "toast",
    message: "Folder limit can't be lower than what's already inside.",
    variant: "warning",
  },
  APP_FOLDER_ITEM_ORDER_INVALID: {
    action: "toast",
    message: "Couldn't reorder — please refresh and try again.",
    variant: "error",
  },
  APP_FOLDER_NOT_FOUND: {
    action: "toast",
    message: "That folder is no longer available.",
    variant: "error",
  },
  APP_DASHBOARD_NOT_FOUND: {
    action: "toast",
    message: "That item is no longer available.",
    variant: "error",
  },
  APP_CONVERSATION_NOT_FOUND: {
    action: "toast",
    message: "That item is no longer available.",
    variant: "error",
  },
  // "Already removed from this folder" — not worth interrupting the user.
  APP_DASHBOARD_NOT_IN_FOLDER: { action: "silent" },
  APP_CONVERSATION_NOT_IN_FOLDER: { action: "silent" },
  APP_INVALID_ITEM_TYPE: {
    action: "toast",
    message: "Invalid request — please refresh.",
    variant: "error",
  },
  APP_FOLDER_ITEM_NOT_FOUND: {
    action: "toast",
    message: "That item is no longer available.",
    variant: "error",
  },
};

/**
 * Map an `APP_*` error code to a toast payload. Falls back to a generic
 * "something went wrong" message for unknown errors. Returns `null` when the
 * caller should swallow the error silently.
 */
export function getFolderErrorToast(
  error: unknown,
  fallbackMessage: string = "Something went wrong. Please try again.",
): { message: string; variant: "error" | "warning" | "info" } | null {
  const code = getErrorCode(error);
  if (code && code in APP_ERROR_MAP) {
    const mapping = APP_ERROR_MAP[code];
    if (mapping.action === "silent") return null;
    return {
      message: mapping.message ?? fallbackMessage,
      variant: mapping.variant ?? "error",
    };
  }
  return { message: fallbackMessage, variant: "error" };
}
