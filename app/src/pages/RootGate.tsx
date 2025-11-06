import { useEffect } from "react";
import { startAuthorization } from "../lib/authFlow";
import { getAccessToken, logCurrentToken } from "../lib/auth";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function RootGate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isLoggedOut = searchParams.get("logged_out") === "true";

  useEffect(() => {
    if (import.meta.env.DEV) {
      logCurrentToken("on site load");
    }

    // If user just logged out from ScaleKit, show confirmation
    if (isLoggedOut) {
      return;
    }

    // Check if user already has a token
    const token = getAccessToken();
    if (token) {
      // User is authenticated, go to chat
      navigate("/chat", { replace: true });
    } else {
      // No token, redirect to ScaleKit auth
      const t = setTimeout(() => {
        startAuthorization();
      }, 300);
      return () => clearTimeout(t);
    }
  }, [navigate, isLoggedOut]);

  // Show logout confirmation if coming back from ScaleKit logout
  if (isLoggedOut) {
    return (
      <div className="p-6">
        <h1>Successfully logged out</h1>
        <p>You have been logged out from your account.</p>
        <button
          onClick={() => {
            navigate("/", { replace: true });
          }}
          className="mt-5 px-5 py-2.5 bg-[#007bff] text-white border-0 rounded cursor-pointer text-base hover:bg-[#0056b3] transition-colors"
        >
          Login Again
        </button>
      </div>
    );
  }

  return <div className="p-6">Redirecting to sign-in...</div>;
}
