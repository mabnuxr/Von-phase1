import { useEffect } from "react";
import { startAuthorization } from "../lib/authFlow";
import { logCurrentToken } from "../lib/auth";

export default function RootGate() {
  useEffect(() => {
    logCurrentToken("on site load");
    const t = setTimeout(() => {
      startAuthorization();
    }, 300);
    return () => clearTimeout(t);
  }, []);
  return <div>Redirecting to sign-in...</div>;
}
