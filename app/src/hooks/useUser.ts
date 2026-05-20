import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authService, ApiError, type User } from "../services";

interface UseUserResult {
  user: User | null;
  loading: boolean;
  error: Error | null;
  isConnectionError: boolean;
  refetch: () => Promise<void>;
}

const USER_QUERY_KEY = ["auth", "me"] as const;

function isNetworkError(err: unknown): boolean {
  if (!err) return false;
  if (err instanceof ApiError && err.statusCode === 0) return true;
  if (err instanceof Error) {
    const m = err.message.toLowerCase();
    return (
      m.includes("failed to fetch") ||
      m.includes("network") ||
      m.includes("timeout") ||
      err.name === "TypeError"
    );
  }
  return false;
}

/**
 * Hook to read the current authenticated user.
 *
 * Backed by React Query so every call site in a render tree shares
 * the same in-flight request and result — the previous useState
 * implementation fired one `/api/v1/auth/me` per mounted consumer,
 * which on the dashboard route piled up 10–15 duplicate requests and
 * blocked downstream tenant-scoped queries (team-members, etc.) from
 * starting until they all settled. The query key is fixed and the
 * data is cached for 5 minutes; one fetch covers the whole tree.
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
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const query = useQuery<User, Error>({
    queryKey: USER_QUERY_KEY,
    queryFn: () => authService.getMe(),
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
    retry: (failureCount, err) => {
      // Don't retry 401 — caller will be redirected to login.
      if (err instanceof ApiError && err.statusCode === 401) return false;
      return failureCount < 1;
    },
  });

  // Redirect on 401. Kept here (not in queryFn) so the navigation is
  // tied to React's lifecycle and only fires once the route is mounted.
  useEffect(() => {
    if (query.error instanceof ApiError && query.error.statusCode === 401) {
      if (import.meta.env.DEV) {
        console.error("[useUser] Unauthorized, redirecting to login");
      }
      navigate("/", { replace: true });
    }
  }, [query.error, navigate]);

  return useMemo<UseUserResult>(
    () => ({
      user: query.data ?? null,
      loading: query.isPending,
      error: query.error ?? null,
      isConnectionError: isNetworkError(query.error),
      refetch: async () => {
        await queryClient.invalidateQueries({ queryKey: USER_QUERY_KEY });
      },
    }),
    [query.data, query.isPending, query.error, queryClient],
  );
}
