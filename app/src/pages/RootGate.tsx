import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { startAuthorization } from "../lib/authFlow";
import { getAccessToken, logCurrentToken } from "../lib/auth";

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
      // User is authenticated, go to dashboard
      navigate("/dashboard", { replace: true });
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
      <div style={{ padding: 24 }}>
        <h1>Successfully logged out</h1>
        <p>You have been logged out from your account.</p>
        <button
          onClick={() => {
            // Remove the logged_out param and start fresh auth
            navigate("/", { replace: true });
          }}
          style={{
            marginTop: 20,
            padding: "10px 20px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontSize: "16px"
          }}
        >
          Login Again
        </button>
      </div>
    );
  }

  return <div style={{ padding: 24 }}>Redirecting to sign-in...</div>;
}
