import { useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { usePostHog } from "@posthog/react";
import RootGate from "./pages/RootGate";
import Callback from "./pages/Callback";
import Conversation from "./pages/Conversation";
import NewConversation from "./pages/NewConversation";
import Analytics from "./pages/Analytics";
import Logout from "./pages/Logout";
import AuthStart from "./pages/AuthStart";
import Health from "./pages/Health";
import Redirecting from "./pages/Redirecting";
import Settings from "./pages/Settings";
import SharedConversation from "./pages/SharedConversation";
import { AuthenticatedLayout } from "./components/AuthenticatedLayout";
import { AppShell } from "./components/AppShell";
import { LaunchDarklyGate } from "./components/LaunchDarkly";
import { NavigationGuardProvider } from "./providers/NavigationGuard";
import { ConversationSkeleton } from "./components/ConversationSkeleton";

function PostHogPageviewTracker() {
  const location = useLocation();
  const posthog = usePostHog();

  useEffect(() => {
    posthog?.capture("$pageview");
  }, [location.pathname, posthog]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <PostHogPageviewTracker />
      <Routes>
        {/* Public routes */}
        <Route path="/health" element={<Health />} />
        <Route path="/" element={<RootGate />} />
        <Route path="/callback" element={<Callback />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/auth/start" element={<AuthStart />} />

        {/* Authenticated routes - wrapped with LaunchDarkly identification */}
        <Route element={<AuthenticatedLayout />}>
          {/* Pages with sidebar shell */}
          <Route
            element={
              <LaunchDarklyGate fallback={<ConversationSkeleton />}>
                <NavigationGuardProvider>
                  <AppShell />
                </NavigationGuardProvider>
              </LaunchDarklyGate>
            }
          >
            <Route path="/chat" element={<Navigate to="/chat/new" replace />} />
            <Route path="/chat/new" element={<NewConversation />} />
            <Route path="/chat/:conversationId" element={<Conversation />} />
            <Route path="/dashboard/:dashboardId" element={<Analytics />} />
            <Route path="/redirecting" element={<Redirecting />} />
            {/* Shared chat — read-only, rendered inside AppShell (with sidebar) */}
            <Route path="/shared/:shareId" element={<SharedConversation />} />
          </Route>

          {/* Settings has its own sidebar */}
          <Route
            path="/settings"
            element={
              <LaunchDarklyGate
                fallback={
                  <div className="h-screen bg-gray-100 animate-pulse" />
                }
              >
                <Settings />
              </LaunchDarklyGate>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
