import { useState, useCallback } from "react";
import { type User } from "../services";
import { mockUser } from "../mocks/dashboardMockData";

interface UseUserResult {
  user: User | null;
  loading: boolean;
  error: Error | null;
  isConnectionError: boolean;
  refetch: () => Promise<void>;
}

export function useUser(): UseUserResult {
  const [user] = useState<User | null>(mockUser as User);
  const refetch = useCallback(async () => {}, []);

  return {
    user,
    loading: false,
    error: null,
    isConnectionError: false,
    refetch,
  };
}
