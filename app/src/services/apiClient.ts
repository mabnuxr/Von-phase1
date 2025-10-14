import { config } from "../config";
import { getAccessToken, clearAllAuth } from "../lib/auth";

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
   * Skip authorization header
   */
  skipAuth?: boolean;
  /**
   * Custom headers to merge with defaults
   */
  headers?: HeadersInit;
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
  private getDefaultHeaders(skipAuth = false): HeadersInit {
    const headers: HeadersInit = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };

    // Add authorization header if not skipped and token exists
    if (!skipAuth) {
      const token = getAccessToken();
      if (token) {
        const trimmedToken = token.trim();
        if (trimmedToken) {
          headers.Authorization = `Bearer ${trimmedToken}`;
        } else if (import.meta.env.DEV) {
          console.warn("[API] Empty access token found");
        }
      }
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
  ): Promise<T> {
    const {
      skipAuth = false,
      headers: customHeaders,
      ...fetchOptions
    } = options;

    const url = `${this.baseUrl}${endpoint}`;
    const headers = this.mergeHeaders(
      this.getDefaultHeaders(skipAuth),
      customHeaders,
    );

    if (import.meta.env.DEV) {
      console.log(`[API] ${fetchOptions.method || "GET"} ${url}`);
    }

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
      });

      // Handle non-OK responses
      if (!response.ok) {
        let errorMessage = `API request failed: ${response.status} ${response.statusText}`;
        let errorData: unknown;

        try {
          errorData = await response.json();
          if (
            typeof errorData === "object" &&
            errorData !== null &&
            "message" in errorData
          ) {
            errorMessage = (errorData as { message: string }).message;
          }
        } catch {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }

        // Handle 401 Unauthorized - clear auth and redirect to login
        if (response.status === 401) {
          clearAllAuth();
          window.location.href = "/";
          throw new ApiError(errorMessage, response.status, errorData);
        }

        throw new ApiError(errorMessage, response.status, errorData);
      }

      // Handle empty responses (204 No Content)
      if (response.status === 204) {
        return undefined as T;
      }

      // Parse JSON response
      const data = await response.json();
      return data as T;
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
