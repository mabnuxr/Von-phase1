//
import { useNavigate } from "react-router-dom";
import { startAuthorization } from "../lib/authFlow";

export default function Login() {
  const navigate = useNavigate();

  async function start() {
    await startAuthorization();
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>Login</h2>
      <button onClick={start}>Continue with SSO</button>
      <button onClick={() => navigate("/")}>Back</button>
    </div>
  );
}
