import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, ApiError, type User } from '../services';

interface UseUserResult {
  user: User | null;
  loading: boolean;
  error: Error | null;
  isConnectionError: boolean;
  refetch: () => Promise<void>;
}

/**
 * Custom hook to fetch and manage current user state
 *
 * @returns Object containing user data, loading state, error, and refetch function
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, loading, error } = useUser();
 *
 *   if (loading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *   if (!user) return null;
 *
 *   return <div>Hello, {user.name}!</div>;
 * }
 * ```
 */
export function useUser(): UseUserResult {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isConnectionError, setIsConnectionError] = useState(false);
  const navigate = useNavigate();

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setIsConnectionError(false);

      const userData = await authService.getMe();
      setUser(userData);

      if (import.meta.env.DEV) {
        console.log('[useUser] User data fetched successfully:', userData);
      }
    } catch (err) {
      const error = err as Error;
      setError(error);

      // Detect connection errors (network failures, timeouts, etc.)
      const isNetworkError =
        (err instanceof ApiError && err.statusCode === 0) ||
        error.message.toLowerCase().includes('failed to fetch') ||
        error.message.toLowerCase().includes('network') ||
        error.message.toLowerCase().includes('timeout') ||
        error.name === 'TypeError';

      setIsConnectionError(isNetworkError);

      // Handle 401 Unauthorized - redirect to login
      if (err instanceof ApiError && err.statusCode === 401) {
        if (import.meta.env.DEV) {
          console.error('[useUser] Unauthorized, redirecting to login');
        }
        navigate('/', { replace: true });
      } else if (isNetworkError) {
        if (import.meta.env.DEV) {
          console.error('[useUser] Connection error:', error);
        }
      } else {
        if (import.meta.env.DEV) {
          console.error('[useUser] Failed to fetch user:', error);
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return {
    user,
    loading,
    error,
    isConnectionError,
    refetch: fetchUser,
  };
}
