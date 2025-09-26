//
import { BrowserRouter, Routes, Route } from "react-router-dom";
import RootGate from "./pages/RootGate";
import Callback from "./pages/Callback";
import Dashboard from "./pages/Dashboard";
import Logout from "./pages/Logout";
import AuthStart from "./pages/AuthStart";
import Health from "./pages/Health";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/health" element={<Health />} />
        <Route path="/" element={<RootGate />} />
        <Route path="/callback" element={<Callback />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/auth/start" element={<AuthStart />} />
      </Routes>
    </BrowserRouter>
  );
}
