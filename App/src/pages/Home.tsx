//
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();
  return (
    <div style={{ padding: 24 }}>
      <h1>RevenueOS Auth Demo (PKCE)</h1>
      <p>Use the button below to start SSO with ScaleKit.</p>
      <button onClick={() => navigate("/login")}>Enterprise Login</button>
    </div>
  );
}
