import { Outlet } from "react-router-dom";
import { useLaunchDarklyIdentify } from "../hooks/useLaunchDarklyIdentify";
import { LaunchDarklyIdentityContext } from "./LaunchDarkly";
import { GlobalChatProvider } from "../providers/GlobalChat";
import { PermissionsProvider } from "../contexts/PermissionsContext";

export function AuthenticatedLayout() {
  const { isIdentified } = useLaunchDarklyIdentify();

  return (
    <GlobalChatProvider>
      <LaunchDarklyIdentityContext.Provider value={isIdentified}>
        <PermissionsProvider>
          <Outlet />
        </PermissionsProvider>
      </LaunchDarklyIdentityContext.Provider>
    </GlobalChatProvider>
  );
}
