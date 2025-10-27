import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { preferencesService } from "../services";
import type { PreferencesData } from "../services/preferencesService";
import { useDebounce } from "./useDebounce";
import { useRef, useCallback } from "react";
import {
  PREFERENCES_STALE_TIME,
  PREFERENCES_DEBOUNCE_DELAY,
} from "../config/constants";

/**
 * Query keys for preferences - scoped by tenant and user
 *
 * IMPORTANT: Including tenantId and userId prevents cache collisions
 * and unnecessary refetching when the same user revisits Settings.
 */
export const preferencesKeys = {
  all: ["preferences"] as const,
  byUser: (tenantId: string, userId: string) =>
    [...preferencesKeys.all, tenantId, userId] as const,
};

/**
 * Fetch user preferences with React Query
 *
 * Query key includes tenantId and userId to:
 * - Prevent refetching for same user (cached)
 * - Automatically refetch when user/tenant changes
 * - Isolate preferences per user/tenant
 *
 * @param tenantId - Current tenant ID from user context
 * @param userId - Current user ID from user context
 */
export function usePreferences(
  tenantId: string | undefined,
  userId: string | undefined,
) {
  return useQuery({
    queryKey:
      tenantId && userId
        ? preferencesKeys.byUser(tenantId, userId)
        : ["preferences", "loading"], // Fallback key while user loads
    queryFn: () => preferencesService.getPreferences(),
    enabled: !!tenantId && !!userId, // Only fetch when user context is available
    staleTime: PREFERENCES_STALE_TIME,
  });
}

/**
 * Update user preferences with optimized debouncing and cache management
 *
 * Features:
 * - Debounced updates (2s delay after last change)
 * - Optimistic updates for instant UI feedback
 * - Automatic rollback on error
 * - Manual save trigger available
 * - Scoped cache invalidation per user/tenant
 */
export function useUpdatePreferences(
  tenantId: string | undefined,
  userId: string | undefined,
) {
  const queryClient = useQueryClient();
  const pendingUpdateRef = useRef<Partial<PreferencesData> | null>(null);

  const mutation = useMutation({
    mutationFn: (data: Partial<PreferencesData>) =>
      preferencesService.updatePreferences(data),

    // OPTIMISTIC UPDATE: Update cache immediately (instant UI feedback)
    onMutate: async (newData) => {
      if (!tenantId || !userId) return;

      // Cancel any outgoing refetches (important for race conditions)
      await queryClient.cancelQueries({
        queryKey: preferencesKeys.byUser(tenantId, userId),
      });

      // Snapshot previous value for rollback
      const previousPreferences = queryClient.getQueryData<PreferencesData>(
        preferencesKeys.byUser(tenantId, userId),
      );

      // Optimistically update cache (instant UI update)
      if (previousPreferences) {
        queryClient.setQueryData<PreferencesData>(
          preferencesKeys.byUser(tenantId, userId),
          { ...previousPreferences, ...newData },
        );
      }

      return { previousPreferences };
    },

    // ERROR HANDLING: Rollback optimistic update on failure
    onError: (err, _newData, context) => {
      if (!tenantId || !userId) return;

      // Rollback to previous state
      if (context?.previousPreferences) {
        queryClient.setQueryData(
          preferencesKeys.byUser(tenantId, userId),
          context.previousPreferences,
        );
      }
      console.error("[useUpdatePreferences] Save failed:", err);
    },

    // SUCCESS: Update cache with server response (NO invalidation needed!)
    onSuccess: (serverData) => {
      if (!tenantId || !userId) return;

      // Update cache with fresh data from server
      // This is MORE EFFICIENT than invalidating because:
      // 1. We already have the latest data (from mutation response)
      // 2. No extra API call needed
      // 3. Cache is now fresh and correct
      queryClient.setQueryData(
        preferencesKeys.byUser(tenantId, userId),
        serverData,
      );

      // Clear pending updates
      pendingUpdateRef.current = null;
    },
  });

  // Debounced mutation trigger
  const debouncedMutate = useDebounce(() => {
    if (pendingUpdateRef.current) {
      mutation.mutate(pendingUpdateRef.current);
    }
  }, PREFERENCES_DEBOUNCE_DELAY);

  // Queue update for debounced save
  const queueUpdate = useCallback(
    (data: Partial<PreferencesData>) => {
      // Accumulate changes in pending update
      pendingUpdateRef.current = {
        ...pendingUpdateRef.current,
        ...data,
      };

      // Restart debounce timer
      debouncedMutate();
    },
    [debouncedMutate],
  );

  // Manual save (immediate, bypasses debounce)
  const saveNow = useCallback(() => {
    if (pendingUpdateRef.current) {
      mutation.mutate(pendingUpdateRef.current);
    }
  }, [mutation]);

  return {
    queueUpdate, // Auto-save with debouncing
    saveNow, // Manual save (bypasses debounce)
    isSaving: mutation.isPending, // Show "Saving..." indicator
    error: mutation.error, // Show error if save fails
  };
}
