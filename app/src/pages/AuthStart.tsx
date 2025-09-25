import { useEffect } from "react";
import { startAuthorization } from "../lib/authFlow";

export default function AuthStart() {
  useEffect(() => {
    startAuthorization();
  }, []);
  return <div>Redirecting to sign-in...</div>;
}
