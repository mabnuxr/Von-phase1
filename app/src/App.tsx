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
import People from "./pages/People";
import Teams from "./pages/Teams";
import TeamMemory from "./pages/TeamMemory";
import Permissions from "./pages/Permissions";
import RoleDetail from "./pages/RoleDetail";
import PrototypeComponents from "./pages/PrototypeComponents";
import Prototype from "./pages/Prototype";
import SharedConversation from "./pages/SharedConversation";
import MockDashboard from "./pages/MockDashboard";
import { AuthenticatedLayout } from "./components/AuthenticatedLayout";
import { AppShell } from "./components/AppShell";
import { LaunchDarklyGate } from "./components/LaunchDarkly";
import { RequirePermission } from "./components/RequirePermission";
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
        {/* Standalone dev/review routes — no auth wrapper, no layout constraints */}
        <Route path="/prototype/components" element={<PrototypeComponents />} />

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
            <Route path="/prototype/:scenarioId" element={<Prototype />} />
            {/* Owned-conversation viewer is Admin/Member only — View Only
                users have no access to someone else's chat by ID and must
                go through /shared/:shareId for read-only access. */}
            <Route
              path="/chat/:conversationId"
              element={
                <RequirePermission
                  allow={(p) => !p.isViewOnly}
                  redirectTo="/chat/new"
                >
                  <Conversation />
                </RequirePermission>
              }
            />
            <Route path="/dashboard/q2-pipeline-review" element={<MockDashboard />} />
            <Route path="/dashboard/:dashboardId" element={<Analytics />} />
            <Route path="/redirecting" element={<Redirecting />} />
            {/* Shared chat — read-only, rendered inside AppShell (with sidebar) */}
            <Route path="/shared/:shareId" element={<SharedConversation />} />
          </Route>

          {/* Memory pages */}
          <Route path="/settings/memory/team" element={<TeamMemory />} />

          {/* RBAC pages */}
          <Route path="/settings/people" element={<People />} />
          <Route path="/settings/teams" element={<Teams />} />
          <Route path="/settings/permissions" element={<Permissions />} />
          <Route path="/settings/permissions/:role" element={<RoleDetail />} />

          {/* Settings has its own sidebar. View Only users are bounced
              to /chat at render time so the page never flashes. */}
          <Route
            path="/settings"
            element={
              <RequirePermission
                allow={(p) => !p.isViewOnly}
                redirectTo="/chat/new"
              >
                <LaunchDarklyGate
                  fallback={
                    <div className="h-screen bg-gray-100 animate-pulse" />
                  }
                >
                  <Settings />
                </LaunchDarklyGate>
              </RequirePermission>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
