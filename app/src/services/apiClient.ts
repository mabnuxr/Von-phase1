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
    return {
      Accept: "application/json",
      "Content-Type": "application/json",
    };
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
  ): Promise<T> {
    const {
      headers: customHeaders,
      ...fetchOptions
    } = options;

    const url = `${this.baseUrl}${endpoint}`;
    const headers = this.mergeHeaders(
      this.getDefaultHeaders(),
      customHeaders,
    );

    if (import.meta.env.DEV) {
      console.log(`[API] ${fetchOptions.method || "GET"} ${url}`);
    }

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
        credentials: "include", // Send HttpOnly cookies with every request
      });

      // Read the body once — response body is a one-time readable stream
      let responseData: unknown;
      if (response.status !== 204) {
        try {
          const text = await response.text();
          if (text) responseData = JSON.parse(text);
        } catch {
          // not JSON — responseData stays undefined
        }
      }

<<<<<<< abhishek-commands-ux
      // Handle non-OK responses
      if (!response.ok) {
        const errorMessage = extractErrorMessage(
          responseData,
          response.status,
          response.statusText,
        );

        // Handle 401 Unauthorized
        if (response.status === 401) {
          const errorCode = getErrorCode(responseData);
          if (import.meta.env.DEV) {
            console.log(
              `[API] 401 Unauthorized - error code: ${errorCode}, message: ${errorMessage}`,
            );
=======
        // Handle 401 Unauthorized — backend middleware handles transparent
        // token refresh, so a 401 means the session is truly expired
        if (response.status === 401) {
          if (import.meta.env.DEV) {
            console.log("[API] 401 Unauthorized - session expired, logging out");
>>>>>>> main
          }
          clearAllAuth();
          setTimeout(() => {
            window.location.href = "/";
          }, 100);
<<<<<<< abhishek-commands-ux
          throw new ApiError(errorMessage, response.status, responseData);
=======

          throw new ApiError(errorMessage, response.status, errorData);
>>>>>>> main
        }

        throw new ApiError(errorMessage, response.status, responseData);
      }

      // Handle empty responses (204 No Content)
      if (response.status === 204) {
        return undefined as T;
      }

      return responseData as T;
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
