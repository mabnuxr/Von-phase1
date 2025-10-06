import { apiClient } from "./apiClient";

/**
 * User information returned from /api/v1/auth/me endpoint
 */
export interface User {
  id: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  organizationId?: string;
  organizationName?: string;
  role?: string;
  permissions?: string[];
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown; // Allow additional fields
}

/**
 * Response from /api/v1/auth/logout endpoint
 */
export interface LogoutResponse {
  /**
   * URL to redirect to after logout (typically ScaleKit logout URL)
   */
  redirectUrl: string;
  /**
   * Optional message from backend
   */
  message?: string;
}

/**
 * Auth Service - Handles authentication-related API calls
 */
export class AuthService {
  /**
   * Get current authenticated user information
   *
   * @returns User object with current user's information
   * @throws {ApiError} If the request fails or user is not authenticated
   *
   * @example
   * ```ts
   * try {
   *   const user = await authService.getMe();
   *   console.log('Current user:', user);
   * } catch (error) {
   *   if (error instanceof ApiError && error.statusCode === 401) {
   *     // Handle unauthorized - redirect to login
   *   }
   * }
   * ```
   */
  async getMe(): Promise<User> {
    return apiClient.get<User>("/api/v1/auth/me");
  }

  /**
   * Logout current user and invalidate token on backend
   *
   * @returns Promise that resolves with logout response containing redirect URL
   * @throws {ApiError} If the request fails
   *
   * @example
   * ```ts
   * try {
   *   const response = await authService.logout();
   *   // Clear local tokens
   *   clearTokens();
   *   // Redirect to the URL provided by backend
   *   if (response.redirectUrl) {
   *     window.location.href = response.redirectUrl;
   *   }
   * } catch (error) {
   *   console.error('Logout failed:', error);
   *   // Still clear local tokens even if backend call fails
   *   clearTokens();
   * }
   * ```
   */
  async logout(): Promise<LogoutResponse> {
    return apiClient.post<LogoutResponse>("/api/v1/auth/logout");
  }
}

// Export a default instance
export const authService = new AuthService();
