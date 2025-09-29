import { useEffect, useRef } from "react";
import {
  AUTH_STATE_CHANGE_EVENT,
  type AuthStateChangeEvent,
} from "../lib/auth";

/**
 * React hook to listen for auth state changes within the same tab
 * @param callback - Function to call when auth state changes
 *
 * @example
 * useAuthStateListener((event) => {
 *   if (event.detail.type === 'login') {
 *     // Handle login
 *   } else if (event.detail.type === 'logout') {
 *     // Handle logout
 *   }
 * });
 */
export function useAuthStateListener(
  callback: (event: AuthStateChangeEvent) => void,
): void {
  // Use ref to maintain stable reference to callback
  const callbackRef = useRef(callback);

  // Update ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const handleAuthChange = (event: Event) => {
      callbackRef.current(event as AuthStateChangeEvent);
    };

    window.addEventListener(AUTH_STATE_CHANGE_EVENT, handleAuthChange);
    return () => {
      window.removeEventListener(AUTH_STATE_CHANGE_EVENT, handleAuthChange);
    };
  }, []); // Empty dependency array - set up once
}