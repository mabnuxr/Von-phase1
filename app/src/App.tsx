import { BrowserRouter, Routes, Route } from "react-router-dom";
import RootGate from "./pages/RootGate";
import Callback from "./pages/Callback";
import Conversation from "./pages/Conversation";
import NewConversation from "./pages/NewConversation";
import Analytics from "./pages/Analytics";
import Logout from "./pages/Logout";
import AuthStart from "./pages/AuthStart";
import Health from "./pages/Health";
import Settings from "./pages/Settings";
import { AuthenticatedLayout } from "./components/AuthenticatedLayout";
import { AppShell } from "./components/AppShell";
import { LaunchDarklyGate } from "./components/LaunchDarkly";
import { ConversationSkeleton } from "./components/ConversationSkeleton";

export default function App() {
  return (
    <BrowserRouter>
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
                <AppShell />
              </LaunchDarklyGate>
            }
          >
            <Route path="/chat" element={<Conversation />} />
            <Route path="/chat/new" element={<NewConversation />} />
            <Route path="/chat/:conversationId" element={<Conversation />} />
            <Route
              path="/dashboard/:dashboardId"
              element={<Analytics />}
            />
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
