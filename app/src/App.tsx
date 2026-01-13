import { BrowserRouter, Routes, Route } from "react-router-dom";
import RootGate from "./pages/RootGate";
import Callback from "./pages/Callback";
import Dashboard from "./pages/Dashboard";
import Logout from "./pages/Logout";
import AuthStart from "./pages/AuthStart";
import Health from "./pages/Health";
import Settings from "./pages/Settings";
import { AuthenticatedLayout } from "./components/AuthenticatedLayout";

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
          <Route path="/chat" element={<Dashboard />} />
          <Route path="/chat/:conversationId" element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
