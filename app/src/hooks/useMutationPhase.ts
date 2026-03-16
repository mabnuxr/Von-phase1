import { useState, useEffect, useRef } from "react";

export type MutationPhase = "idle" | "pending" | "success";

/**
 * Derives a UI phase from a TanStack mutation's state.
 *
 * Tracks the pending→success transition and auto-resets to "idle"
 * after `successDuration` ms.
 *
 * @example
 * const phase = useMutationPhase(mutation.isPending, mutation.isSuccess);
 * // phase: "idle" → "pending" → "success" (1.5s) → "idle"
 */
export function useMutationPhase(
  isPending: boolean,
  isSuccess: boolean,
  successDuration = 1500,
): MutationPhase {
  const [showSuccess, setShowSuccess] = useState(false);
  const wasPendingRef = useRef(false);

  useEffect(() => {
    if (isPending) {
      wasPendingRef.current = true;
      setShowSuccess(false);
    } else if (wasPendingRef.current && isSuccess) {
      wasPendingRef.current = false;
      setShowSuccess(true);
      const t = setTimeout(() => setShowSuccess(false), successDuration);
      return () => clearTimeout(t);
    }
  }, [isPending, isSuccess, successDuration]);

  if (isPending) return "pending";
  if (showSuccess) return "success";
  return "idle";
}
