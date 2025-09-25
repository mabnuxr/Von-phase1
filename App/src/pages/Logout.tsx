import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { clearAllAuth } from "../lib/auth";
import { startProviderLogout } from "../lib/authFlow";

function Logout() {
  useNavigate();
  useEffect(() => {
    clearAllAuth();
    console.log("[Auth] logout - tokens cleared");
    const t = setTimeout(() => {
      startProviderLogout();
    }, 100);
    return () => clearTimeout(t);
  }, []);
  return (
    <div>
      <h1>you are logout !</h1>
      <button onClick={() => startProviderLogout()}>Redirect to login </button>
    </div>
  );
}

export default Logout;
