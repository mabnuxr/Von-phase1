import { config } from "../config";
import { clearAllAuth } from "../lib/auth";

/**
 * API Error class for handling API-specific errors
 */
export class ApiError extends Error {
  statusCode: number;
  response?: unknown;

  constructor(message: string, statusCode: number, response?: unknown) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.response = response;
  }
}

/**
 * API Client configuration options
 */
export interface ApiRequestOptions extends RequestInit {
  /**
   * Custom headers to merge with defaults
   */
  headers?: HeadersInit;
}

/**
 * Extract a human-readable error message from a parsed response body.
 * Handles three server formats:
 *   1. { error: { message } }  — app standard (e.g. 409 slug conflict)
 *   2. { detail: "..." }       — FastAPI validation errors
 *   3. { message: "..." }      — generic
 */
function extractErrorMessage(
  data: unknown,
  status: number,
  statusText: string,
): string {
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    if (d.error && typeof d.error === "object") {
      const nested = d.error as Record<string, unknown>;
      if (typeof nested.message === "string" && nested.message)
        return nested.message;
    }
    if (typeof d.detail === "string" && d.detail) return d.detail;
    if (typeof d.message === "string" && d.message) return d.message;
  }
  return `API request failed: ${status} ${statusText}`;
}

/**
 * Extract the error code from a parsed response body.
 * Handles { error: { code } } and legacy { error: "code" }.
 */
function getErrorCode(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  if (d.error && typeof d.error === "object") {
    const nested = d.error as Record<string, unknown>;
    if (typeof nested.code === "string") return nested.code;
  }
  if (typeof d.error === "string") return d.error;
  return null;
}

/**
 * Module-level share ID store. When set, every outbound request from
 * `apiClient` carries an `X-Share-Id` header so the backend's
 * `shared_read_context` dependency can elevate the request to the
 * conversation owner's identity.
 */
let _shareId: string | null = null;

export function setShareId(id: string | null): void {
  _shareId = id;
}

export function getShareId(): string | null {
  return _shareId;
}

/**
 * Base API client for making HTTP requests to the backend
 */
export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || config.apiBaseUrl;
  }

  /**
   * Get default headers for API requests
   */
  private getDefaultHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };
    if (_shareId) {
      headers["X-Share-Id"] = _shareId;
    }
    return headers;
  }

  /**
   * Merge custom headers with default headers
   */
  private mergeHeaders(
    defaultHeaders: HeadersInit,
    customHeaders?: HeadersInit,
  ): HeadersInit {
    if (!customHeaders) return defaultHeaders;

    return {
      ...defaultHeaders,
      ...customHeaders,
    };
  }

  /**
   * Make an HTTP request
   */
  private async request<T>(
    endpoint: string,
    options: ApiRequestOptions = {},
    _isRetry = false,
  ): Promise<T> {
    const { headers: customHeaders, ...fetchOptions } = options;

    const url = `${this.baseUrl}${endpoint}`;
    const headers = this.mergeHeaders(this.getDefaultHeaders(), customHeaders);

    if (import.meta.env.DEV) {
      console.log(`[API] ${fetchOptions.method || "GET"} ${url}`);
    }

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
        credentials: "include", // Send HttpOnly cookies with every request
      });

      // Handle non-OK responses — read as text so we can extract an error
      // message even when the body isn't valid JSON.
      if (!response.ok) {
        let errorData: unknown;
        try {
          const text = await response.text();
          if (text) errorData = JSON.parse(text);
        } catch {
          // body unreadable or not JSON — errorData stays undefined
        }

        const errorMessage = extractErrorMessage(
          errorData,
          response.status,
          response.statusText,
        );

        // Identity provider transiently unavailable (e.g. Scalekit 5xx).
        // Retry once after Retry-After; if still failing, surface the error
        // but keep the session intact — the next call can succeed once the
        // provider recovers.
        if (
          response.status === 503 &&
          getErrorCode(errorData) === "identity_provider_unavailable" &&
          !_isRetry
        ) {
          const retryAfter =
            parseInt(response.headers.get("Retry-After") || "2", 10) || 2;
          if (import.meta.env.DEV) {
            console.log(
              `[API] 503 identity_provider_unavailable - retrying in ${retryAfter}s`,
            );
          }
          await new Promise((resolve) =>
            setTimeout(resolve, retryAfter * 1000),
          );
          return this.request<T>(endpoint, options, true);
        }

        // Handle 401 Unauthorized
        if (response.status === 401) {
          const errorCode = getErrorCode(errorData);
          if (import.meta.env.DEV) {
            console.log(
              "[API] 401 Unauthorized - session expired, logging out",
            );
          }

          // Token refresh in progress on the backend — wait and retry once
          if (errorCode === "refresh_in_progress" && !_isRetry) {
            const retryAfter =
              parseInt(response.headers.get("Retry-After") || "1", 10) || 1;
            await new Promise((resolve) =>
              setTimeout(resolve, retryAfter * 1000),
            );
            return this.request<T>(endpoint, options, true);
          }

          clearAllAuth();
          setTimeout(() => {
            window.location.href = "/";
          }, 100);
          throw new ApiError(errorMessage, response.status, errorData);
        }

        throw new ApiError(errorMessage, response.status, errorData);
      }

      // Handle empty responses (204 No Content)
      if (response.status === 204) {
        return undefined as T;
      }

      // OK response — let response.json() parse and throw on malformed JSON
      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      // Network errors or other fetch errors
      const message =
        error instanceof Error ? error.message : "An unknown error occurred";
      throw new ApiError(message, 0);
    }
  }

  /**
   * Make a GET request
   */
  async get<T>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "GET",
    });
  }

  /**
   * Make a POST request
   */
  async post<T>(
    endpoint: string,
    data?: unknown,
    options?: ApiRequestOptions,
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * Make a POST request with form-urlencoded body (e.g. Pusher auth)
   */
  async postForm<T>(
    endpoint: string,
    body: URLSearchParams,
    options?: ApiRequestOptions,
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        ...(options?.headers as Record<string, string>),
      },
      body,
    });
  }

  /**
   * Make a POST request with a multipart/form-data body.
   *
   * Bypasses `request()` because that method always sets
   * `Content-Type: application/json` from defaults, which would strip the
   * multipart boundary the browser needs to insert. Here, we deliberately do
   * NOT set Content-Type — fetch derives it from the FormData and includes
   * the boundary automatically.
   */
  async postMultipart<T>(
    endpoint: string,
    body: FormData,
    _isRetry = false,
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = { Accept: "application/json" };
    if (_shareId) {
      headers["X-Share-Id"] = _shareId;
    }

    if (import.meta.env.DEV) {
      console.log(`[API] POST (multipart) ${url}`);
    }

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers,
        body,
        credentials: "include",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An unknown error occurred";
      throw new ApiError(message, 0);
    }

    if (!response.ok) {
      let errorData: unknown;
      try {
        const text = await response.text();
        if (text) errorData = JSON.parse(text);
      } catch {
        // body unreadable or not JSON
      }

      const errorMessage = extractErrorMessage(
        errorData,
        response.status,
        response.statusText,
      );

      if (response.status === 401) {
        const errorCode = getErrorCode(errorData);

        // Token refresh in progress on the backend — wait and retry once.
        // Mirrors the same handling in request() so multipart uploads don't
        // force a logout during a benign refresh window.
        if (errorCode === "refresh_in_progress" && !_isRetry) {
          const retryAfter =
            parseInt(response.headers.get("Retry-After") || "1", 10) || 1;
          await new Promise((resolve) =>
            setTimeout(resolve, retryAfter * 1000),
          );
          return this.postMultipart<T>(endpoint, body, true);
        }

        if (import.meta.env.DEV) {
          console.log("[API] 401 Unauthorized on multipart upload");
        }
        clearAllAuth();
        setTimeout(() => {
          window.location.href = "/";
        }, 100);
      }

      throw new ApiError(errorMessage, response.status, errorData);
    }

    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  }

  /**
   * Make a PUT request
   */
  async put<T>(
    endpoint: string,
    data?: unknown,
    options?: ApiRequestOptions,
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * Make a PATCH request
   */
  async patch<T>(
    endpoint: string,
    data?: unknown,
    options?: ApiRequestOptions,
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * Make a DELETE request
   */
  async delete<T>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "DELETE",
    });
  }
}

// Export a default instance
export const apiClient = new ApiClient();
