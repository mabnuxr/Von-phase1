import { useCallback, useState } from "react";

export function useLaunchDarklyIdentify() {
  const [isIdentified] = useState(true);
  const identifyUser = useCallback(async () => {}, []);
  return { identifyUser, isIdentified };
}
